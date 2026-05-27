const ui = {
  camera: document.querySelector("#camera"),
  canvas: document.querySelector("#snapshot"),
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

const state = {
  pc: null,
  dc: null,
  micStream: null,
  cameraStream: null,
  frameTimer: null,
  connected: false,
  responseText: ""
};

ui.start.addEventListener("click", startGopal);
ui.stop.addEventListener("click", stopGopal);
ui.frameRate.addEventListener("input", restartFramePump);

async function startGopal() {
  setStatus("summoning");
  setMood("thinking", "opening eyes and sniffing the room");
  ui.start.disabled = true;

  try {
    state.cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false
    });
    ui.camera.srcObject = state.cameraStream;

    state.micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      },
      video: false
    });

    const session = await createSession();
    const ephemeralKey = session.value || session.client_secret?.value;
    if (!ephemeralKey) throw new Error("session did not include an ephemeral key");
    await connectWebRTC(ephemeralKey);

    ui.stop.disabled = false;
    state.connected = true;
    setStatus("live");
    setMood("listening", "camera hot, ears cursed, ready");
    startFramePump();
  } catch (error) {
    console.error(error);
    log(`failed: ${error.message || error}`);
    setStatus("failed");
    setMood("idle", "summon fizzled");
    ui.start.disabled = false;
  }
}

async function createSession() {
  const response = await fetch("/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ safetyId: getSafetyId() })
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.message || payload.error || "session failed");
  }
  return payload;
}

async function connectWebRTC(ephemeralKey) {
  const pc = new RTCPeerConnection();
  state.pc = pc;

  const remoteAudio = document.createElement("audio");
  remoteAudio.autoplay = true;
  pc.ontrack = (event) => {
    remoteAudio.srcObject = event.streams[0];
  };

  for (const track of state.micStream.getAudioTracks()) {
    pc.addTrack(track, state.micStream);
  }

  const dc = pc.createDataChannel("oai-events");
  state.dc = dc;
  dc.addEventListener("open", () => {
    log("data channel open");
    primeGoblin();
  });
  dc.addEventListener("message", handleRealtimeEvent);

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  const response = await fetch("https://api.openai.com/v1/realtime/calls", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ephemeralKey}`,
      "Content-Type": "application/sdp"
    },
    body: offer.sdp
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  await pc.setRemoteDescription({
    type: "answer",
    sdp: await response.text()
  });
}

function handleRealtimeEvent(message) {
  const event = JSON.parse(message.data);

  switch (event.type) {
    case "session.created":
      log("session created");
      break;
    case "input_audio_buffer.speech_started":
      setMood("listening", "listening");
      break;
    case "input_audio_buffer.speech_stopped":
      setMood("thinking", "chewing on the thought");
      break;
    case "response.created":
      state.responseText = "";
      setMood("speaking", "gopal speaks");
      break;
    case "response.output_text.delta":
    case "response.output_audio_transcript.delta":
      state.responseText += event.delta || "";
      setCaption(state.responseText);
      break;
    case "response.done":
      setMood("listening", "waiting for the next omen");
      break;
    case "error":
      log(`error: ${event.error?.message || "unknown"}`);
      setMood("idle", "the spell cracked");
      break;
    default:
      break;
  }
}

function primeGoblin() {
  sendEvent({
    type: "conversation.item.create",
    item: {
      type: "message",
      role: "user",
      content: [
        {
          type: "input_text",
          text: "You just woke up. Greet me in one short, manic line and ask what you should watch for."
        }
      ]
    }
  });
  sendEvent({ type: "response.create" });
}

function startFramePump() {
  stopFramePump();
  const seconds = Number(ui.frameRate.value);
  state.frameTimer = window.setInterval(() => {
    if (ui.autoLook.checked) sendSceneFrame();
  }, seconds * 1000);
  sendSceneFrame();
}

function restartFramePump() {
  if (state.connected) startFramePump();
}

function stopFramePump() {
  if (state.frameTimer) window.clearInterval(state.frameTimer);
  state.frameTimer = null;
}

function sendSceneFrame() {
  if (!state.dc || state.dc.readyState !== "open" || !ui.camera.videoWidth) return;

  const imageUrl = captureFrame();
  sendEvent({
    type: "conversation.item.create",
    item: {
      type: "message",
      role: "user",
      content: [
        {
          type: "input_text",
          text: "Look at this current camera frame. If something useful, funny, risky, beautiful, or weird is visible, react out loud in character. Be brief. Do not identify real people, sexualize strangers, or insult vulnerable people."
        },
        {
          type: "input_image",
          image_url: imageUrl
        }
      ]
    }
  });
  sendEvent({
    type: "response.create",
    response: {
      output_modalities: ["audio"]
    }
  });
  log("sent frame");
}

function captureFrame() {
  const canvas = ui.canvas;
  const ctx = canvas.getContext("2d");
  const ratio = ui.camera.videoWidth / ui.camera.videoHeight;
  canvas.width = 640;
  canvas.height = Math.round(640 / ratio);
  ctx.save();
  ctx.scale(-1, 1);
  ctx.drawImage(ui.camera, -canvas.width, 0, canvas.width, canvas.height);
  ctx.restore();
  return canvas.toDataURL("image/jpeg", 0.72);
}

function sendEvent(event) {
  if (!state.dc || state.dc.readyState !== "open") return;
  state.dc.send(JSON.stringify(event));
}

function stopGopal() {
  stopFramePump();
  state.dc?.close();
  state.pc?.close();
  state.micStream?.getTracks().forEach((track) => track.stop());
  state.cameraStream?.getTracks().forEach((track) => track.stop());
  state.pc = null;
  state.dc = null;
  state.micStream = null;
  state.cameraStream = null;
  state.connected = false;
  ui.camera.srcObject = null;
  ui.start.disabled = false;
  ui.stop.disabled = true;
  setStatus("offline");
  setMood("idle", "banished");
}

function setStatus(text) {
  ui.status.textContent = text;
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

function getSafetyId() {
  const key = "gopal_safety_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}
