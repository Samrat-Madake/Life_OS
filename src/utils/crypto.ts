import type { AppState } from "../models";

const CLIENT_KEY_STORAGE = "lifeos:client_enc_key";

// Convert Uint8Array to Base64 string
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Convert Base64 string to Uint8Array
export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Generate a cryptographically secure random 16-byte salt (Base64)
export function generateSalt(): string {
  const salt = new Uint8Array(16);
  window.crypto.getRandomValues(salt);
  return uint8ArrayToBase64(salt);
}

/**
 * Derive a 256-bit AES-GCM CryptoKey from password and salt
 * using PBKDF2 with 100,000 iterations of SHA-256.
 */
export async function deriveKeyFromPassword(password: string, saltBase64: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(password);
  const saltBytes = base64ToUint8Array(saltBase64);

  // Import raw password as key material
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    passwordBytes,
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  // Derive AES-GCM 256-bit key
  const derivedKey = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBytes as BufferSource,
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true, // extractable so we can cache in session storage across page refreshes
    ["encrypt", "decrypt"]
  );

  return derivedKey;
}

// Export a CryptoKey to raw Base64 string
export async function exportKey(key: CryptoKey): Promise<string> {
  const raw = await window.crypto.subtle.exportKey("raw", key);
  return uint8ArrayToBase64(new Uint8Array(raw));
}

// Import a raw Base64 string back into a CryptoKey
export async function importKey(rawBase64: string): Promise<CryptoKey> {
  const rawBytes = base64ToUint8Array(rawBase64);
  return await window.crypto.subtle.importKey(
    "raw",
    rawBytes as BufferSource,
    { name: "AES-GCM" },
    true,
    ["encrypt", "decrypt"]
  );
}

// In-memory key reference
let memoryKey: CryptoKey | null = null;

export async function setCurrentKey(key: CryptoKey): Promise<void> {
  memoryKey = key;
  try {
    const rawKey = await exportKey(key);
    localStorage.setItem(CLIENT_KEY_STORAGE, rawKey);
  } catch (err) {
    console.warn("Could not persist encryption key in localStorage", err);
  }
}

export async function getCurrentKey(): Promise<CryptoKey | null> {
  if (memoryKey) return memoryKey;
  try {
    const raw = localStorage.getItem(CLIENT_KEY_STORAGE) || sessionStorage.getItem(CLIENT_KEY_STORAGE);
    if (raw) {
      memoryKey = await importKey(raw);
      return memoryKey;
    }
  } catch (err) {
    console.warn("Failed to restore encryption key from storage", err);
  }
  return null;
}

export function clearCurrentKey(): void {
  memoryKey = null;
  try {
    localStorage.removeItem(CLIENT_KEY_STORAGE);
    sessionStorage.removeItem(CLIENT_KEY_STORAGE);
  } catch {
    // ignore
  }
}

/**
 * Encrypt an AppState object using AES-256-GCM
 * Returns { encryptedPayload, iv } as Base64 strings.
 */
export async function encryptState(
  state: AppState,
  key: CryptoKey
): Promise<{ encryptedPayload: string; iv: string }> {
  const jsonStr = JSON.stringify(state);
  const data = new TextEncoder().encode(jsonStr);

  // Generate unique 12-byte initialization vector (IV) for AES-GCM
  const iv = new Uint8Array(12);
  window.crypto.getRandomValues(iv);

  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv as BufferSource
    },
    key,
    data
  );

  return {
    encryptedPayload: uint8ArrayToBase64(new Uint8Array(ciphertext)),
    iv: uint8ArrayToBase64(iv)
  };
}

/**
 * Decrypt an encrypted Base64 payload and IV back into an AppState object
 */
export async function decryptState(
  encryptedPayload: string,
  ivBase64: string,
  key: CryptoKey
): Promise<AppState> {
  const ciphertextBytes = base64ToUint8Array(encryptedPayload);
  const ivBytes = base64ToUint8Array(ivBase64);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: ivBytes as BufferSource
    },
    key,
    ciphertextBytes as BufferSource
  );

  const decryptedJson = new TextDecoder().decode(decryptedBuffer);
  return JSON.parse(decryptedJson) as AppState;
}
