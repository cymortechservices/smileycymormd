# 😄 SMILEY CYMOR MD — GO-LIVE GUIDE
*No one does it better than me* — Owner: Legendary Smiley Cymor · wa.me/254113821327

## What is in this zip

| Folder | What it is |
|---|---|
| `smiley-cymor-md/` | **The bot** (merged from your two Black MD zips, fully rebranded). |
| `smiley-cymor-pair/` | **The pair website** — hacker intro → logo → pairing code → `cymor…` session ID → deploy guide. |

You will put each folder in **its own GitHub repository**, then host them:
pair site → Render (free) · bot → Heroku / Render / panel / VPS.

---

## STEP 1 — Put both folders on GitHub (10 min)

1. Create a free GitHub account → **New repository** → name it `smiley-cymor-md` (Public or Private).
2. Upload the **contents** of the `smiley-cymor-md/` folder (not the zip). Easiest: install *GitHub Desktop* or use git:
   ```bash
   cd smiley-cymor-md
   git init && git add -A && git commit -m "SMILEY CYMOR MD"
   git branch -M main
   git remote add origin https://github.com/cymortechservices/smileycymormd.git
   git push -u origin main
   ```
   > ⚠️ The file `.Env` is a hidden file — make sure it is uploaded. Keep `SESSION=` **empty** in GitHub; put the real session in your host's variables.
3. Repeat with a second repo `smiley-cymor-pair` using the `smiley-cymor-pair/` folder.

## STEP 2 — Launch the pair website on Render (5 min)

1. render.com → **New + → Web Service** → connect your `smiley-cymor-pair` repo.
2. Settings: **Build** `npm install` · **Start** `node server.js` · Plan **Free**.
3. **Environment variable:** `BOT_REPO` = `https://github.com/cymortechservices/smileycymormd`
   (this switches on the Heroku / Render / Download / Fork buttons on the page).
4. **Create Web Service.** In a minute you get a link like `https://smiley-cymor-pair.onrender.com` — **that is your pair website.**

> Render's free plan sleeps after ~15 min idle, so the first visit can take up to a minute to wake. Add a free UptimeRobot monitor on `https://your-site/health` (every 5 min) to keep it awake.
> Alternative: Heroku also works (`pair` folder has a `Procfile` and `app.json`).

## STEP 3 — Test it with your own number (2 min)

1. Open your pair site → watch the intro → **ENTER**.
2. Type your number **without + and without leading 0**: `0113821327` → **`254113821327`**.
3. Press **Generate pairing code**. On your phone: WhatsApp → **Linked devices → Link a device → Link with phone number instead** → type the code.
4. In a few seconds a WhatsApp message arrives (in *Message yourself*) containing your **Session ID starting with `cymor`**. Copy the whole thing.

## STEP 4 — Deploy the bot

Use the session ID as the **`SESSION`** variable. Pick one:

**🟣 Heroku** — open the pair site → Deploy → *Deploy to Heroku* (or `https://heroku.com/deploy?template=https://github.com/cymortechservices/smileycymormd`). Paste `SESSION`, set `DEV=254113821327` → Deploy → *Resources* tab → make sure **web** is ON.

**🟢 Render** — New + → Web Service → your `smiley-cymor-md` repo · Build `npm install` · Start `node index.js` · add `SESSION` · Create. Add an UptimeRobot monitor on `https://your-bot.onrender.com/uptime` every 5 min.

**🖥️ Panel / VPS** — upload the `smiley-cymor-md` folder, open `.Env`, fill `SESSION=cymor~…`, run `npm install` then `node index.js` (Node 22+). On a VPS use pm2:
`npm i -g pm2 && pm2 start index.js --name smiley-cymor-md && pm2 save`

## STEP 5 — Confirm it is alive

Within ~30 s the bot messages **you** (“Connected successfully”). Then send:

* `.menu` → the new colourful menu (logo + stats card, then categories). `.menu downloads` shows one category with descriptions.
* `.ping`, `.owner`, `.repo`, `.cymor`

Settings (owner only): `.menutype video|image|link|text` · `.mode public|private` · `.prefix !`

## Optional extras

| Want | Set this variable |
|---|---|
| `.pair` command inside the bot | `PAIR_URL=https://your-pair-site` |
| `.zip` and `.update` (Heroku) | `GITHUB_REPO=cymortechservices/smileycymormd`, `HEROKU_API`, `APP_NAME` |
| Auto-follow your channel when a bot connects | `AUTO_FOLLOW_CHANNEL=true` (off by default — it acts on users' accounts, so only enable if you tell them) |
| `.tg` Telegram sticker packs | `TELEGRAM_BOT_TOKEN` (create with @BotFather) |

## Troubleshooting

| Problem | Fix |
|---|---|
| “Invalid session ID” in logs | Copy the **whole** `cymor…` text; no spaces added/removed. Re-pair if unsure. |
| Pair page: “Could not get a pairing code” | Number must include country code, no `+`, no leading 0, and be a real WhatsApp number. |
| Code entered but nothing arrives | Wait 20 s; check *Message yourself*. If the page says sending failed, use **Copy Session ID** on the page. |
| Bot connects then “Logged out” | You removed the linked device in WhatsApp. Pair again for a new session. |
| Bot replies twice / “Connection replaced” | The same session is running in two places. Stop one. |
| Menu has no image | Make sure `media/menu.jpg` and `media/menu.mp4` were uploaded to GitHub. |

## ⚠️ Read this

* **The session ID is a password** — anyone holding it controls that WhatsApp account. Never post it publicly or commit it to GitHub.
* The pair server keeps nothing: temp files are deleted after delivery and session IDs aren't logged or stored.
* **What changed beyond the rebrand (security):** the original bot downloaded and ran code from `McrayNick/BLACK-MD-PLUGINS` on every start, used a database login belonging to its author for session lookups, contained a hard-coded Telegram token, and auto-joined the author's WhatsApp group. All of these were removed; everything now runs from your own files.
* **Not tested live:** I could not install npm packages or reach WhatsApp from my build environment, so the bot and the pairing against real WhatsApp servers have **not** been run end to end. What I did verify: all files pass syntax checks; the pair server's full flow (code → link → session → delivery → cleanup) against a simulated WhatsApp; the bot's session decoder against the pair server's output; the menu output; and the web pages in a real browser (desktop + phone size). Do Step 3 and 4 with your own number first, before sharing the site publicly.
* License: the project is MIT. The original copyright line (Nick Hunter) must stay in `LICENSE` — your name is added beneath it.
