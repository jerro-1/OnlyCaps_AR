const base64ToArrayBuffer = (base64) => {
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  } catch (e) {
    console.error('Base64 decode failed. Value:', base64, 'Error:', e.message);
    throw new Error(`Invalid encryption key format. Ensure VITE_ENCRYPTION_KEY is valid base64 (64 chars for AES-256). Got: "${base64}"`);
  }
};

const arrayBufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const getCryptoKey = async () => {
  const envKey = import.meta.env.VITE_ENCRYPTION_KEY;
  if (!envKey) {
    throw new Error('VITE_ENCRYPTION_KEY is required for encryption/decryption');
  }

  const keyBytes = base64ToArrayBuffer(envKey);
  if (keyBytes.byteLength !== 32) {
    throw new Error('VITE_ENCRYPTION_KEY must be 32 bytes (base64-encoded 256 bits)');
  }

  return crypto.subtle.importKey(
    'raw',
    keyBytes,
    'AES-GCM',
    true,
    ['encrypt', 'decrypt'],
  );
};

export const encryptText = async (plainText) => {
  if (!plainText) return '';
  const key = await getCryptoKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plainText);

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded,
  );

  return `${arrayBufferToBase64(iv)}:${arrayBufferToBase64(encrypted)}`;
};

export const decryptText = async (encryptedText) => {
  if (!encryptedText) return '';

  const [ivBase64, cipherBase64] = encryptedText.split(':');
  if (!ivBase64 || !cipherBase64) {
    throw new Error('Invalid encrypted payload format');
  }

  const key = await getCryptoKey();
  const iv = base64ToArrayBuffer(ivBase64);
  const cipher = base64ToArrayBuffer(cipherBase64);

  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(iv),
    },
    key,
    cipher,
  );

  return new TextDecoder().decode(decrypted);
};
