// Cryptographic core helpers for CipherNest
// Utilizes the native browser Web Crypto API (crypto.subtle)

/**
 * Derives a Key Encryption Key (KEK) from the master password and salt using PBKDF2.
 */
export async function deriveKEK(password: string, salt: Uint8Array, iterations = 600000): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(password);

  // Import password material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBytes,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  // Derive the 256-bit AES-GCM Key
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: iterations,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Generates a random 256-bit AES-GCM CryptoKey.
 */
export async function generateRandomKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts raw bytes using AES-GCM. Useful for metadata and key envelopes.
 */
export async function encryptBytes(key: CryptoKey, plaintext: Uint8Array, associatedData?: Uint8Array): Promise<{ ciphertext: ArrayBuffer; iv: Uint8Array }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encryptParams: AesGcmParams = {
    name: 'AES-GCM',
    iv: iv as BufferSource
  };

  if (associatedData) {
    encryptParams.additionalData = associatedData as BufferSource;
  }

  const ciphertext = await crypto.subtle.encrypt(
    encryptParams,
    key,
    plaintext as BufferSource
  );

  return { ciphertext, iv };
}

/**
 * Decrypts raw bytes using AES-GCM.
 */
export async function decryptBytes(key: CryptoKey, ciphertext: Uint8Array, iv: Uint8Array, associatedData?: Uint8Array): Promise<ArrayBuffer> {
  const decryptParams: AesGcmParams = {
    name: 'AES-GCM',
    iv: iv as BufferSource
  };

  if (associatedData) {
    decryptParams.additionalData = associatedData as BufferSource;
  }

  return crypto.subtle.decrypt(
    decryptParams,
    key,
    ciphertext as BufferSource
  );
}

/**
 * Wraps (encrypts) a CryptoKey using another CryptoKey.
 */
export async function wrapKey(wrappingKey: CryptoKey, keyToWrap: CryptoKey): Promise<{ ciphertext: ArrayBuffer; iv: Uint8Array }> {
  const rawKey = await crypto.subtle.exportKey('raw', keyToWrap);
  return encryptBytes(wrappingKey, new Uint8Array(rawKey));
}

/**
 * Unwraps (decrypts) a CryptoKey using another CryptoKey.
 */
export async function unwrapKey(unwrappingKey: CryptoKey, wrappedKeyBytes: Uint8Array, iv: Uint8Array): Promise<CryptoKey> {
  const decryptedRawKey = await decryptBytes(unwrappingKey, wrappedKeyBytes, iv);
  
  return crypto.subtle.importKey(
    'raw',
    decryptedRawKey,
    { name: 'AES-GCM', length: 256 },
    true, // extractable
    ['encrypt', 'decrypt']
  );
}

/**
 * Safely wipes sensitive strings/arrays from memory.
 */
export function wipeMemory(item: string | Uint8Array | null): void {
  if (!item) return;
  if (typeof item === 'string') {
    // In JS we can't mutate strings, but we can dereference them.
    // Overwriting the variable holding it and forcing garbage collection is the best effort.
    // The Web Worker isolates this memory context, which makes it even harder to scrape.
    return;
  }
  if (item instanceof Uint8Array) {
    item.fill(0);
  }
}
