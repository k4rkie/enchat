// Room Creation components
const createRoomBtn = document.getElementById("create-room-btn");
const roomModal = document.getElementById("room-modal");
const cancelModalBtn = document.getElementById("cancel-modal");
const confirmCreateBtn = document.getElementById("confirm-create");
const roomNameInput = document.getElementById("room-name");

//Room join components
const joinInput = document.getElementById("join-input");
const joinRoomBtn = document.getElementById("join-room-btn");

function generateUserId() {
  if (!localStorage.getItem("userId")) {
    const userId = localStorage.setItem("userId", `${crypto.randomUUID()}`);
    return userId;
  }
  const userId = localStorage.getItem("userId");
  return userId;
}
const userId = generateUserId();

createRoomBtn.addEventListener("click", () => {
  roomModal.classList.remove("hidden");
  roomNameInput.focus();
});

cancelModalBtn.addEventListener("click", () => {
  roomModal.classList.add("hidden");
  roomNameInput.value = "";
});

confirmCreateBtn.addEventListener("click", () => {
  const roomName = roomNameInput.value.trim();

  if (roomName) {
    console.log("Creating room:", roomName);
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
    window.location.href = `/r/${roomId}`;
    joinInput.value = "";
  } else {
    joinInput.style.borderColor = "#ff3e3e";
    setTimeout(() => (joinInput.style.borderColor = ""), 1000);
  }
});
