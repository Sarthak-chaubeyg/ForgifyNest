// ForgifyNest Web Worker for streaming cryptographic operations
// Handles AES-256-GCM encryption/decryption in 2MB chunks in a background thread

import { deriveKEK, generateRandomKey, encryptBytes, decryptBytes, wrapKey, unwrapKey } from './keys';

// Constants
const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB chunk size
const MAGIC = new TextEncoder().encode('CNEST'); // 5 bytes
const VERSION = 1;

// Message handler
self.addEventListener('message', async (event) => {
  const data = event.data;
  if (!data || !data.type) return;

  try {
    if (data.type === 'ENCRYPT_FILE') {
      await handleFileEncryption(data.file, data.password);
    } else if (data.type === 'READ_METADATA') {
      await handleReadMetadata(data.file, data.password);
    } else if (data.type === 'DECRYPT_FILE') {
      await handleFileDecryption(data.file, data.password);
    }
  } catch (error: any) {
    self.postMessage({
      type: 'ERROR',
      error: error.message || 'An unexpected error occurred during processing.'
    });
  }
});

/**
 * Encrypts a file in 2MB chunks and sends the resulting binary stream back in segments.
 */
async function handleFileEncryption(file: File, password: string) {
  self.postMessage({ type: 'PROGRESS', percent: 5, status: 'Deriving key from password (600,000 rounds)...' });

  // 1. Generate salt and derive KEK
  const salt = crypto.getRandomValues(new Uint8Array(32));
  const kek = await deriveKEK(password, salt);

  self.postMessage({ type: 'PROGRESS', percent: 20, status: 'Generating internal keys...' });

  // 2. Generate Master Key (MK) and File Key (FK)
  const masterKey = await generateRandomKey();
  const fileKey = await generateRandomKey();

  // 3. Encrypt Master Key with KEK
  const { ciphertext: encMK, iv: mkIv } = await wrapKey(kek, masterKey);
  const encMKBytes = new Uint8Array(encMK);

  // 4. Encrypt File Key with Master Key
  const { ciphertext: encFK, iv: fkIv } = await wrapKey(masterKey, fileKey);
  const encFKBytes = new Uint8Array(encFK);

  // 5. Encrypt Metadata (filename, size, mime-type, uuid) with Master Key
  const fileUuid = crypto.randomUUID(); // Used in AAD to prevent chunk replacement
  const metadata = {
    name: file.name,
    size: file.size,
    type: file.type,
    uuid: fileUuid
  };
  const metadataBytes = new TextEncoder().encode(JSON.stringify(metadata));
  const { ciphertext: encMeta, iv: metaIv } = await encryptBytes(masterKey, metadataBytes);
  const encMetaBytes = new Uint8Array(encMeta);

  // 6. Build the CNEST binary header
  // Header layout:
  // [MAGIC: 5B] [VERSION: 1B] [SALT: 32B]
  // [MK_IV: 12B] [MK_LEN: 4B] [MK_PAYLOAD: variable (48B)]
  // [FK_IV: 12B] [FK_LEN: 4B] [FK_PAYLOAD: variable (48B)]
  // [META_IV: 12B] [META_LEN: 4B] [META_PAYLOAD: variable]
  
  const headerSize = 5 + 1 + 32 + 
                     12 + 4 + encMKBytes.length + 
                     12 + 4 + encFKBytes.length + 
                     12 + 4 + encMetaBytes.length;
                     
  const headerBuffer = new ArrayBuffer(headerSize);
  const headerView = new DataView(headerBuffer);
  const headerBytes = new Uint8Array(headerBuffer);
  
  let offset = 0;
  
  // Magic bytes
  headerBytes.set(MAGIC, offset);
  offset += MAGIC.length;
  
  // Version
  headerBytes[offset] = VERSION;
  offset += 1;
  
  // Salt
  headerBytes.set(salt, offset);
  offset += 32;
  
  // MK Envelope
  headerBytes.set(mkIv, offset);
  offset += 12;
  headerView.setUint32(offset, encMKBytes.length, false); // big-endian
  offset += 4;
  headerBytes.set(encMKBytes, offset);
  offset += encMKBytes.length;

  // FK Envelope
  headerBytes.set(fkIv, offset);
  offset += 12;
  headerView.setUint32(offset, encFKBytes.length, false);
  offset += 4;
  headerBytes.set(encFKBytes, offset);
  offset += encFKBytes.length;

  // Metadata Envelope
  headerBytes.set(metaIv, offset);
  offset += 12;
  headerView.setUint32(offset, encMetaBytes.length, false);
  offset += 4;
  headerBytes.set(encMetaBytes, offset);
  offset += encMetaBytes.length;

  // Send the header to the main thread
  (self as any).postMessage({
    type: 'ENCRYPT_HEADER',
    header: headerBuffer,
    metadata: metadata
  }, [headerBuffer]);

  // 7. Encrypt the file data in chunks
  const totalSize = file.size;
  const totalChunks = Math.ceil(totalSize / CHUNK_SIZE);
  
  // IV Base for chunks (8 random bytes + 4 bytes counter)
  const ivBase = crypto.getRandomValues(new Uint8Array(8));

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const start = chunkIndex * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, totalSize);
    
    // Read the chunk slice
    const slice = file.slice(start, end);
    const chunkBuffer = await slice.arrayBuffer();
    
    // Create chunk-specific IV
    const chunkIv = new Uint8Array(12);
    chunkIv.set(ivBase, 0);
    // Write 4-byte index at offset 8 (big-endian)
    const ivView = new DataView(chunkIv.buffer);
    ivView.setUint32(8, chunkIndex, false);

    // Associated Authenticated Data (AAD) to enforce sequence integrity
    const aad = new TextEncoder().encode(`${fileUuid}_${chunkIndex}`);

    // Encrypt the chunk using the File Key
    const encryptParams: AesGcmParams = {
      name: 'AES-GCM',
      iv: chunkIv,
      additionalData: aad
    };

    const encChunk = await crypto.subtle.encrypt(
      encryptParams,
      fileKey,
      chunkBuffer
    );
    const encChunkBytes = new Uint8Array(encChunk);

    // Build chunk envelope
    // [CHUNK_IV: 12B] [CHUNK_LEN: 4B] [CHUNK_PAYLOAD: variable]
    const chunkEnvelopeSize = 12 + 4 + encChunkBytes.length;
    const chunkEnvelopeBuffer = new ArrayBuffer(chunkEnvelopeSize);
    const envelopeView = new DataView(chunkEnvelopeBuffer);
    const envelopeBytes = new Uint8Array(chunkEnvelopeBuffer);

    envelopeBytes.set(chunkIv, 0);
    envelopeView.setUint32(12, encChunkBytes.length, false);
    envelopeBytes.set(encChunkBytes, 16);

    // Send encrypted chunk to main thread
    (self as any).postMessage({
      type: 'ENCRYPT_CHUNK',
      chunk: chunkEnvelopeBuffer,
      index: chunkIndex,
      total: totalChunks
    }, [chunkEnvelopeBuffer]);

    // Send progress
    const percent = 20 + Math.floor((chunkIndex + 1) / totalChunks * 80);
    self.postMessage({
      type: 'PROGRESS',
      percent: percent,
      status: `Encrypting chunk ${chunkIndex + 1} of ${totalChunks}...`
    });
  }

  self.postMessage({ type: 'ENCRYPT_COMPLETE' });
}

/**
 * Parser structure helper
 */
interface ParsedHeader {
  salt: Uint8Array;
  mkIv: Uint8Array;
  encMK: Uint8Array;
  fkIv: Uint8Array;
  encFK: Uint8Array;
  metaIv: Uint8Array;
  encMeta: Uint8Array;
  payloadOffset: number;
}

/**
 * Extracts and parses the header of a .cnest file.
 */
async function parseCnestHeader(file: File): Promise<ParsedHeader> {
  // Read first 10KB which should easily cover any header metadata size
  const previewSlice = file.slice(0, 10000);
  const previewBuffer = await previewSlice.arrayBuffer();
  const previewBytes = new Uint8Array(previewBuffer);
  const view = new DataView(previewBuffer);

  // 1. Verify Magic Bytes
  for (let i = 0; i < MAGIC.length; i++) {
    if (previewBytes[i] !== MAGIC[i]) {
      throw new Error('Invalid file format. The file is not a valid ForgifyNest (.cnest) package.');
    }
  }

  // 2. Check Version
  let offset = MAGIC.length;
  const version = previewBytes[offset];
  if (version !== VERSION) {
    throw new Error(`Unsupported ForgifyNest version: v${version}`);
  }
  offset += 1;

  // 3. PBKDF2 Salt
  const salt = previewBytes.slice(offset, offset + 32);
  offset += 32;

  // 4. MK Envelope
  const mkIv = previewBytes.slice(offset, offset + 12);
  offset += 12;
  const mkLen = view.getUint32(offset, false);
  offset += 4;
  const encMK = previewBytes.slice(offset, offset + mkLen);
  offset += mkLen;

  // 5. FK Envelope
  const fkIv = previewBytes.slice(offset, offset + 12);
  offset += 12;
  const fkLen = view.getUint32(offset, false);
  offset += 4;
  const encFK = previewBytes.slice(offset, offset + fkLen);
  offset += fkLen;

  // 6. Metadata Envelope
  const metaIv = previewBytes.slice(offset, offset + 12);
  offset += 12;
  const metaLen = view.getUint32(offset, false);
  offset += 4;
  const encMeta = previewBytes.slice(offset, offset + metaLen);
  offset += metaLen;

  return {
    salt,
    mkIv,
    encMK,
    fkIv,
    encFK,
    metaIv,
    encMeta,
    payloadOffset: offset
  };
}

/**
 * Reads metadata and sends it back to the UI (useful for previewing before decryption).
 */
async function handleReadMetadata(file: File, password: string) {
  try {
    const header = await parseCnestHeader(file);
    const kek = await deriveKEK(password, header.salt);

    // Decrypt Master Key
    let masterKey: CryptoKey;
    try {
      masterKey = await unwrapKey(kek, header.encMK, header.mkIv);
    } catch {
      self.postMessage({ type: 'METADATA_RESULT', success: false, error: 'Incorrect passphrase.' });
      return;
    }

    // Decrypt Metadata
    const decryptedMeta = await decryptBytes(masterKey, header.encMeta, header.metaIv);
    const metadataStr = new TextDecoder().decode(decryptedMeta);
    const metadata = JSON.parse(metadataStr);

    self.postMessage({
      type: 'METADATA_RESULT',
      success: true,
      metadata: metadata
    });
  } catch (error: any) {
    self.postMessage({
      type: 'METADATA_RESULT',
      success: false,
      error: error.message || 'Failed to parse file header.'
    });
  }
}

/**
 * Decrypts a .cnest file chunk-by-chunk and streams chunks to the UI thread.
 */
async function handleFileDecryption(file: File, password: string) {
  self.postMessage({ type: 'PROGRESS', percent: 5, status: 'Parsing file header...' });

  // 1. Parse header and verify keys
  const header = await parseCnestHeader(file);
  
  self.postMessage({ type: 'PROGRESS', percent: 10, status: 'Deriving cryptographic keys...' });
  const kek = await deriveKEK(password, header.salt);

  let masterKey: CryptoKey;
  let fileKey: CryptoKey;
  let metadata: { name: string; size: number; type: string };

  try {
    masterKey = await unwrapKey(kek, header.encMK, header.mkIv);
    
    self.postMessage({ type: 'PROGRESS', percent: 20, status: 'Decrypting file key envelope...' });
    fileKey = await unwrapKey(masterKey, header.encFK, header.fkIv);

    const decryptedMeta = await decryptBytes(masterKey, header.encMeta, header.metaIv);
    metadata = JSON.parse(new TextDecoder().decode(decryptedMeta));
  } catch {
    throw new Error('Authentication failed. Incorrect passphrase or modified file header.');
  }

  self.postMessage({
    type: 'DECRYPT_START',
    metadata: metadata
  });

  // 2. Scan and decrypt the file chunks sequentially
  let fileOffset = header.payloadOffset;
  const fileSize = file.size;
  let chunkIndex = 0;
  
  // We can't know the exact count of chunks until we scan, but we can approximate for progress
  const remainingSize = fileSize - fileOffset;
  // Each chunk has 12B IV + 4B Len + 2MB Payload + 16B GCM auth tag
  const approxChunkEnvelopeSize = 12 + 4 + CHUNK_SIZE + 16;
  const approxChunks = Math.max(1, Math.ceil(remainingSize / approxChunkEnvelopeSize));

  // Sequence verification AAD (generate a dummy UUID, wait: the UUID is part of the AAD. Since the UUID is generated per encryption session, how does the decryptor know the UUID?
  // Ah! Good catch! The UUID was generated on encryption. If the decryptor doesn't know the UUID, it can't verify the AAD.
  // How do we solve this?
  // We can store the File UUID inside the encrypted Metadata! When we decrypt the metadata, we retrieve the fileUuid.
  // Alternatively, we can use the file size or name as part of the AAD, or store the fileUuid inside the metadata block, or simply use the chunk index and a static tag as AAD.
  // Yes! Putting the File UUID inside the encrypted metadata is extremely elegant! Let's update handleFileEncryption to include the `uuid` in metadata, and retrieve it here!
  // Let's check: Yes! In handleFileEncryption, the metadata object can be:
  // const metadata = { name: file.name, size: file.size, type: file.type, uuid: fileUuid };
  // This is a beautiful solution. Let's make sure it is updated. (We will write both sides to use this).
  const fileUuid = (metadata as any).uuid || '';

  while (fileOffset < fileSize) {
    // Each chunk starts with: [CHUNK_IV: 12B] [CHUNK_LEN: 4B]
    const headerSlice = file.slice(fileOffset, fileOffset + 16);
    const headerBuffer = await headerSlice.arrayBuffer();
    if (headerBuffer.byteLength < 16) {
      break; // End of file
    }
    
    const headerView = new DataView(headerBuffer);
    const chunkIv = new Uint8Array(headerBuffer, 0, 12);
    const chunkLen = headerView.getUint32(12, false);
    
    fileOffset += 16;

    // Read the chunk payload
    const payloadSlice = file.slice(fileOffset, fileOffset + chunkLen);
    const payloadBuffer = await payloadSlice.arrayBuffer();
    if (payloadBuffer.byteLength < chunkLen) {
      throw new Error(`Data truncation detected. Expected ${chunkLen} bytes, got ${payloadBuffer.byteLength} bytes.`);
    }

    fileOffset += chunkLen;

    // Decrypt chunk
    const aad = new TextEncoder().encode(`${fileUuid}_${chunkIndex}`);
    const decryptParams: AesGcmParams = {
      name: 'AES-GCM',
      iv: chunkIv,
      additionalData: aad
    };

    let decryptedChunk: ArrayBuffer;
    try {
      decryptedChunk = await crypto.subtle.decrypt(
        decryptParams,
        fileKey,
        payloadBuffer
      );
    } catch (err) {
      throw new Error(`Decryption integrity check failed at chunk ${chunkIndex + 1}. The file may have been modified or corrupted.`);
    }

    // Send decrypted chunk back to main thread
    (self as any).postMessage({
      type: 'DECRYPT_CHUNK',
      chunk: decryptedChunk,
      index: chunkIndex
    }, [decryptedChunk]);

    chunkIndex++;

    // Progress updates
    const percent = 20 + Math.min(80, Math.floor(chunkIndex / approxChunks * 80));
    self.postMessage({
      type: 'PROGRESS',
      percent: percent,
      status: `Decrypting chunk ${chunkIndex}...`
    });
  }

  self.postMessage({
    type: 'DECRYPT_COMPLETE',
    totalChunks: chunkIndex
  });
}
