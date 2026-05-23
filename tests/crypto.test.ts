import { describe, it, expect, beforeAll } from 'vitest';
import { webcrypto } from 'node:crypto';

// Setup Web Crypto API globally for Node.js test environment if needed
beforeAll(() => {
  if (!globalThis.crypto) {
    Object.defineProperty(globalThis, 'crypto', {
      value: webcrypto,
      writable: true
    });
  }
});

import { deriveKEK, generateRandomKey, encryptBytes, decryptBytes, wrapKey, unwrapKey } from '../src/crypto/keys';

describe('CipherNest Cryptographic Core', () => {
  
  it('should derive a consistent KEK from password and salt', async () => {
    const password = 'test-passphrase-strong-123';
    const salt = new Uint8Array([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
      11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
      21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
      31, 32
    ]);

    // Derive KEK (we can use fewer iterations in test to run faster, or full count to test performance)
    const iterations = 1000; // 1000 for quick test runner speed
    
    const key1 = await deriveKEK(password, salt, iterations);
    const key2 = await deriveKEK(password, salt, iterations);
    
    expect(key1).toBeDefined();
    expect(key2).toBeDefined();
    expect(key1.type).toBe('secret');
    expect(key1.algorithm.name).toBe('AES-GCM');
    
    // Verify consistency by encrypting with key1 and decrypting with key2
    const testData = new TextEncoder().encode('Verification Payload');
    const { ciphertext, iv } = await encryptBytes(key1, testData);
    const decrypted = await decryptBytes(key2, new Uint8Array(ciphertext), iv);
    const decryptedText = new TextDecoder().decode(decrypted);
    
    expect(decryptedText).toBe('Verification Payload');
  });

  it('should generate a random 256-bit AES-GCM key', async () => {
    const key = await generateRandomKey();
    expect(key).toBeDefined();
    expect(key.type).toBe('secret');
    
    const raw = await crypto.subtle.exportKey('raw', key);
    expect(raw.byteLength).toBe(32); // 256 bits
  });

  it('should encrypt and decrypt bytes correctly with AES-GCM', async () => {
    const key = await generateRandomKey();
    const originalText = 'Private user metadata - confidential';
    const plaintext = new TextEncoder().encode(originalText);
    const associatedData = new TextEncoder().encode('file-uuid-index-1');

    // Encrypt
    const { ciphertext, iv } = await encryptBytes(key, plaintext, associatedData);
    
    expect(ciphertext).toBeDefined();
    expect(iv.length).toBe(12); // GCM IV is 12 bytes
    expect(ciphertext.byteLength).toBe(plaintext.byteLength + 16); // 16 bytes authentication tag added

    // Decrypt
    const decryptedBuffer = await decryptBytes(key, new Uint8Array(ciphertext), iv, associatedData);
    const decryptedText = new TextDecoder().decode(decryptedBuffer);
    
    expect(decryptedText).toBe(originalText);
  });

  it('should fail decryption if Associated Authenticated Data (AAD) is modified', async () => {
    const key = await generateRandomKey();
    const plaintext = new TextEncoder().encode('Top Secret Data');
    const associatedData = new TextEncoder().encode('file_chunk_0');

    // Encrypt with good AAD
    const { ciphertext, iv } = await encryptBytes(key, plaintext, associatedData);

    // Decrypt with incorrect AAD (simulating chunk swap attack)
    const badAssociatedData = new TextEncoder().encode('file_chunk_1');
    
    await expect(
      decryptBytes(key, new Uint8Array(ciphertext), iv, badAssociatedData)
    ).rejects.toThrow();
  });

  it('should wrap and unwrap key envelopes securely', async () => {
    const KEK = await generateRandomKey();
    const fileKey = await generateRandomKey();

    // Wrap
    const { ciphertext, iv } = await wrapKey(KEK, fileKey);
    expect(ciphertext.byteLength).toBe(32 + 16); // 32 bytes key + 16 bytes tag = 48 bytes

    // Unwrap
    const unwrappedFileKey = await unwrapKey(KEK, new Uint8Array(ciphertext), iv);
    expect(unwrappedFileKey).toBeDefined();
    
    const rawOriginal = await crypto.subtle.exportKey('raw', fileKey);
    const rawUnwrapped = await crypto.subtle.exportKey('raw', unwrappedFileKey);

    expect(new Uint8Array(rawOriginal)).toEqual(new Uint8Array(rawUnwrapped));
  });

});
