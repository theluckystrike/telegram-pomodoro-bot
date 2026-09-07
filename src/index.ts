import { Bot, Context, InlineKeyboard } from "grammy";
import { Env as KitEnv, PRO_STARS, ProSpec, displayName, isPrivate, makeFetch, now, preparedShare, sendInvoice, wirePro } from "./kit.ts";
import { GuestReply, wireGuest, wireInline } from "./guest.ts";
import { Store, SessionKind } from "./db.ts";
import { APP_HTML, ProLinkBody, buildShareText, handleAction, handleProLink, initDataFailure, initDataStartParam, isExcludedAppUser, validateInitData } from "./webapp.ts";
import type { ProPlan } from "./webapp-i18n.ts";
import { BOT, publicLink } from "./botname.ts";
import {
  BREAK_MINUTES, FREE_DAILY_CAP, FREE_PRESETS, STREAK_MINUTES, bestDayMinutes, computeStreak, dayIndex, endTime,
  formatClock, guestPitch, isRealSender, isSourcePayload, joinAllowed, parseFocusArgs, parseHour, parseTz, underDailyCap, validateLength, weekDays,
} from "./logic.ts";
import { resolveLang, t } from "./i18n.ts";
export { Store };

const MORE_TEXT = "More free tools by the same maker:\n🔒 @WhisperLockBot — locked messages only one person can open\n⏰ @NudgeRemindBot — reminders that arrive on time\n📮 @AnonInboxProBot — anonymous inbox via your link\n🧾 @SplitTabsBot — split group expenses\n🔥 @HabitStreakProBot — habit streaks with daily check-ins\n🍅 @FocusBot — focus timers with streaks";
interface Env extends KitEnv { STORE: DurableObjectNamespace<Store>; }
const store = (env: Env) => env.STORE.get(env.STORE.idFromName("main"));
const SHARE_TEXT = "Focus timers with real streaks, right inside Telegram.";
const shareUrl = () => `https://t.me/share/url?url=${encodeURIComponent(`https://t.me/${BOT}?start=share`)}&text=${encodeURIComponent(SHARE_TEXT)}`;
const proDeepLink = () => `https://t.me/${BOT}?start=pro`;

const PRO: ProSpec = {
  title: "FocusBot Pro",
  description: "Any focus length 1-180 min, unlimited sessions, session notes, and a weekly report. One-time payment, no subscription.",
  payload: "focus-pro",
  thanks: "✅ Pro unlocked: any length, unlimited sessions, notes, weekly report.\n\n/more — more free tools",
};

/** Mints the same invoice link the chat flow uses (no monthly plan for this bot, so `plan`
 * is always "onetime" by the time it gets here — normalizePlan already degrades it).
 * Shared by /pro's callback flow (via sendInvoice) and the Mini App's POST /api/pro-link. */
function proLink(api: Bot["api"], _plan: ProPlan): Promise<string> {
  return api.createInvoiceLink(PRO.title, PRO.description, PRO.payload, "", "XTR", [{ label: PRO.title, amount: PRO_STARS }]);
}

/** Acknowledging a tap is cosmetic; the action behind it is not. A stale, expired or
 * already-answered callback id makes answerCallbackQuery throw, and an unguarded throw
 * would abort the handler before it does the work the tap asked for. */
async function ack(ctx: Context): Promise<void> {
  try { await ctx.answerCallbackQuery(); } catch { /* stale or invalid query id */ }
}

/** In a group, Star invoices can't be sent — offer a deep link into the private chat instead. */
function proKb(ctx: Context, lang: string): InlineKeyboard {
  const label = t(lang, "btn_unlockPro");
  return isPrivate(ctx) ? new InlineKeyboard().text(label, "pro") : new InlineKeyboard().url(label, proDeepLink());
}

async function onPro(ctx: Context, env: Env): Promise<void> {
  const from = ctx.from;
  if (!from) return;
  const lang = resolveLang(from.language_code);
  const u = await store(env).touchUser(from.id, from.username, displayName(from));
  if (u.pro) { await ctx.reply(t(lang, "alreadyPro")); return; }
  if (!isPrivate(ctx)) {
    await ctx.reply(t(lang, "proGroupInfo", { stars: PRO_STARS }), { reply_markup: new InlineKeyboard().url(t(lang, "btn_openBot"), proDeepLink()) });
    return;
  }
  await sendInvoice(ctx, PRO, PRO.payload, (s) => store(env).track(from.id, s));
}

async function onStats(ctx: Context, env: Env): Promise<void> {
  const from = ctx.from;
  if (!from) return;
  const lang = resolveLang(from.language_code);
  const u = await store(env).touchUser(from.id, from.username, displayName(from));
  const today = dayIndex(now(), u.tz_min);
  const rows = await store(env).minutesSince(u.id, today - 60);
  const todayMin = rows.find((r) => r.day === today)?.minutes ?? 0;
  const weekSet = new Set(weekDays(today));
  const weekMin = rows.filter((r) => weekSet.has(r.day)).reduce((s, r) => s + r.minutes, 0);
  const qualifying = new Set(rows.filter((r) => r.minutes >= STREAK_MINUTES).map((r) => r.day));
  const streak = computeStreak(qualifying, today);
  const best = await store(env).bestDayMinutes(u.id);
  await ctx.reply(t(lang, "statsText", { today: todayMin, week: weekMin, streak, best }));
}

/** Shared start-a-session logic for /focus and the "Again" button: validates length,
 * the daily cap, and that no session is already running in this chat. Returns the new
 * session's id, or null (having already replied) if it couldn't start. */
async function tryStartSession(ctx: Context, env: Env, kind: SessionKind, minutesArg: number | null, note: string): Promise<number | null> {
  const from = ctx.from, chat = ctx.chat;
  if (!from || !chat) return null;
  const lang = resolveLang(from.language_code);
  const u = await store(env).touchUser(from.id, from.username, displayName(from));
  await store(env).setLang(from.id, lang);
  const pro = u.pro === 1;
  const minutes = validateLength(minutesArg, pro);
  if (minutes === null) {
    await ctx.reply(t(lang, "invalidLength", { presets: FREE_PRESETS.join("/"), stars: PRO_STARS }), { reply_markup: proKb(ctx, lang) });
    return null;
  }
  const today = dayIndex(now(), u.tz_min);
  const count = await store(env).sessionsToday(from.id, today, u.tz_min);
  if (!underDailyCap(count, pro)) {
    await store(env).track(from.id, "pro_prompt");
    await ctx.reply(t(lang, "dailyCapReached", { cap: FREE_DAILY_CAP, stars: PRO_STARS }), { reply_markup: proKb(ctx, lang) });
    return null;
  }
  const active = await store(env).activeSession(chat.id);
  if (active) { await ctx.reply(t(lang, "alreadyActive")); return null; }
  const startedAt = now();
  const endsAt = endTime(startedAt, minutes);
  const id = await store(env).startSession({ user_id: from.id, chat_id: chat.id, kind, length_min: minutes, started_at: startedAt, ends_at: endsAt, note: pro ? note : "" });
  await store(env).track(from.id, "action");
  if (kind === "group") await store(env).joinSession(id, from.id, displayName(from));
  const noteNudge = !pro && note ? "\n\n" + t(lang, "notesProOnly") : "";
  const kb = new InlineKeyboard();
  if (kind === "group") kb.text(t(lang, "joinBtn"), `join:${id}`).row();
  kb.text(t(lang, "stopBtn"), `stop:${id}`);
  const text = t(lang, kind === "group" ? "groupStart" : "soloStart", { minutes, end: formatClock(endsAt, u.tz_min), btn: t(lang, "joinBtn") }) + noteNudge;
  const msg = await ctx.reply(text, { reply_markup: kb });
  if (kind === "group") await store(env).setMessageId(id, msg.message_id);
  return id;
}

async function onFocus(ctx: Context, env: Env): Promise<void> {
  const raw = String(ctx.match ?? "").trim();
  if (/^stats$/i.test(raw)) { await onStats(ctx, env); return; }
  const parsed = parseFocusArgs(raw);
  const kind: SessionKind = isPrivate(ctx) ? "solo" : "group";
  await tryStartSession(ctx, env, kind, parsed.minutes, parsed.note);
}

async function onAgain(ctx: Context, env: Env, minutes: number): Promise<void> {
  const from = ctx.from;
  if (!from) { await ctx.answerCallbackQuery(); return; }
  const id = await tryStartSession(ctx, env, "solo", minutes, "");
  await ctx.answerCallbackQuery();
  if (id) { try { await ctx.deleteMessage(); } catch { /* too old to delete */ } }
}

async function onBreak(ctx: Context, env: Env, priorLen: number): Promise<void> {
  const from = ctx.from, chat = ctx.chat;
  if (!from || !chat) { await ctx.answerCallbackQuery(); return; }
  const lang = resolveLang(from.language_code);
  const active = await store(env).activeSession(chat.id);
  if (active) { await ctx.answerCallbackQuery({ text: t(lang, "alreadyActive") }); return; }
  const startedAt = now();
  const endsAt = endTime(startedAt, BREAK_MINUTES);
  await store(env).startSession({ user_id: from.id, chat_id: chat.id, kind: "break", length_min: BREAK_MINUTES, prior_len: priorLen, started_at: startedAt, ends_at: endsAt });
  await ctx.answerCallbackQuery();
  try { await ctx.editMessageText(t(lang, "breakStart", { minutes: BREAK_MINUTES })); } catch { /* message unchanged */ }
}

async function onStop(ctx: Context, env: Env, id: number): Promise<void> {
  const lang = resolveLang(ctx.from?.language_code);
  const s = await store(env).getSession(id);
  if (!s || s.status !== "active") { await ctx.answerCallbackQuery({ text: t(lang, "nothingToStop") }); return; }
  if (!ctx.from || s.user_id !== ctx.from.id) { await ctx.answerCallbackQuery({ text: t(lang, "onlyInitiator") }); return; }
  await store(env).markStatus(id, "stopped");
  await ctx.answerCallbackQuery();
  try { await ctx.editMessageText(t(lang, "stoppedText")); } catch { /* message unchanged */ }
}

async function onJoin(ctx: Context, env: Env, id: number): Promise<void> {
  const from = ctx.from;
  const lang = resolveLang(from?.language_code);
  if (!from || !isRealSender(from.id, undefined)) { await ctx.answerCallbackQuery(); return; }
  const s = await store(env).getSession(id);
  if (!s || s.status !== "active" || s.kind !== "group") { await ctx.answerCallbackQuery(); return; }
  if (!joinAllowed(s.started_at, now())) { await ctx.answerCallbackQuery({ text: t(lang, "joinClosed", { btn: t(lang, "joinBtn") }), show_alert: true }); return; }
  await store(env).touchUser(from.id, from.username, displayName(from));
  await store(env).joinSession(id, from.id, displayName(from));
  await ctx.answerCallbackQuery({ text: t(lang, "joined") });
}

/** Guest Mode: someone @-mentioned FocusBot in a chat it was never added to. A focus
 * session is per-user and stateful, so every summon gets the localized pitch. */
async function onGuest(ctx: Context): Promise<GuestReply> {
  return guestPitch(resolveLang(ctx.from?.language_code), FREE_DAILY_CAP);
}

function buildBot(env: Env): Bot {
  const bot = new Bot(env.BOT_TOKEN);
  // Registered first, on the RAW bot, before the `m` composer below even exists: grammY's
  // .command() matches a channel_post as well as a message (ctx.message ?? ctx.channelPost),
  // and a composer branch installed by .filter() runs at the position where .filter() was
  // called — so placing this after `m` would let m's own message:text fallback (for a real
  // sender) or kit's unfiltered bot.command("pro") (for a channel post / anonymous admin,
  // which never reaches `m`'s isRealSender filter) intercept /pro first. Being first here
  // means this always wins, and kit's own bot.command("pro") (wired below) never runs.
  bot.command("pro", async (ctx) => {
    if (!isRealSender(ctx.from?.id, ctx.message?.via_bot, ctx.message?.sender_chat)) return;
    await onPro(ctx, env);
  });
  // Real-sender guard: only real messages (never channel posts), never the anonymous-admin
  // pseudo-user, never a message relayed via another bot's inline result.
  const m = bot.on("message").filter((ctx) => isRealSender(ctx.from?.id, ctx.message.via_bot, ctx.message.sender_chat));
  m.command("more", (ctx) => ctx.reply(MORE_TEXT));
  m.command("start", async (ctx) => {
    const from = ctx.from;
    await store(env).touchUser(from.id, from.username, displayName(from));
    await store(env).track(from.id, "start");
    const lang = resolveLang(from.language_code);
    await store(env).setLang(from.id, lang);
    const payload = String(ctx.match ?? "");
    if (payload === "pro") { await onPro(ctx, env); return; }
    if (isSourcePayload(payload)) await store(env).addSource(from.id, payload);
    const kb = new InlineKeyboard().text(t(lang, "btn_start25"), "start25").row().url(t(lang, "btn_shareBot"), shareUrl());
    await ctx.reply(t(lang, "start", { cap: FREE_DAILY_CAP }), { parse_mode: "Markdown", reply_markup: kb });
  });
  m.command("help", (ctx) => {
    const lang = resolveLang(ctx.from.language_code);
    return ctx.reply(t(lang, "help", { cap: FREE_DAILY_CAP, btn: t(lang, "joinBtn") }), { parse_mode: "Markdown" });
  });
  m.command("focus", (ctx) => onFocus(ctx, env));
  m.command("hour", async (ctx) => {
    const h = parseHour(String(ctx.match ?? ""));
    if (h === null) { await ctx.reply("Usage: /hour 9  (0-23, your local hour for the Sunday report)"); return; }
    await store(env).touchUser(ctx.from.id, ctx.from.username, displayName(ctx.from));
    await store(env).setReportHour(ctx.from.id, h);
    await ctx.reply(`⏰ Weekly report at ${String(h).padStart(2, "0")}:00 on Sundays.`);
  });
  m.command("tz", async (ctx) => {
    const tz = parseTz(String(ctx.match ?? ""));
    if (tz === null) { await ctx.reply("Usage: /tz +2  or  /tz -5:30"); return; }
    await store(env).touchUser(ctx.from.id, ctx.from.username, displayName(ctx.from));
    await store(env).setTz(ctx.from.id, tz);
    await ctx.reply("🕒 Timezone saved.");
  });
  bot.callbackQuery("pro", async (ctx) => { await ctx.answerCallbackQuery(); await onPro(ctx, env); });
  // First-screen primary action: same effect as typing `/focus 25`.
  bot.callbackQuery("start25", async (ctx) => {
    await ctx.answerCallbackQuery();
    const kind: SessionKind = isPrivate(ctx) ? "solo" : "group";
    await tryStartSession(ctx, env, kind, 25, "");
  });
  // Plain private text that reads as a bare number IS the bot's primary input: offer a
  // one-tap confirm instead of dumping /help (ACTIVATION-SPEC.md §1e). The length rides in
  // callback_data (a small bounded integer) — no pending-table write is needed for this bot.
  bot.callbackQuery(/^focusgo:yes:(\d+)$/, async (ctx) => {
    await ack(ctx);
    await tryStartSession(ctx, env, "solo", Number(ctx.match[1]), "");
  });
  bot.callbackQuery("focusgo:no", async (ctx) => {
    await ack(ctx);
    await ctx.reply(t(resolveLang(ctx.from.language_code), "sessionCancelled"));
  });
  bot.callbackQuery(/^join:(\d+)$/, (ctx) => onJoin(ctx, env, Number(ctx.match[1])));
  bot.callbackQuery(/^stop:(\d+)$/, (ctx) => onStop(ctx, env, Number(ctx.match[1])));
  bot.callbackQuery(/^again:(\d+)$/, (ctx) => onAgain(ctx, env, Number(ctx.match[1])));
  bot.callbackQuery(/^break:(\d+)$/, (ctx) => onBreak(ctx, env, Number(ctx.match[1])));
  // wirePro's own bot.command("pro") is shadowed by the one registered at the top of this
  // function (see the comment there) — it's kept here only for its pre_checkout_query and
  // message:successful_payment handlers.
  wirePro(bot, PRO, async (ctx, _payload, charge) => {
    await store(env).setPro(ctx.from!.id, charge);
    const lang = resolveLang(ctx.from?.language_code);
    if (lang !== "en") await ctx.reply(t(lang, "proThanks"));
  }, (uid, s) => store(env).track(uid, s));
  m.on("message:text", async (ctx) => {
    if (!isPrivate(ctx)) return;
    const lang = resolveLang(ctx.from.language_code);
    // A bare number ("25") is focus's primary input typed without knowing /focus's syntax —
    // offer a one-tap confirm rather than dumping /help (ACTIVATION-SPEC.md §1e). Only
    // genuinely unreadable text (no leading number at all) still falls back to /help.
    const parsed = parseFocusArgs(ctx.message.text);
    if (parsed.minutes !== null) {
      const u = await store(env).touchUser(ctx.from.id, ctx.from.username, displayName(ctx.from));
      const minutes = validateLength(parsed.minutes, u.pro === 1);
      if (minutes === null) {
        await ctx.reply(t(lang, "invalidLength", { presets: FREE_PRESETS.join("/"), stars: PRO_STARS }), { reply_markup: proKb(ctx, lang) });
        return;
      }
      const kb = new InlineKeyboard().text(t(lang, "btn_yes"), `focusgo:yes:${minutes}`).text(t(lang, "btn_no"), "focusgo:no");
      await ctx.reply(t(lang, "confirmStartFocus", { minutes }), { reply_markup: kb });
      return;
    }
    await ctx.reply(t(lang, "help", { cap: FREE_DAILY_CAP, btn: t(lang, "joinBtn") }), { parse_mode: "Markdown" });
  });
  wireGuest(bot, {
    botUsername: BOT,
    reply: (ctx) => onGuest(ctx),
    // `guest` is NOT written to `sources` here (REVIEW-GUEST F3): a summoner is not an
    // installer. src_guest is earned later, through the ?start=guest deep link in the
    // buttons below. recordGuest self-limits; `flood` downgrades us to the cheap pitch.
    record: async (uid, chatType, chatId) => {
      const r = await store(env).recordGuest(uid, chatType, chatId);
      if (r.recorded) await store(env).track(uid, "guest");
      return !r.flood;
    },
  });
  // Classic inline mode: the SAME reply builder, answered as an inline result. A user types
  // "@Bot query" in any chat on any client and posts the card with `via @Bot` attribution —
  // no admin, no membership, no Guest Chat Mode toggle. The destination chat is unknown, so
  // the card carries private-style buttons only. Counted under `inline_queries`; `sources` is
  // never written here (an inline user is not an installer, same rule as the guest path).
  wireInline(bot, {
    botUsername: BOT,
    reply: (ctx) => onGuest(ctx),
    record: async (uid) => !(await store(env).recordInline(uid)).flood,
    chosen: (uid) => store(env).recordInlineChosen(uid),
  });
  return bot;
}

/** Fires from the minute cron: completes every session past its end time, credits
 * focus minutes (solo + each joined group member), and sends the matching message. */
async function deliverDue(env: Env): Promise<number> {
  const bot = new Bot(env.BOT_TOKEN);
  const due = await store(env).dueSessions(now());
  let n = 0;
  for (const s of due) {
    await store(env).markStatus(s.id, "done");
    try {
      if (s.kind === "solo") {
        const owner = await store(env).getUser(s.user_id);
        await store(env).addMinutes(s.user_id, dayIndex(s.ends_at, owner?.tz_min ?? 0), s.length_min);
        const lang = await store(env).getLang(s.user_id);
        const kb = new InlineKeyboard().text(t(lang, "btn_break", { minutes: BREAK_MINUTES }), `break:${s.length_min}`).text(t(lang, "btn_again"), `again:${s.length_min}`);
        await bot.api.sendMessage(s.chat_id, t(lang, "doneSolo", { minutes: s.length_min, brk: BREAK_MINUTES }), { reply_markup: kb });
      } else if (s.kind === "group") {
        const members = await store(env).groupMembers(s.id);
        for (const mem of members.slice(0, 200)) {
          const owner = await store(env).getUser(mem.user_id);
          await store(env).addMinutes(mem.user_id, dayIndex(s.ends_at, owner?.tz_min ?? 0), s.length_min);
        }
        const handles = members.map((mm) => mm.handle).join(" ");
        await bot.api.sendMessage(s.chat_id, t("en", "sessionDoneGroup", { handles, minutes: s.length_min }));
      } else {
        const lang = await store(env).getLang(s.user_id);
        const kb = new InlineKeyboard().text(t(lang, "btn_again"), `again:${s.prior_len ?? s.length_min}`);
        await bot.api.sendMessage(s.chat_id, t(lang, "breakOver"), { reply_markup: kb });
      }
      n += 1;
    } catch (e) { console.log("deliver failed", s.id, String(e).slice(0, 120)); }
  }
  return n;
}

/** Sunday, Pro-only weekly focus report — same hourly-cron-check pattern as habit's recap. */
async function weeklyReport(env: Env): Promise<number> {
  const bot = new Bot(env.BOT_TOKEN);
  const due = await store(env).dueReports(now());
  let sent = 0;
  for (const r of due.slice(0, 500)) {
    const today = dayIndex(now(), r.tz_min);
    const rows = await store(env).minutesSince(r.id, today - 60);
    const weekSet = new Set(weekDays(today));
    const weekMin = rows.filter((row) => weekSet.has(row.day)).reduce((s, row) => s + row.minutes, 0);
    const sessions = rows.filter((row) => weekSet.has(row.day) && row.minutes > 0).length;
    const qualifying = new Set(rows.filter((row) => row.minutes >= STREAK_MINUTES).map((row) => row.day));
    const streak = computeStreak(qualifying, today);
    const best = bestDayMinutes(rows);
    const text = `${t(r.lang, "weeklyReportTitle")}\n\n${t(r.lang, "weeklyReportBody", { week: weekMin, sessions, streak, best })}`;
    try { await bot.api.sendMessage(r.id, text); await store(env).logReport(r.id); sent += 1; } catch (e) { console.log("report failed", r.id, String(e).slice(0, 100)); }
    await store(env).markReported(r.id, today);
  }
  return sent;
}

interface ApiBody { initData?: string; minutes?: number; }

/** The response shape every /api/* route below returns, from an already-resolved user. */
async function focusState(env: Env, userId: number, tzMin: number, pro: boolean): Promise<Record<string, unknown>> {
  const active = await store(env).activeSession(userId);
  const today = dayIndex(now(), tzMin);
  const rows = await store(env).minutesSince(userId, today);
  const todayMinutes = rows.find((r) => r.day === today)?.minutes ?? 0;
  return {
    active: active && active.kind !== "break" ? { minutes: active.length_min, endsAt: active.ends_at } : null,
    todayMinutes, pro, presets: FREE_PRESETS, proStars: PRO_STARS,
  };
}

async function api(req: Request, env: Env, path: string): Promise<Response> {
  const body = (await req.json().catch(() => ({}))) as ApiBody;
  const user = await validateInitData(body.initData ?? "", [env.BOT_TOKEN, env.HUB_BOT_TOKEN].filter((t): t is string => !!t));
  if (!user) return Response.json(initDataFailure(body.initData ?? "", publicLink()), { status: 401 });
  if (!isExcludedAppUser(user.id, Number(env.OWNER_ID) || 0)) {
    await store(env).track(user.id, "app_open");
    const startParam = initDataStartParam(body.initData ?? "");
    if (isSourcePayload(startParam)) await store(env).addSource(user.id, startParam);
  }
  const u = await store(env).touchUser(user.id, user.username, user.username ? "@" + user.username : user.first_name);
  const pro = u.pro === 1;
  if (path === "/api/stop") {
    const active = await store(env).activeSession(user.id);
    if (active && active.user_id === user.id) await store(env).markStatus(active.id, "stopped");
  }
  return Response.json(await focusState(env, u.id, u.tz_min, pro));
}

/** POST /api/start: the Mini App's own "start a session" write — same length/cap validation
 * and the same `action` funnel step as /focus and start25 (ACTIVATION-SPEC.md §1b/§1c),
 * routed through handleAction so a QA fixture id gets 200 + {qa:true} and never reaches this
 * write (§2.6), unlike the old generic /api/ handler above which never checked isQaId. */
async function apiStart(req: Request, env: Env): Promise<Response> {
  const body = (await req.json().catch(() => ({}))) as ApiBody;
  return handleAction(body, {
    tokens: [env.BOT_TOKEN, env.HUB_BOT_TOKEN].filter((t): t is string => !!t),
    botLink: publicLink(),
    run: async (user) => {
      if (!isExcludedAppUser(user.id, Number(env.OWNER_ID) || 0)) {
        await store(env).track(user.id, "app_open");
        const startParam = initDataStartParam(body.initData ?? "");
        if (isSourcePayload(startParam)) await store(env).addSource(user.id, startParam);
      }
      const u = await store(env).touchUser(user.id, user.username, user.username ? "@" + user.username : user.first_name);
      const pro = u.pro === 1;
      const minutes = Number.isInteger(body.minutes) ? validateLength(Number(body.minutes), pro) : null;
      if (minutes !== null) {
        const active = await store(env).activeSession(user.id);
        if (!active) {
          const today = dayIndex(now(), u.tz_min);
          const count = await store(env).sessionsToday(user.id, today, u.tz_min);
          if (underDailyCap(count, pro)) {
            const startedAt = now();
            await store(env).startSession({ user_id: user.id, chat_id: user.id, kind: "solo", length_min: minutes, started_at: startedAt, ends_at: endTime(startedAt, minutes) });
            await store(env).track(user.id, "action");
          }
        }
      }
      return focusState(env, u.id, u.tz_min, pro);
    },
  });
}

/** POST /api/share: registers a Bot API "prepared" inline message (savePreparedInlineMessage)
 * so the Mini App can hand its id to tg.shareMessage(id) for a native chat/group/channel share. */
async function apiShare(req: Request, env: Env): Promise<Response> {
  const body = (await req.json().catch(() => ({}))) as { initData?: string };
  const user = await validateInitData(body.initData ?? "", [env.BOT_TOKEN, env.HUB_BOT_TOKEN].filter((t): t is string => !!t));
  if (!user) return Response.json(initDataFailure(body.initData ?? "", publicLink()), { status: 401 });
  try {
    const share = await preparedShare(env, user.id, buildShareText(SHARE_TEXT, BOT, "shared"), `https://t.me/${BOT}`);
    await store(env).recordShare(user.id, "chat");
    return Response.json(share);
  } catch { return Response.json({ error: "Share unavailable." }, { status: 502 }); }
}

/** POST /api/share-story: records a "share to story" click. Telegram gives no server
 * callback for tg.shareToStory, so the client fires this right before calling it. */
async function apiShareStory(req: Request, env: Env): Promise<Response> {
  const body = (await req.json().catch(() => ({}))) as { initData?: string };
  const user = await validateInitData(body.initData ?? "", [env.BOT_TOKEN, env.HUB_BOT_TOKEN].filter((t): t is string => !!t));
  if (!user) return Response.json(initDataFailure(body.initData ?? "", publicLink()), { status: 401 });
  await store(env).recordShare(user.id, "story");
  return Response.json({ ok: true });
}

/** POST /api/pro-link: the Mini App's own Stars checkout (tg.openInvoice). Same invoice
 * as the chat flow, so successful_payment and setPro are unchanged. No monthly plan for
 * this bot -- allowMonthly:false makes normalizePlan degrade "monthly" to "onetime". */
async function apiProLink(req: Request, env: Env): Promise<Response> {
  const body = (await req.json().catch(() => ({}))) as ProLinkBody;
  return handleProLink(body, {
    tokens: [env.BOT_TOKEN, env.HUB_BOT_TOKEN].filter((t): t is string => !!t),
    botLink: publicLink(),
    allowMonthly: false,
    mint: (plan) => proLink(new Bot(env.BOT_TOKEN).api, plan),
    track: (userId) => store(env).track(userId, "invoice"),
  });
}

const botFetch = makeFetch<Env>(buildBot, (env) => store(env).stats());

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const path = new URL(req.url).pathname;
    if (path === "/app") return new Response(APP_HTML, { headers: { "content-type": "text/html; charset=utf-8" } });
    if (path === "/api/share" && req.method === "POST") return apiShare(req, env);
    if (path === "/api/share-story" && req.method === "POST") return apiShareStory(req, env);
    if (path === "/api/pro-link" && req.method === "POST") return apiProLink(req, env);
    if (path === "/api/start" && req.method === "POST") return apiStart(req, env);
    if (path.startsWith("/api/") && req.method === "POST") return api(req, env, path);
    return botFetch(req, env);
  },
  async scheduled(_ev: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> { ctx.waitUntil(Promise.all([deliverDue(env), weeklyReport(env)])); },
};
