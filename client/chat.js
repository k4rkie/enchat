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
socket.emit("join-room", { roomId, userId, roomName, userName });
sessionStorage.removeItem("roomName");

// rendering messages
function renderMessages(msgObj) {
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
  message.textContent = msgObj.msg;
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
  console.log("Terminate room event emitted");
  socket.emit("terminate-room", { roomId });
});

cancelTerminateButton.addEventListener("click", () => {
  confirmRoomTerminationModal.classList.toggle("hidden");
});

// responding to room-history event
socket.on("room-history", (roomHistory) => {
  roomNameDisplay.textContent = roomHistory.roomName;
  roomIdDisplay.textContent = roomHistory.roomId;
  userCountDisplay.textContent = roomHistory.noOfUsers;

  isUserAdmin = roomHistory.adminId === userId ? true : false;

  if (isUserAdmin) {
    terminateRoomBtn.classList.remove("hidden");
  }

  messagesContainer.innerHTML = "";
  roomHistory.messages.forEach((msg) => {
    renderMessages(msg);
  });
  scrollToBottom();

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
sendBtn.addEventListener("click", (e) => {
  e.preventDefault();

  if (msgInput.value) {
    const msg = msgInput.value;
    socket.emit("newMessage", { userId, msg, roomId, userName });

    msgInput.value = "";
  }
});

socket.on("newMessage", (msgObj) => {
  renderMessages(msgObj);
});

socket.on("room-expired", (msg) => {
  expiryModal.classList.remove("hidden");
  homeBtn.addEventListener("click", () => {
    window.location.href = "/";
  });
  setTimeout(() => {
    window.location.href = "/";
  }, 10000);
});

socket.on("terminate-room-successful", (msg) => {
  if (!isUserAdmin) {
    window.location.href = `/?roomTerminated=true`;
    return;
  }
  window.location.href = "/";
});
