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
  -> OpenAI audio output back over WebRTC
  -> DOM avatar reacts to lifecycle events
```

This is a frame-sampled realtime approximation. Current realtime models do not accept native continuous video input, so the app converts the live feed into frequent image observations.

## server

The local Node server never sends the standard API key to the browser. It reads `OPENAI_API_KEY` from `.env` or the shell, then mints a short-lived Realtime client secret through `POST /v1/realtime/client_secrets`.

## client

The browser:

- requests camera and mic access
- fetches a client secret from `/session`
- creates a WebRTC peer connection
- posts the SDP offer to `POST /v1/realtime/calls`
- listens for Realtime events over the `oai-events` data channel
- captures camera frames and sends them as `input_image` conversation items

## model choice

Default: `gpt-realtime-2`.

Reason: it is OpenAI's most capable realtime voice model and supports text, image, and audio input with text and audio output. Native video input is not supported, so continuous vision is approximated with periodic image frames.

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
