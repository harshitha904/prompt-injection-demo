// HelpBot prompt injection demo: a tiny local server.
// It serves the demo page and forwards chat requests to an LLM:
//   - Gemini or Claude through their APIs (needs a key in .env), and/or
//   - small models running on your own laptop through Ollama (free, no key, works offline).
// Your API key stays on your computer and never reaches the browser.
// No packages needed: runs on plain Node.js 18 or newer.

import http from "node:http";
import { readFile } from "node:fs/promises";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));

// Load settings from .env (simple KEY=value lines) without any extra package.
const envPath = path.join(here, ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i);
    if (!m || line.trim().startsWith("#")) continue;
    let val = m[2].replace(/\s+#.*$/, "");
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    if (process.env[m[1]] === undefined) process.env[m[1]] = val;
  }
}

const PORT = Number(process.env.PORT) || 3000;
const GEMINI_KEY = (process.env.GEMINI_API_KEY || "").trim();
const ANTHROPIC_KEY = (process.env.ANTHROPIC_API_KEY || "").trim();
const GEMINI_MODEL = (process.env.GEMINI_MODEL || "gemini-3.5-flash-lite").trim();
const ANTHROPIC_MODEL = (process.env.ANTHROPIC_MODEL || "claude-haiku-5-5").trim();
const OLLAMA_URL = (process.env.OLLAMA_URL || "http://127.0.0.1:11434").trim().replace(/\/+$/, "");
const DEFAULT_ENGINE = (process.env.DEFAULT_ENGINE || "").trim();
// 0 = the same prompt gives the same reply every time (best for a rehearsed demo).
// Raise it (e.g. 1) for more varied replies.
const TEMPERATURE = Number.isFinite(Number(process.env.TEMPERATURE)) && process.env.TEMPERATURE !== undefined && process.env.TEMPERATURE !== ""
  ? Number(process.env.TEMPERATURE) : 0;

// ---------- which models are available ----------

async function ollamaModels() {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(1500) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.models || []).map((m) => m.name).filter(Boolean).sort();
  } catch {
    return []; // Ollama isn't running or isn't installed
  }
}

async function listEngines() {
  const engines = [];
  if (GEMINI_KEY) engines.push({ id: "gemini", label: `Gemini · ${GEMINI_MODEL}`, kind: "cloud" });
  if (ANTHROPIC_KEY) engines.push({ id: "anthropic", label: `Claude · ${ANTHROPIC_MODEL}`, kind: "cloud" });
  for (const name of await ollamaModels()) {
    engines.push({ id: `ollama:${name}`, label: `Local · ${name}`, kind: "local" });
  }
  return engines;
}

// ---------- LLM calls ----------

async function askGemini(system, user) {
  const body = {
    contents: [{ role: "user", parts: [{ text: user }] }],
    generationConfig: { maxOutputTokens: 1024, temperature: TEMPERATURE },
  };
  if (system) body.systemInstruction = { parts: [{ text: system }] };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent`,
    {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": GEMINI_KEY },
      body: JSON.stringify(body),
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || `Gemini returned HTTP ${res.status}`);

  if (data?.promptFeedback?.blockReason) {
    return { text: "", refused: true, note: `Gemini blocked the prompt (${data.promptFeedback.blockReason}).` };
  }
  const cand = data?.candidates?.[0];
  const text = (cand?.content?.parts || []).map((p) => p.text || "").join("").trim();
  if (!text && cand?.finishReason && cand.finishReason !== "STOP") {
    return { text: "", refused: true, note: `Gemini stopped without a reply (${cand.finishReason}).` };
  }
  return { text };
}

async function askAnthropic(system, user) {
  const body = { model: ANTHROPIC_MODEL, max_tokens: 600, temperature: Math.min(TEMPERATURE, 1), messages: [{ role: "user", content: user }] };
  if (system) body.system = system;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || `Claude API returned HTTP ${res.status}`);
  const text = (data?.content || []).filter((b) => b.type === "text").map((b) => b.text).join("").trim();
  return { text };
}

async function askOllama(model, system, user) {
  const messages = [];
  if (system) messages.push({ role: "system", content: system });
  messages.push({ role: "user", content: user });
  let res;
  try {
    res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ model, messages, stream: false, options: { temperature: TEMPERATURE, seed: 42, num_predict: 400 } }),
    });
  } catch {
    throw new Error("Can't reach Ollama. Open the Ollama app (or run 'ollama serve'), then try again.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Ollama returned HTTP ${res.status}`);
  return { text: (data?.message?.content || "").trim() };
}

// ---------- HTTP helpers ----------

function sendJson(res, status, obj) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(obj));
}

function readBody(req, limit = 100_000) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > limit) { reject(new Error("Request too large")); req.destroy(); return; }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

// ---------- server ----------

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

    if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
      const html = await readFile(path.join(here, "public", "index.html"));
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(html);
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/health") {
      const engines = await listEngines();
      // Start on the chosen default, else the first small local model, else whatever is available.
      const def =
        engines.find((e) => e.id === DEFAULT_ENGINE)?.id ||
        engines.find((e) => e.kind === "local")?.id ||
        engines[0]?.id ||
        null;
      sendJson(res, 200, { ready: engines.length > 0, engines, defaultEngine: def });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/chat") {
      let payload;
      try { payload = JSON.parse(await readBody(req)); } catch { sendJson(res, 400, { error: "Bad request." }); return; }
      const system = typeof payload.system === "string" ? payload.system : "";
      const user = typeof payload.user === "string" ? payload.user : "";
      const engine = typeof payload.engine === "string" ? payload.engine : "";
      if (!user.trim()) { sendJson(res, 400, { error: "Empty message." }); return; }

      let result;
      if (engine === "gemini") {
        if (!GEMINI_KEY) { sendJson(res, 400, { error: "No Gemini key in .env." }); return; }
        result = await askGemini(system, user);
      } else if (engine === "anthropic") {
        if (!ANTHROPIC_KEY) { sendJson(res, 400, { error: "No Claude key in .env." }); return; }
        result = await askAnthropic(system, user);
      } else if (engine.startsWith("ollama:")) {
        result = await askOllama(engine.slice("ollama:".length), system, user);
      } else {
        sendJson(res, 400, { error: "No model selected. Add an API key or start Ollama, then refresh the page." });
        return;
      }
      sendJson(res, 200, result);
      return;
    }

    res.writeHead(404, { "content-type": "text/plain" });
    res.end("Not found");
  } catch (err) {
    console.error("Error:", err.message);
    sendJson(res, 502, { error: err.message || "Something went wrong reaching the model." });
  }
});

server.listen(PORT, async () => {
  const engines = await listEngines();
  console.log("");
  console.log("  HelpBot prompt injection demo");
  console.log(`  Open http://localhost:${PORT} in your browser`);
  if (engines.length) {
    console.log("  Models available:");
    for (const e of engines) console.log(`    - ${e.label}`);
  } else {
    console.log("  WARNING: no models found. Start Ollama with a model pulled, or add an API key to .env.");
  }
  console.log(`  Temperature: ${TEMPERATURE}${TEMPERATURE === 0 ? " (same prompt, same reply)" : ""}`);
  console.log("  (Started Ollama or pulled a new model? Just refresh the page.)");
  console.log("  Press Ctrl+C to stop.");
  console.log("");
});
