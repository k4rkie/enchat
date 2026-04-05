function getCurrentTime() {
  let now = new Date();
  let hours = now.getHours();
  let minutes = now.getMinutes();

  return `${hours}:${minutes < 10 ? `0${minutes}` : minutes}`;
}

export { getCurrentTime };
