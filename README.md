# FocusTimerProBot — pomodoro timer for Telegram

**Try it:** [@FocusTimerProBot](https://t.me/FocusTimerProBot?start=github) · [tg.zovo.one/bots/focus/](https://tg.zovo.one/bots/focus/)

## What it does

FocusTimerProBot runs focus timers right inside Telegram, solo or shared with a group. `/focus` starts a 25-minute session by default (`/focus 15` / `/focus 50` for the other free presets). In a group, `/focus 25` starts a **shared** session — members tap **🙋 Join** within 2 minutes, and when it ends the bot posts a plain-text roll call (`Session done: @a @b @c — 25 min each`) crediting everyone who joined. A minute-level cron closes sessions on time, credits minutes to each participant's local day, and offers **☕ Break** / **🍅 Again** buttons on a solo session's "done" message. `/focus stats` shows today's and this week's minutes, current streak, and best day. Free tier: the three presets only, 5 sessions/day. Pro (150 ⭐, one-time, purchased in a private chat) adds custom lengths from 1–180 minutes, unlimited sessions/day, session notes (`/focus 25 write the report`), and an automatic Sunday weekly report.

## Use it without adding the bot

Type `@FocusTimerProBot` in **any** Telegram chat, even one the bot has never been added to. It answers with a pitch card — a focus session is stateful and per-user, so nothing useful fits in a single reply.

Both **Inline Mode** and **Guest Chat Mode** need to be turned on for the bot in [@BotFather](https://t.me/BotFather) (Bot Settings → Mode Settings) — turn Inline Mode on first, then Guest Chat Mode. Without both, only the classic `@Bot query` inline surface works.

## Self-host

```bash
pnpm i
wrangler secret put BOT_TOKEN
wrangler secret put WEBHOOK_SECRET
wrangler secret put OWNER_ID # optional
wrangler deploy
curl -G "https://api.telegram.org/bot$BOT_TOKEN/setWebhook" \
  --data-urlencode "url=https://<your-worker>.workers.dev/webhook" \
  --data-urlencode "secret_token=$WEBHOOK_SECRET" \
  --data-urlencode 'allowed_updates=["message","callback_query","guest_message","inline_query","chosen_inline_result"]'
```

## Stack

[grammY](https://grammy.dev/) on Cloudflare Workers, state in a Durable Object backed by SQLite, a minute-level Cron Trigger for session completion and an hourly pass for the weekly report, a Telegram Mini App with a live countdown, Pro upgrades billed with Telegram Stars.

---
Part of Tiny Telegram Tools — https://tg.zovo.one/
