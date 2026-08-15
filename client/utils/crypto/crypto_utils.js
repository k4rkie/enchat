const cryptoParams = {
  keyPairAlgo: {
    name: "ECDH",
    namedCurve: "P-256",
  },
  keyExportFormat: "jwk",
};

function generateKeyPairs() {
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

export function importPublicKey(peerPublicKeyAsJWK) {
  return window.crypto.subtle.importKey(
    cryptoParams.keyExportFormat,
    peerPublicKeyAsJWK,
    cryptoParams.keyPairAlgo,
    false,
    [],
  );
}

export function deriveEncryptionKey(privateKey, peerPublicKey) {
  return window.crypto.subtle.deriveKey(
    {
      name: cryptoParams.keyPairAlgo.name,
      public: peerPublicKey,
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

export async function encryptMessage(message, iv, encryptionKey) {
  const encoder = new TextEncoder();
  const encodedPlainText = encoder.encode(message);
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

export function encodeArrayBufferToBase64(arrayBuffer) {
  return new Uint8Array(arrayBuffer).toBase64();
}

export function decodeBase64ToUint8Array(base64text) {
  return Uint8Array.fromBase64(base64text);
}

export async function retrieveKeyPairs(roomId) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("EnchatDB", 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("cryptoKeyPairs")) {
        db.createObjectStore("cryptoKeyPairs");
      }
    };

    request.onsuccess = (event) => {
      const db = event.target.result;

      const readTx = db.transaction("cryptoKeyPairs", "readonly");
      const getRequest = readTx.objectStore("cryptoKeyPairs").get(roomId);

      getRequest.onsuccess = async () => {
        if (getRequest.result) {
          resolve(getRequest.result);
        } else {
          const newKeyPair = await generateKeyPairs();

          const writeTx = db.transaction("cryptoKeyPairs", "readwrite");
          const putRequest = writeTx
            .objectStore("cryptoKeyPairs")
            .put(newKeyPair, roomId);

          putRequest.onsuccess = () => resolve(newKeyPair);
          putRequest.onerror = () => reject(putRequest.error);
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    };
    request.onerror = (event) => reject(event.target.error);
  });
}

export async function clearKeyPairsFromIndexDB(roomId) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("EnchatDB", 1);

    request.onsuccess = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains("cryptoKeyPairs")) {
        return resolve();
      }

      const writeTx = db.transaction("cryptoKeyPairs", "readwrite");
      const deleteRequest = writeTx
        .objectStore("cryptoKeyPairs")
        .delete(roomId);

      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };

    request.onerror = (event) => reject(event.target.error);
  });
}
