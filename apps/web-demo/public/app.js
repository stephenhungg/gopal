import { GopalRuntime } from "./gopal-runtime.js";
import { GopalVrmStage } from "./vrm-stage.js";

const ui = {
  camera: document.querySelector("#camera"),
  vrmStage: document.querySelector("#vrmStage"),
  wake: document.querySelector("#wake"),
  status: document.querySelector("#status"),
  gopal: document.querySelector("#gopal"),
  mood: document.querySelector("#mood"),
  caption: document.querySelector("#caption"),
  log: document.querySelector("#log")
};

const runtime = new GopalRuntime({
  frameIntervalMs: 4000,
  ttsPlaybackRate: 0.9
});
const vrmStage = new GopalVrmStage(ui.vrmStage);

runtime.attachVideoElement(ui.camera);
vrmStage.bindRuntime(runtime);
vrmStage.load().catch((error) => {
  console.error(error);
  log(`vrm failed: ${error.message || error}`);
});

ui.wake.addEventListener("click", toggleWake);

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

runtime.addEventListener("frame", (event) => {
  const mode = event.detail.spoke ? "spoke" : "context";
  log(`frame ${mode}, change ${event.detail.changeScore.toFixed(1)}`);
});

runtime.addEventListener("log", (event) => {
  log(event.detail.message);
});

runtime.addEventListener("error", (event) => {
  log(`error: ${event.detail.error?.message || "unknown"}`);
});

async function toggleWake() {
  if (runtime.connected) {
    stop();
    return;
  }

  await start();
}

async function start() {
  setMood("thinking", "opening camera and mic");
  ui.wake.disabled = true;

  try {
    await runtime.start();
    ui.wake.disabled = false;
    ui.wake.textContent = "banish G Opal";
  } catch (error) {
    console.error(error);
    log(`failed: ${error.message || error}`);
    ui.status.textContent = "failed";
    setMood("idle", "runtime failed");
    ui.wake.disabled = false;
  }
}

function stop() {
  runtime.stop();
  ui.camera.srcObject = null;
  ui.wake.disabled = false;
  ui.wake.textContent = "wake G Opal";
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
