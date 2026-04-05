const socket = io();

const msgInput = document.getElementById("msg-input");
const sendBtn = document.getElementById("send-btn");
const timerDisplay = document.getElementById("timer-display");
const messagesContainer = document.getElementById("messages-container");

const userId = localStorage.getItem("userId");

//getting roomId form the url
const roomId = document.URL.split("/")[4];
socket.emit("join-room", { roomId, userId });

function renderMessages(msgObj) {
  const newMessageContainer = document.createElement("div");
  newMessageContainer.classList.add("message");

  if (msgObj.userId === userId) {
    newMessageContainer.classList.add("self");
  }

  const message = document.createElement("p");
  message.textContent = msgObj.msg;

  const msgTimestamp = document.createElement("span");
  msgTimestamp.classList.add("timestamp");
  msgTimestamp.textContent = `${msgObj.msgTimestamp}`;

  newMessageContainer.appendChild(message);
  newMessageContainer.appendChild(msgTimestamp);

  messagesContainer.appendChild(newMessageContainer);
}

socket.on("room-history", (messages) => {
  messagesContainer.innerHTML = "";
  messages.forEach((msg) => {
    renderMessages(msg);
  });
});

sendBtn.addEventListener("click", (e) => {
  e.preventDefault();

  if (msgInput.value) {
    const msg = msgInput.value;
    socket.emit("newMessage", { userId, msg, roomId });

    msgInput.value = "";
  }
});

socket.on("newMessage", (msgObj) => {
  renderMessages(msgObj);
});
