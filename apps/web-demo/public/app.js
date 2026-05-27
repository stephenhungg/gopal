import { GopalRuntime } from "./gopal-runtime.js";
import { GopalVrmStage } from "./vrm-stage.js";

const ui = {
  camera: document.querySelector("#camera"),
  vrmStage: document.querySelector("#vrmStage"),
  start: document.querySelector("#start"),
  stop: document.querySelector("#stop"),
  status: document.querySelector("#status"),
  gopal: document.querySelector("#gopal"),
  mood: document.querySelector("#mood"),
  caption: document.querySelector("#caption"),
  log: document.querySelector("#log"),
  autoLook: document.querySelector("#autoLook"),
  frameRate: document.querySelector("#frameRate")
};

const runtime = new GopalRuntime({
  frameIntervalMs: Number(ui.frameRate.value) * 1000
});
const vrmStage = new GopalVrmStage(ui.vrmStage);

runtime.attachVideoElement(ui.camera);
vrmStage.bindRuntime(runtime);
vrmStage.load().catch((error) => {
  console.error(error);
  log(`vrm failed: ${error.message || error}`);
});

ui.start.addEventListener("click", start);
ui.stop.addEventListener("click", stop);
ui.autoLook.addEventListener("change", () => runtime.setAutoLook(ui.autoLook.checked));
ui.frameRate.addEventListener("input", () => runtime.setFrameInterval(Number(ui.frameRate.value)));

runtime.addEventListener("camera", (event) => {
  ui.camera.srcObject = event.detail.stream;
});

runtime.addEventListener("status", (event) => {
  ui.status.textContent = event.detail.status;
});

runtime.addEventListener("mood", (event) => {
  setMood(event.detail.mood, event.detail.caption);
});

runtime.addEventListener("caption", (event) => {
  setCaption(event.detail.text);
});

runtime.addEventListener("frame", () => {
  log("sent frame");
});

runtime.addEventListener("log", (event) => {
  log(event.detail.message);
});

runtime.addEventListener("error", (event) => {
  log(`error: ${event.detail.error?.message || "unknown"}`);
});

async function start() {
  setMood("thinking", "opening camera and mic");
  ui.start.disabled = true;

  try {
    await runtime.start();
    ui.stop.disabled = false;
  } catch (error) {
    console.error(error);
    log(`failed: ${error.message || error}`);
    ui.status.textContent = "failed";
    setMood("idle", "runtime failed");
    ui.start.disabled = false;
  }
}

function stop() {
  runtime.stop();
  ui.camera.srcObject = null;
  ui.start.disabled = false;
  ui.stop.disabled = true;
}

function setMood(mood, caption) {
  ui.gopal.className = `gopal ${mood}`;
  ui.mood.textContent = mood;
  setCaption(caption);
}

function setCaption(text) {
  ui.caption.textContent = (text || "").trim().slice(0, 140) || "...";
}

function log(text) {
  const item = document.createElement("li");
  item.textContent = text;
  ui.log.prepend(item);
  while (ui.log.children.length > 8) ui.log.lastChild.remove();
}
