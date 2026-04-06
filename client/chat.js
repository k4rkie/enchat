const socket = io();

const msgInput = document.getElementById("msg-input");
const sendBtn = document.getElementById("send-btn");
const timerDisplay = document.getElementById("timer-display");
const connnectionStatus = document.getElementById("connection-status");
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

socket.on("room-history", (roomHistory) => {
  messagesContainer.innerHTML = "";
  roomHistory.messages.forEach((msg) => {
    renderMessages(msg);
  });

  connnectionStatus.classList.remove("offline");
  connnectionStatus.classList.add("online");

  const startingTimeInMin = (roomHistory.expiresAt - Date.now()) / (1000 * 60);
  let time = startingTimeInMin * 60;

  function updateTimer() {
    const minutes = Math.floor(time / 60);
    let seconds = Math.ceil(time % 60);

    timerDisplay.textContent = `${minutes < 10 ? "0" + minutes : minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
    time--;
  }

  let blink = true;
  setInterval(() => {
    updateTimer();
    if (time < 10) {
      if (blink) {
        connnectionStatus.classList.toggle("online");
        connnectionStatus.classList.toggle("offline");
      }
      if (time < 0) {
        window.location.href = "/";
      }
    }
    blink = !blink;
  }, 1000);
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
