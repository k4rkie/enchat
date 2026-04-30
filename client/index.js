// Username
const userNameInput = document.getElementById("username-input");
const userNameError = document.getElementById("username-error");

// Room Creation components
const createRoomBtn = document.getElementById("create-room-btn");
const createRoomModal = document.getElementById("create-room-modal");
const confirmCreateBtn = document.getElementById("confirm-create");
const cancelCreateModalBtn = document.getElementById("cancel-create-modal");
const roomNameInput = document.getElementById("room-name");

//Room join components
const joinRoomBtn = document.getElementById("join-room-btn");
const joinRoomModal = document.getElementById("join-room-modal");
const confirmJoinBtn = document.getElementById("confirm-join");
const cancelJoinModalBtn = document.getElementById("cancel-join-modal");
const joinInput = document.getElementById("join-input");
const joinRoomError = document.getElementById("join-room-error");

// No username
const noUserNameModal = document.getElementById("no-username-redirect-modal");
const okayButton = document.querySelector(".okay-button");

const url = new URL(window.location.href);
const noUsernameRedirect = url.searchParams.get("noUsernameRedirect");
if (noUsernameRedirect) {
  noUserNameModal.classList.toggle("hidden");
  okayButton.addEventListener("click", () => {
    window.location.href = "/";
  });
}

function generateUserId() {
  if (!sessionStorage.getItem("userId")) {
    sessionStorage.setItem("userId", `${crypto.randomUUID()}`);
  }
  return sessionStorage.getItem("userId");
}
const userId = generateUserId();

let userName = sessionStorage.getItem("userName") ?? "";
userNameInput.value = userName;
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
    createRoomModal.classList.remove("hidden");
    setUserName();
    roomNameInput.focus();
  } else {
    userNameInput.style.borderColor = "#ff3e3e";
    setTimeout(() => (userNameInput.style.borderColor = ""), 1000);
  }
});

confirmCreateBtn.addEventListener("click", () => {
  const roomName = roomNameInput.value.trim();
  if (roomName) {
    const roomId = crypto.randomUUID().split("-")[0];
    sessionStorage.setItem("roomName", roomName);
    window.location.href = `/r/${roomId}`;
  } else {
    roomNameInput.style.borderColor = "#ff3e3e";
    setTimeout(() => (roomNameInput.style.borderColor = ""), 1000);
  }
});

cancelCreateModalBtn.addEventListener("click", () => {
  createRoomModal.classList.add("hidden");
  roomNameInput.value = "";
});

joinRoomBtn.addEventListener("click", () => {
  if (userName) {
    if (userName.length < 3 || userName.length > 20) {
      userNameError.textContent = "Username must contain 3-20 characters";
      userNameError.classList.toggle("hidden");
      return console.log("Invalid username");
    }
    joinRoomModal.classList.remove("hidden");
    setUserName();
    joinInput.focus();
  } else {
    userNameInput.style.borderColor = "#ff3e3e";
    setTimeout(() => (userNameInput.style.borderColor = ""), 1000);
  }
});

confirmJoinBtn.addEventListener("click", async () => {
  const roomId = joinInput.value;
  if (roomId) {
    if (roomId.length !== 8) {
      joinRoomError.textContent = "Invalid room id";
      joinRoomError.classList.toggle("hidden");
      return console.log("Invalid id");
    }
    try {
      const response = await fetch(
        `http://localhost:6969/check-room?roomId=${roomId}`,
        {
          method: "GET",
        },
      );
      confirmJoinBtn;
      confirmJoinBtn.disabled = true;
      if (!response.ok) {
        const { error } = await response.json();
        joinRoomError.textContent = `${error}`;
        joinRoomError.classList.toggle("hidden");
        confirmJoinBtn.disabled = false;
        return;
      }
      console.log("Room joined successfully");
      window.location.href = `/r/${roomId}`;
      joinInput.value = "";
    } catch (err) {
      confirmJoinBtn.disabled = false;
      console.log(err.message);
    } finally {
      confirmJoinBtn.disabled = false;
    }
  } else {
    joinInput.style.borderColor = "#ff3e3e";
    setTimeout(() => (joinInput.style.borderColor = ""), 1000);
  }
});

cancelJoinModalBtn.addEventListener("click", () => {
  joinRoomError.textContent = "";
  joinRoomError.classList.toggle("hidden");
  joinRoomModal.classList.add("hidden");
  joinInput.value = "";
});
