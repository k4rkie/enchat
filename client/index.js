// Username
const userNameInput = document.getElementById("username-input");
const userNameError = document.getElementById("username-error");

// Room Creation components
const createRoomBtn = document.getElementById("create-room-btn");
const roomModal = document.getElementById("room-modal");
const cancelModalBtn = document.getElementById("cancel-modal");
const confirmCreateBtn = document.getElementById("confirm-create");
const roomNameInput = document.getElementById("room-name");

//Room join components
const joinInput = document.getElementById("join-input");
const joinRoomBtn = document.getElementById("join-room-btn");
const joinRoomError = document.getElementById("join-room-error");

console.log();

function generateUserId() {
  if (!sessionStorage.getItem("userId")) {
    sessionStorage.setItem("userId", `${crypto.randomUUID()}`);
  }
  return sessionStorage.getItem("userId");
}
const userId = generateUserId();

let userName = sessionStorage.getItem("userName") ?? "";
function setUserName() {
  sessionStorage.setItem("userName", userName);
}
setUserName();

userNameInput.addEventListener("input", () => {
  userName = userNameInput.value;
  if (userName.length < 3 !== true) {
    userNameError.textContent = "";
    userNameError.classList.add("hidden");
  }
});

createRoomBtn.addEventListener("click", () => {
  if (userName) {
    if (userName.length < 3 || userName.length > 20) {
      userNameError.textContent = "Username must contain 3-20 characters";
      userNameError.classList.toggle("hidden");
      return console.log("Invalid username");
    }
    roomModal.classList.remove("hidden");
    setUserName();
    roomNameInput.focus();
  } else {
    userNameInput.style.borderColor = "#ff3e3e";
    setTimeout(() => (userNameInput.style.borderColor = ""), 1000);
  }
});

cancelModalBtn.addEventListener("click", () => {
  roomModal.classList.add("hidden");
  roomNameInput.value = "";
});

confirmCreateBtn.addEventListener("click", () => {
  const roomName = roomNameInput.value.trim();

  if (roomName) {
    const roomId = crypto.randomUUID().split("-")[0];
    window.location.href = `/r/${roomId}`;
  } else {
    roomNameInput.style.borderColor = "#ff3e3e";
    setTimeout(() => (roomNameInput.style.borderColor = ""), 1000);
  }
});

joinRoomBtn.addEventListener("click", () => {
  const roomId = joinInput.value;
  if (roomId) {
    if (roomId.length !== 8) {
      joinRoomError.textContent = "Invalid room id";
      joinRoomError.classList.toggle("hidden");
      return console.log("Invalid id");
    }
    window.location.href = `/r/${roomId}`;
    joinInput.value = "";
  } else {
    joinInput.style.borderColor = "#ff3e3e";
    setTimeout(() => (joinInput.style.borderColor = ""), 1000);
  }
});
