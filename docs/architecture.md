# architecture

## north star

Gopal is a camera-agnostic realtime perception loop. The avatar and character rendering can be swapped later. The hard part is making a live video feed feel like an always-present spatial intelligence with minimal latency.

The target architecture should accept any video source:

- browser camera through `getUserMedia`
- Vision Pro camera or passthrough-compatible capture path
- external USB webcams
- phone camera bridge
- RTSP streams
- WebRTC remote streams
- screen capture or local video sources for testing

## current prototype

Gopal is a browser-first realtime companion.

```text
Browser camera + mic
  -> WebRTC audio track to OpenAI Realtime
  -> JPEG camera snapshots over Realtime data channel
  -> OpenAI text output over Realtime data channel
  -> ElevenLabs custom voice TTS
  -> DOM avatar reacts to lifecycle events
```

This is a frame-sampled realtime approximation. Current realtime models do not accept native continuous video input, so the app converts the live feed into frequent image observations.

## server

The local Node server never sends the standard API key to the browser. It reads `OPENAI_API_KEY` from `.env` or the shell, then mints a short-lived Realtime client secret through `POST /v1/realtime/client_secrets`.

## client

The browser runtime lives in `apps/web-demo/public/gopal-runtime.js`. It owns functionality only:

- requests camera and mic access
- fetches a client secret from `/session`
- creates a WebRTC peer connection
- posts the SDP offer to `POST /v1/realtime/calls`
- listens for Realtime events over the `oai-events` data channel
- captures camera frames and sends them as `input_image` conversation items
- sends most frames as silent visual context
- requests speech only for user turns, manual look requests, or meaningful ambient scene changes
- sends final text to `/tts` for ElevenLabs speech

The test UI in `apps/web-demo/public/app.js` only imports `GopalRuntime` and maps its events onto the page. It is not the product interface.

## goblin interface

The browser interface renders the VRM file at `goblin/5471668261992954414.vrm` through `apps/web-demo/public/vrm-stage.js`.

`GopalVrmStage` owns only model rendering:

- loads the VRM model from `/models/goblin.vrm`
- frames it in a transparent Three.js canvas
- puts the model in a simple standing pose
- animates idle bobbing
- opens mouth / expression values while the runtime is speaking
- reacts to runtime `mood` events

This keeps the goblin view separate from `GopalRuntime`, so a Vision Pro surface can replace either the DOM test UI or the renderer without touching the realtime OpenAI path.

## runtime events

External interfaces should plug into these events:

- `status`: connection status like `summoning`, `live`, or `offline`
- `camera`: local camera `MediaStream`
- `audio`: remote audio stream and audio element
- `mood`: simple avatar state such as `listening`, `thinking`, or `speaking`
- `caption`: transcript text when available
- `frame`: emitted after a sampled frame is sent
- `realtime`: raw OpenAI Realtime event
- `log`: human-readable runtime note
- `error`: runtime or API error

## model choice

Default: `gpt-realtime-2`.

Reason: it is OpenAI's most capable realtime model for the live reasoning loop. Native video input is not supported, so continuous vision is approximated with periodic image frames.

Speech output is handled by ElevenLabs voice `342hpGp7PKo7DsTTVSdr` through `/tts`. This adds some latency versus OpenAI speech-to-speech, but gives us the exact custom goblin voice.

## next architecture step

For Vision Pro, keep this web path first. Safari on visionOS can test camera, mic, and audio behavior faster than a native RealityKit shell. Native visionOS should wrap the same state protocol after the demo loop is proven.

## latency strategy

The app should move from fixed interval frame sending to adaptive perception:

- send an initial frame immediately after connection
- sample faster when the user is moving or the scene changes
- sample slower when the view is static
- allow visual events to interrupt or queue speech
- prefer small compressed frames for speed
- keep audio WebRTC native for low-latency speech

The success metric is subjective but clear: the user should feel like Gopal is watching the same world at the same time, not commenting on stale screenshots.

## ambient behavior

The runtime intentionally avoids talking nonstop:

- every vision pulse can update model context silently
- a simple frame-difference score detects meaningful visual change
- ambient speech has an 18 second cooldown by default
- `look now` forces an immediate spoken observation
- user speech still gets normal low-latency realtime responses
