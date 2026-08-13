const cryptoParams = {
  keyPairAlgo: {
    name: "ECDH",
    namedCurve: "P-256",
  },
  keyExportFormat: "jwk",
};

export function generateKeyPairs() {
  return window.crypto.subtle.generateKey(cryptoParams.keyPairAlgo, false, [
    "deriveKey",
  ]);
}

export function extractPublicKey(publicKey) {
  return window.crypto.subtle.exportKey(
    cryptoParams.keyExportFormat,
    publicKey,
  );
}

export function importPublicKey(exportedPublicKey) {
  return window.crypto.subtle.importKey(
    cryptoParams.keyExportFormat,
    exportedPublicKey,
    cryptoParams.keyPairAlgo,
    false,
    [],
  );
}

export function deriveEncryptionKey(privateKey, publicKey) {
  return window.crypto.subtle.deriveKey(
    {
      name: cryptoParams.keyPairAlgo.name,
      public: publicKey,
    },
    privateKey,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt", "decrypt"],
  );
}

export function encryptMessage(plainText, iv, encryptionKey) {
  const encoder = new TextEncoder();
  const encodedPlainText = encoder.encode(plainText);
  return window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    encryptionKey,
    encodedPlainText,
  );
}

export async function decryptMessage(cipherText, iv, encryptionKey) {
  const plaintext = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv,
    },
    encryptionKey,
    cipherText,
  );
  const decoder = new TextDecoder();
  return decoder.decode(plaintext);
}
