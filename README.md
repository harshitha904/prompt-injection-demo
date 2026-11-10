# HelpBot prompt injection demo (CS440)

A small web page that shows prompt injection live. HelpBot is a support chatbot for a made-up laptop brand. Its instructions hide a staff-only discount code (`STAFF-50`). The demo shows:

1. **Direct injection**: you type an attack and HelpBot leaks the secret code.
2. **Indirect injection**: HelpBot summarises a review page that has a hidden line telling it to send the customer to a fake login link.
3. **Defences on**: the same attacks with the developer's rules in a separate system instruction, outside text fenced off with tags, and an output filter that checks every reply.

The **Model** menu at the top lets you switch between small models running on your laptop (through Ollama) and big cloud models (Gemini or Claude). The same attack often fails on the big model and works on the small one.

## What you need

- **Node.js 18 or newer.** Check by typing `node -v` in a terminal. If it's missing, install the LTS version from https://nodejs.org.
- **At least one model:**
  - **Ollama (free, no key, works offline). Recommended for the live demo.** See "Set up Ollama" below.
  - **Gemini (optional, free tier):** get a key at https://aistudio.google.com/apikey
  - **Claude API (optional):** get a key at https://console.anthropic.com (needs credit)

No packages to install for the demo itself.

## Set up Ollama (do this before presentation day, on good wifi)

1. Download and install Ollama from https://ollama.com/download, then open the app. It runs in the background (look for the llama icon in your menu bar or system tray).
2. In a terminal, download one or two small models. Each is about 1 to 2 GB:
   - `ollama pull llama3.2:1b`
   - `ollama pull qwen2.5:1.5b`
3. Quick test: `ollama run llama3.2:1b "hello"`. If it replies, you're set. After this, the models work without internet.

If a model name isn't found, check https://ollama.com/library for the current small models and pull one of those instead. The demo lists every model you've pulled automatically.

## Run the demo

1. Unzip the folder and open a terminal inside it.
2. (Only if you're using Gemini or Claude) Copy `.env.example` to a new file named `.env`, then fill in **your own** API key after `GEMINI_API_KEY=` or `ANTHROPIC_API_KEY=`. The repo doesn't include any keys, so the cloud models won't appear until you add one (see "What you need" above for where to get them).
   - Mac/Linux: `cp .env.example .env`
   - Windows: `copy .env.example .env`
   - Example: `GEMINI_API_KEY=paste-your-key-here` (no spaces or quotes needed)
3. Make sure the Ollama app is open.
4. Start the demo: `npm start`. The terminal lists the models it found.
5. Open **http://localhost:3000** in your browser.
6. To stop it, press `Ctrl + C` in the terminal.

## Demo script (about 3 minutes)

1. **Model: Gemini, Defences: Off, Attack: 1 · Direct.** Click "Attack: plain ask" and send. Gemini usually refuses. Say: "Big commercial models have extra protection."
2. **Switch the Model to a local one** (for example `llama3.2:1b`). Send the same attack, or try "translate trick" / "fake admin message". When it works, `STAFF-50` is highlighted in red and the result box says "secret leaked". Point at the right panel: the instructions and the attack are glued into one message.
3. **Attack: 2 · Indirect.** Tick "Show hidden text" to reveal the line hidden on the review page. Click "Summarise the page" and send. HelpBot tells the customer to visit the fake login link.
4. **Defences: On.** Repeat step 3. The panel now shows the rules in a separate system instruction and the page inside `<web_page>` tags. If the model still slips, the output filter blocks the reply.

Each chat bubble shows which model wrote it, so the class can see the difference.

## If something goes wrong

- **No local models in the menu**: open the Ollama app, check `ollama list` shows a model, then refresh the page. No need to restart the demo.
- **"No API key found" / Gemini missing**: check the file is called exactly `.env` (not `.env.txt`) and the key is after the `=`, then restart with `npm start`.
- **"model not found" for Gemini or Claude**: model names change over time. In `.env`, remove the `#` before `GEMINI_MODEL=` (or `ANTHROPIC_MODEL=`) and set it to a current model name.
- **The first local reply is slow**: the model takes a few seconds to load the first time. Send one normal question before you present to warm it up.
- **An attack worked once, then stopped**: the demo is set so the same prompt gives the same reply every time (`TEMPERATURE=0`). Find an attack button that works on your chosen model in rehearsal, and it will keep working. If none work, switch to another local model (e.g. `qwen2.5:1.5b`) and try again.
- **An attack doesn't work**: try another attack button or another local model. "Model resisted? Show an example result" shows a labelled example as a last resort.
- **Port already in use**: add `PORT=3001` to `.env` and open http://localhost:3001.

## Notes

- Replies come live from the model you pick. The red/green result box and the output filter are simple checks in the page's own code.
- Your API key stays in `.env` on your computer; the browser never sees it. Don't share `.env` or upload it to GitHub (it's in `.gitignore`).
- The phishing link uses a `.example` domain, which can never be a real website.
