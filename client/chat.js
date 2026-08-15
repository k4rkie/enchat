import {
  extractPublicKey,
  importPublicKey,
  deriveEncryptionKey,
  encryptMessage,
  encodeArrayBufferToBase64,
  retrieveKeyPairs,
  decryptMessage,
  decodeBase64ToUint8Array,
  clearKeyPairsFromIndexDB,
} from "./utils/crypto/crypto_utils.js";

const socket = io();

const msgInput = document.getElementById("msg-input");
const sendBtn = document.getElementById("send-btn");
const timerDisplay = document.getElementById("timer-display");
const connnectionStatus = document.getElementById("connection-status");
const messagesContainer = document.getElementById("messages-container");
const chatWindow = document.getElementById("chat-window");

const expiryModal = document.getElementById("expiry-modal");
const homeBtn = document.getElementById("confirm-expiry");

const userId = sessionStorage.getItem("userId");
const userName = sessionStorage.getItem("userName") ?? "";

const roomName = sessionStorage.getItem("roomName") ?? "";

const roomNameDisplay = document.getElementById("room-name-display");
const roomIdDisplay = document.getElementById("room-id-display");
const copyIdBtn = document.getElementById("copy-id-btn");
const userCountDisplay = document.getElementById("user-count");

const terminateRoomBtn = document.getElementById("terminate-room-btn");
const confirmRoomTerminationModal = document.getElementById(
  "confirm-room-termination-modal",
);
const confirmTerminateButton = document.getElementById(
  "confirm-terminate-button",
);
const cancelTerminateButton = document.getElementById(
  "cancel-terminate-button",
);

let isUserAdmin = "false";

if (userName.length === 0) {
  window.location.href = "/?noUsernameRedirect=true";
}

// chat duration counter
let timeInterval = null;
let connectionStatusInterval = null;

//getting roomId form the url
const roomId = document.URL.split("/")[4];

// get the cryptoKeyPairs from indexdb
const ecdhKeyPairs = await retrieveKeyPairs(roomId);
const localPublicKey = await extractPublicKey(ecdhKeyPairs.publicKey);
let sharedEncryptionKey = null;

function updateChatUIState() {
  if (!sharedEncryptionKey) {
    msgInput.disabled = true;
    sendBtn.disabled = true;
    msgInput.placeholder = "Waiting for someone to join...";
    msgInput.style.cursor = "not-allowed";
    sendBtn.style.cursor = "not-allowed";
  } else {
    msgInput.disabled = false;
    sendBtn.disabled = false;
    msgInput.placeholder = "Type your message...";
    msgInput.style.cursor = "text";
    sendBtn.style.cursor = "pointer";
  }
}
updateChatUIState();

socket.emit("join-room", {
  roomId,
  userId,
  roomName,
  userName,
  publicKey: localPublicKey,
});
sessionStorage.removeItem("roomName");

// rendering messages
async function renderMessages(msgObj) {
  if (msgObj.type === "sysmsg") {
    const sysMsg = document.createElement("div");
    sysMsg.classList.add("system-message");
    sysMsg.textContent = msgObj.sysMsg;
    messagesContainer.appendChild(sysMsg);
    scrollToBottom();
    return;
  }

  const newMessageContainer = document.createElement("div");
  newMessageContainer.classList.add("message");

  if (msgObj.userId === userId) {
    newMessageContainer.classList.add("self");
  }
  const msgAuthor = document.createElement("span");
  msgAuthor.classList.add("msg-author");
  msgAuthor.textContent = msgObj.userName || "ANONYMOUS";

  const msgBubble = document.createElement("div");
  msgBubble.classList.add("msg-bubble");

  const message = document.createElement("p");

  if (!sharedEncryptionKey) return;

  const decryptedMessage = await decryptMessage(
    decodeBase64ToUint8Array(msgObj.msgPayload.msgText),
    decodeBase64ToUint8Array(msgObj.msgPayload.iv),
    sharedEncryptionKey,
  );

  message.textContent = decryptedMessage;
  msgBubble.appendChild(message);

  const msgTimestamp = document.createElement("span");
  msgTimestamp.classList.add("timestamp");
  msgTimestamp.textContent = `${msgObj.msgTimestamp}`;

  newMessageContainer.appendChild(msgAuthor);
  newMessageContainer.appendChild(msgBubble);
  newMessageContainer.appendChild(msgTimestamp);

  messagesContainer.appendChild(newMessageContainer);
  scrollToBottom();
}

function scrollToBottom() {
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

copyIdBtn.addEventListener("click", () => {
  navigator.clipboard.writeText(roomId);
});

terminateRoomBtn.addEventListener("click", () => {
  confirmRoomTerminationModal.classList.toggle("hidden");
});

confirmTerminateButton.addEventListener("click", () => {
  socket.emit("terminate-room", { roomId });
});

cancelTerminateButton.addEventListener("click", () => {
  confirmRoomTerminationModal.classList.toggle("hidden");
});

// responding to room-history event
socket.on("room-history", async (roomHistory) => {
  roomNameDisplay.textContent = roomHistory.roomName;
  roomIdDisplay.textContent = roomHistory.roomId;
  userCountDisplay.textContent = roomHistory.noOfUsers;

  isUserAdmin = roomHistory.adminId === userId ? true : false;

  if (isUserAdmin) {
    terminateRoomBtn.classList.remove("hidden");
  }

  if (Object.keys(roomHistory.publicKeys).length >= 2) {
    const [peerUserId] = Object.keys(roomHistory.publicKeys).filter(
      (uid) => uid !== userId,
    );

    const peerPublicKeyAsJWK = roomHistory.publicKeys[peerUserId];
    const peerPublicKey = await importPublicKey(peerPublicKeyAsJWK);

    sharedEncryptionKey = await deriveEncryptionKey(
      ecdhKeyPairs.privateKey,
      peerPublicKey,
    );
  }

  updateChatUIState();

  messagesContainer.innerHTML = "";

  for (const msg of roomHistory.messages) {
    await renderMessages(msg);
  }
  // Use a slight timeout to ensure images or layout adjustments don't interfere
  setTimeout(scrollToBottom, 50);

  connnectionStatus.classList.add("online");

  const startingTimeInMin = (roomHistory.expiresAt - Date.now()) / (1000 * 60);
  let time = startingTimeInMin * 60;

  function updateTimer() {
    const minutes = Math.floor(time / 60);
    let seconds = Math.ceil(time % 60);

    timerDisplay.textContent = `${minutes < 10 ? "0" + minutes : minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
    time--;
  }

  if (timeInterval) {
    clearInterval(timeInterval);
  }
  updateTimer();
  timeInterval = setInterval(() => {
    updateTimer();
  }, 1000);

  if (connectionStatusInterval) {
    clearInterval(connectionStatusInterval);
  }
  connectionStatusInterval = setInterval(() => {
    if (time < 10) {
      connnectionStatus.classList.toggle("online");
    }
  }, 500);
});

// Send message event listener
sendBtn.addEventListener("click", async (e) => {
  e.preventDefault();
  if (msgInput.value) {
    const msg = msgInput.value;
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encryptedMessage = await encryptMessage(msg, iv, sharedEncryptionKey);
    const msgPayload = {
      msgText: encodeArrayBufferToBase64(encryptedMessage),
      iv: iv.toBase64(),
    };
    socket.emit("newMessage", { userId, msgPayload, roomId, userName });
    msgInput.value = "";
  }
});

socket.on("newMessage", (msgObj) => {
  renderMessages(msgObj);
});

socket.on("room-expired", (msg) => {
  expiryModal.classList.remove("hidden");
  clearKeyPairsFromIndexDB(roomId);
  homeBtn.addEventListener("click", () => {
    window.location.href = "/";
  });
  setTimeout(() => {
    window.location.href = "/";
  }, 10000);
});

socket.on("terminate-room-successful", async (msg) => {
  await clearKeyPairsFromIndexDB(roomId);
  if (!isUserAdmin) {
    window.location.href = `/?roomTerminated=true`;
    return;
  }
  window.location.href = "/";
});
