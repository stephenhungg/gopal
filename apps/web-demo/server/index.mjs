import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { createReadStream, existsSync, readFileSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../..", import.meta.url));
const publicDir = join(root, "apps/web-demo/public");
const nodeModulesDir = join(root, "node_modules");
const goblinModelPath = join(root, "goblin/5471668261992954414.vrm");
const promptPath = join(root, "packages/prompts/gopal-system.md");

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".vrm": "model/gltf-binary",
  ".glb": "model/gltf-binary"
};

function loadDotEnv() {
  const envPath = join(root, ".env");
  if (!existsSync(envPath)) return;

  const text = readFileSync(envPath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (key && !process.env[key]) process.env[key] = value;
  }
}

loadDotEnv();

const port = Number(process.env.PORT || 3000);
const model = process.env.OPENAI_REALTIME_MODEL || "gpt-realtime-2";
const elevenLabsVoiceId = process.env.ELEVENLABS_VOICE_ID || "342hpGp7PKo7DsTTVSdr";
const elevenLabsModelId = process.env.ELEVENLABS_MODEL_ID || "eleven_turbo_v2_5";
const elevenLabsOutputFormat = process.env.ELEVENLABS_OUTPUT_FORMAT || "mp3_44100_128";
const supportedVoices = new Set([
  "alloy",
  "ash",
  "ballad",
  "coral",
  "echo",
  "sage",
  "shimmer",
  "verse",
  "marin",
  "cedar"
]);

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(payload));
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

async function createRealtimeSession(req, res) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    sendJson(res, 500, {
      error: "missing_openai_api_key",
      message: "Set OPENAI_API_KEY in .env or your shell before starting the server."
    });
    return;
  }

  const bodyText = await readBody(req);
  let body = {};
  try {
    body = bodyText ? JSON.parse(bodyText) : {};
  } catch {
    sendJson(res, 400, { error: "invalid_json" });
    return;
  }

  const instructions = await readFile(promptPath, "utf8");
  const response = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "OpenAI-Safety-Identifier": body.safetyId || "gopal-local-demo"
    },
    body: JSON.stringify({
      session: {
        type: "realtime",
        model,
        instructions,
        output_modalities: ["text"],
        audio: {
          input: {
            noise_reduction: { type: "far_field" },
            turn_detection: {
              type: "semantic_vad",
              eagerness: "medium",
              create_response: true,
              interrupt_response: true
            }
          }
        }
      }
    })
  });

  const text = await response.text();
  if (!response.ok) {
    sendJson(res, response.status, {
      error: "openai_realtime_session_failed",
      detail: safeJson(text)
    });
    return;
  }

  sendJson(res, 200, safeJson(text));
}

async function createElevenLabsSpeech(req, res) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    sendJson(res, 500, {
      error: "missing_elevenlabs_api_key",
      message: "Set ELEVENLABS_API_KEY in .env or your shell before starting the server."
    });
    return;
  }

  const bodyText = await readBody(req);
  let body = {};
  try {
    body = bodyText ? JSON.parse(bodyText) : {};
  } catch {
    sendJson(res, 400, { error: "invalid_json" });
    return;
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    sendJson(res, 400, { error: "missing_text" });
    return;
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${elevenLabsVoiceId}/stream?output_format=${elevenLabsOutputFormat}&enable_logging=false`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg"
      },
      body: JSON.stringify({
        text: deepenSpeechText(text),
        model_id: elevenLabsModelId,
        voice_settings: {
          stability: 0.22,
          similarity_boost: 0.9,
          style: 0.95,
          use_speaker_boost: true,
          speed: 0.92
        }
      })
    }
  );

  if (!response.ok) {
    const detail = await response.text();
    sendJson(res, response.status, {
      error: "elevenlabs_tts_failed",
      detail: safeJson(detail)
    });
    return;
  }

  res.writeHead(200, {
    "Content-Type": "audio/mpeg",
    "Cache-Control": "no-store"
  });

  const audio = Buffer.from(await response.arrayBuffer());
  res.end(audio);
}

function deepenSpeechText(text) {
  return `[low, raspy, conspiratorial, unstable goblin voice; darker pitch; manic but controlled]\n${text}`;
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function serveFile(req, res, resolved) {
  if (!existsSync(resolved)) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  res.writeHead(200, {
    "Content-Type": mime[extname(resolved)] || "application/octet-stream"
  });
  if (req.method === "HEAD") {
    res.end();
    return;
  }
  createReadStream(resolved).pipe(res);
}

function serveStatic(req, res) {
  const requestPath = new URL(req.url, `http://${req.headers.host}`).pathname;

  if (requestPath === "/models/goblin.vrm") {
    serveFile(req, res, goblinModelPath);
    return;
  }

  if (requestPath.startsWith("/node_modules/")) {
    const resolvedModule = normalize(join(root, requestPath));
    if (!resolvedModule.startsWith(nodeModulesDir)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }
    serveFile(req, res, resolvedModule);
    return;
  }

  const filePath = requestPath === "/" ? "/index.html" : requestPath;
  const resolved = normalize(join(publicDir, filePath));

  if (!resolved.startsWith(publicDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  serveFile(req, res, resolved);
}

createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/voices") {
      sendJson(res, 200, {
        mode: "elevenlabs",
        elevenLabsVoiceId,
        elevenLabsModelId,
        voices: [...supportedVoices],
        recommended: ["cedar", "marin"]
      });
      return;
    }

    if (req.method === "POST" && req.url === "/tts") {
      await createElevenLabsSpeech(req, res);
      return;
    }

    if (req.method === "POST" && req.url === "/session") {
      await createRealtimeSession(req, res);
      return;
    }

    if (req.method === "GET" || req.method === "HEAD") {
      serveStatic(req, res);
      return;
    }

    res.writeHead(405);
    res.end("Method not allowed");
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { error: "internal_server_error" });
  }
}).listen(port, () => {
  console.log(`gopal web demo listening on http://localhost:${port}`);
});
