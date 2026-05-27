export class GopalRuntime extends EventTarget {
  constructor(options = {}) {
    super();
    this.sessionEndpoint = options.sessionEndpoint || "/session";
    this.realtimeEndpoint = options.realtimeEndpoint || "https://api.openai.com/v1/realtime/calls";
    this.frameIntervalMs = options.frameIntervalMs || 5000;
    this.imageWidth = options.imageWidth || 640;
    this.imageQuality = options.imageQuality || 0.72;
    this.videoConstraints = options.videoConstraints || {
      facingMode: "environment",
      width: { ideal: 1280 },
      height: { ideal: 720 }
    };
    this.audioConstraints = options.audioConstraints || {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    };
    this.scenePrompt = options.scenePrompt || defaultScenePrompt;
    this.primePrompt = options.primePrompt || defaultPrimePrompt;
    this.safetyId = options.safetyId || getSafetyId();

    this.pc = null;
    this.dc = null;
    this.micStream = null;
    this.cameraStream = null;
    this.remoteAudio = null;
    this.frameTimer = null;
    this.canvas = document.createElement("canvas");
    this.responseText = "";
    this.connected = false;
    this.autoLook = true;
  }

  async start() {
    this.emit("status", { status: "summoning" });
    this.cameraStream = await navigator.mediaDevices.getUserMedia({
      video: this.videoConstraints,
      audio: false
    });
    if (this.videoElement) this.videoElement.srcObject = this.cameraStream;
    this.emit("camera", { stream: this.cameraStream });

    this.micStream = await navigator.mediaDevices.getUserMedia({
      audio: this.audioConstraints,
      video: false
    });

    const session = await this.createSession();
    const ephemeralKey = session.value || session.client_secret?.value;
    if (!ephemeralKey) throw new Error("session did not include an ephemeral key");

    await this.connectWebRTC(ephemeralKey);
    this.connected = true;
    this.emit("status", { status: "live" });
    this.emit("mood", { mood: "listening", caption: "camera and mic live" });
    this.startFramePump();
  }

  async createSession() {
    const response = await fetch(this.sessionEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ safetyId: this.safetyId })
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.message || payload.error || "session failed");
    }
    return payload;
  }

  async connectWebRTC(ephemeralKey) {
    const pc = new RTCPeerConnection();
    this.pc = pc;

    this.remoteAudio = document.createElement("audio");
    this.remoteAudio.autoplay = true;
    pc.ontrack = (event) => {
      this.remoteAudio.srcObject = event.streams[0];
      this.emit("audio", { stream: event.streams[0], element: this.remoteAudio });
    };

    for (const track of this.micStream.getAudioTracks()) {
      pc.addTrack(track, this.micStream);
    }

    const dc = pc.createDataChannel("oai-events");
    this.dc = dc;
    dc.addEventListener("open", () => {
      this.emit("log", { message: "data channel open" });
      this.prime();
    });
    dc.addEventListener("message", (message) => this.handleRealtimeEvent(message));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const response = await fetch(this.realtimeEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ephemeralKey}`,
        "Content-Type": "application/sdp"
      },
      body: offer.sdp
    });

    if (!response.ok) throw new Error(await response.text());

    await pc.setRemoteDescription({
      type: "answer",
      sdp: await response.text()
    });
  }

  handleRealtimeEvent(message) {
    const event = JSON.parse(message.data);
    this.emit("realtime", { event });

    switch (event.type) {
      case "session.created":
        this.emit("log", { message: "session created" });
        break;
      case "input_audio_buffer.speech_started":
        this.emit("mood", { mood: "listening", caption: "listening" });
        break;
      case "input_audio_buffer.speech_stopped":
        this.emit("mood", { mood: "thinking", caption: "chewing on the thought" });
        break;
      case "response.created":
        this.responseText = "";
        this.emit("mood", { mood: "speaking", caption: "speaking" });
        break;
      case "response.output_text.delta":
      case "response.output_audio_transcript.delta":
        this.responseText += event.delta || "";
        this.emit("caption", { text: this.responseText });
        break;
      case "response.done":
        this.emit("mood", { mood: "listening", caption: "waiting for the next scene change" });
        break;
      case "error":
        this.emit("error", { error: event.error || event });
        this.emit("mood", { mood: "idle", caption: "runtime error" });
        break;
      default:
        break;
    }
  }

  prime() {
    this.sendUserInput([{ type: "input_text", text: this.primePrompt }]);
    this.createResponse();
  }

  setFrameInterval(seconds) {
    this.frameIntervalMs = seconds * 1000;
    if (this.connected) this.startFramePump();
  }

  setAutoLook(enabled) {
    this.autoLook = enabled;
  }

  startFramePump() {
    this.stopFramePump();
    this.frameTimer = window.setInterval(() => {
      if (this.autoLook) this.observeFrame();
    }, this.frameIntervalMs);
    this.observeFrame();
  }

  stopFramePump() {
    if (this.frameTimer) window.clearInterval(this.frameTimer);
    this.frameTimer = null;
  }

  observeFrame(prompt = this.scenePrompt) {
    if (!this.isReadyForFrame()) return false;
    const imageUrl = this.captureFrame();
    this.sendUserInput([
      { type: "input_text", text: prompt },
      { type: "input_image", image_url: imageUrl }
    ]);
    this.createResponse();
    this.emit("frame", { imageUrl });
    return true;
  }

  isReadyForFrame() {
    const video = this.videoElement;
    return Boolean(this.dc && this.dc.readyState === "open" && video?.videoWidth);
  }

  attachVideoElement(videoElement) {
    this.videoElement = videoElement;
    if (this.cameraStream) videoElement.srcObject = this.cameraStream;
  }

  captureFrame(videoElement = this.videoElement) {
    if (!videoElement?.videoWidth) throw new Error("no video frame available");

    const ratio = videoElement.videoWidth / videoElement.videoHeight;
    this.canvas.width = this.imageWidth;
    this.canvas.height = Math.round(this.imageWidth / ratio);

    const ctx = this.canvas.getContext("2d");
    ctx.drawImage(videoElement, 0, 0, this.canvas.width, this.canvas.height);
    return this.canvas.toDataURL("image/jpeg", this.imageQuality);
  }

  sendUserInput(content) {
    this.sendEvent({
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content
      }
    });
  }

  createResponse() {
    this.sendEvent({
      type: "response.create",
      response: {
        output_modalities: ["audio"]
      }
    });
  }

  sendEvent(event) {
    if (!this.dc || this.dc.readyState !== "open") return false;
    this.dc.send(JSON.stringify(event));
    return true;
  }

  stop() {
    this.stopFramePump();
    this.dc?.close();
    this.pc?.close();
    this.micStream?.getTracks().forEach((track) => track.stop());
    this.cameraStream?.getTracks().forEach((track) => track.stop());
    this.pc = null;
    this.dc = null;
    this.micStream = null;
    this.cameraStream = null;
    this.connected = false;
    this.emit("status", { status: "offline" });
    this.emit("mood", { mood: "idle", caption: "stopped" });
  }

  emit(type, detail = {}) {
    this.dispatchEvent(new CustomEvent(type, { detail }));
  }
}

const defaultPrimePrompt =
  "You just woke up. Greet me in one short, manic line and ask what you should watch for.";

const defaultScenePrompt =
  "Look at this current camera frame. If something useful, funny, risky, beautiful, or weird is visible, react out loud in character. Be brief. Do not identify real people, sexualize strangers, or insult vulnerable people.";

function getSafetyId() {
  const key = "gopal_safety_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}
