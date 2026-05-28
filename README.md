# gopal

Goblin opal: a realtime voice and vision companion for Apple Vision Pro and browser camera streams.

## product target

Gopal is a low-latency live perception companion. The core product requirement is not the goblin model or visual character, it is making any camera stream feel like a realtime spatial intelligence layer.

The system must eventually connect to:

- MacBook camera
- iPhone camera
- Apple Vision Pro camera or passthrough-compatible inputs
- external webcams
- RTSP, WebRTC, or other live video feeds

The priority is functional latency: see the world, react quickly, speak naturally, and keep updating as the scene changes.

## what works now

- Browser demo at `apps/web-demo`
- Reusable browser runtime at `apps/web-demo/public/gopal-runtime.js`
- Real VRM goblin renderer at `apps/web-demo/public/vrm-stage.js`
- Goblin model served from `goblin/5471668261992954414.vrm`
- Semantic FBX animations from `animations/`
- Camera preview from MacBook or Vision Pro Safari
- Microphone to OpenAI Realtime over WebRTC
- OpenAI Realtime for listening, vision context, and text responses
- ElevenLabs custom voice output through `ELEVENLABS_VOICE_ID`
- Periodic camera frame snapshots sent as silent visual context
- Ambient speech only on meaningful scene changes or `look now`
- Animated VRM goblin state: idle, listening, thinking, speaking

The current OpenAI realtime model supports text, audio, and image input. Gopal uses OpenAI for listening, vision context, and text generation, then ElevenLabs for the actual spoken goblin voice. Native continuous video input is not supported, so Gopal samples the live camera stream into JPEG frames and sends those frames every few seconds.

## quick start

```bash
cd ~/Documents/gopal
cp .env.example .env
```

Put your OpenAI API key in `.env`:

```bash
OPENAI_API_KEY=sk-proj-your-key
ELEVENLABS_API_KEY=sk-your-elevenlabs-key
ELEVENLABS_VOICE_ID=OTMqA7lryJHXgAnPIQYt
```

Then run:

```bash
bun run dev
```

Open:

```text
http://localhost:3000
```

Click `wake gopal`, allow camera and mic, then talk.

## plugging into another interface

The functional core is `GopalRuntime`:

```js
import { GopalRuntime } from "/gopal-runtime.js";

const runtime = new GopalRuntime();
runtime.attachVideoElement(document.querySelector("video"));

runtime.addEventListener("mood", (event) => {
  console.log(event.detail.mood, event.detail.caption);
});

runtime.addEventListener("caption", (event) => {
  console.log(event.detail.text);
});

await runtime.start();
```

Your Vision Pro UI only needs to provide a video element or camera stream surface, then listen for runtime events like `status`, `camera`, `audio`, `mood`, `caption`, `frame`, `realtime`, `log`, and `error`.

Camera frames are usually sent as silent context. The runtime only asks the model to speak on user voice turns, manual `runtime.speakAboutCurrentFrame()`, or meaningful ambient changes after a cooldown.

The goblin interface is `GopalVrmStage`:

```js
import { GopalRuntime } from "/gopal-runtime.js";
import { GopalVrmStage } from "/vrm-stage.js";

const runtime = new GopalRuntime();
const stage = new GopalVrmStage(document.querySelector("canvas"));

stage.bindRuntime(runtime);
await stage.load();
await runtime.start();
```

This keeps the realtime functionality and the rendered goblin separate, while still letting the model react to speaking/listening/thinking states.

## model defaults

- `OPENAI_REALTIME_MODEL=gpt-realtime-2`
- `ELEVENLABS_MODEL_ID=eleven_turbo_v2_5`
- `ELEVENLABS_VOICE_ID=OTMqA7lryJHXgAnPIQYt`

`gpt-realtime-2` handles low-latency listening and text generation. ElevenLabs handles the final spoken voice. The server uses aggressive voice settings for unstable goblin energy and the browser plays the audio slightly slower with pitch preservation disabled for a deeper sound.

## file structure

```text
gopal/
  apps/
    landing-page/
      .gitkeep
    visionos/
    web-demo/
      public/
        gopal-runtime.js
        vrm-stage.js
      server/
  goblin/
    5471668261992954414.vrm
  animations/
    dance.fbx
    spotted.fbx
  packages/
    prompts/
      gopal-system.md
    shared/
      avatar-state.schema.json
  docs/
```

## build order

1. Realtime browser voice loop
2. Live camera frame observation
3. Animated Gopal avatar states
4. Vision Pro Safari test
5. Native visionOS shell

## functional roadmap

1. Abstract camera input behind a `VideoSource` interface.
2. Support browser `getUserMedia` first.
3. Add external stream adapters: RTSP, WebRTC ingest, screen capture, local files.
4. Lower frame-to-reaction latency with adaptive frame sampling.
5. Improve motion/change detection so ambient speech feels intentional.
6. Add interruptible speech so Gopal can react immediately to new visual events.
7. Move the same perception loop into Vision Pro once the web loop feels alive.

## animation triggers

- `dance.fbx`: celebration, excitement, happy moments, hype.
- `spotted.fbx`: G Opal notices something worth commenting on in the camera.

The renderer retargets common Mixamo-style FBX bone names onto VRM humanoid bones. New animations should be dropped into `animations/`, served as `/animations/name.fbx`, then registered in `vrm-stage.js` or the UI adapter.
