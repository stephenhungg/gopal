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
- Camera preview from MacBook or Vision Pro Safari
- Microphone to OpenAI Realtime over WebRTC
- OpenAI audio responses with a goblin system prompt
- Periodic camera frame snapshots sent as image inputs
- Animated goblin avatar state: idle, listening, thinking, speaking

The current OpenAI realtime model supports text, audio, and image input, plus audio output. It does not support native continuous video input, so Gopal samples the live camera stream into JPEG frames and sends those frames every few seconds.

## quick start

```bash
cd ~/Documents/gopal
cp .env.example .env
```

Put your OpenAI API key in `.env`:

```bash
OPENAI_API_KEY=sk-proj-your-key
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

## model defaults

- `OPENAI_REALTIME_MODEL=gpt-realtime-2`
- `OPENAI_REALTIME_VOICE=marin`

`gpt-realtime-2` is the high-end realtime voice model. `marin` is one of the recommended built-in voices. The goblin character comes mostly from the system prompt and speaking style.

## file structure

```text
gopal/
  apps/
    landing-page/
      .gitkeep
    visionos/
    web-demo/
      public/
      server/
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
5. Add motion/change detection so frames are sent when the scene changes, not only on a timer.
6. Add interruptible speech so Gopal can react immediately to new visual events.
7. Move the same perception loop into Vision Pro once the web loop feels alive.
