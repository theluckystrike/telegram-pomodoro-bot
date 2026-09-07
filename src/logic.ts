/** Pure, dependency-free logic for FocusBot: length validation, timing, streaks,
 * group-join windows, daily caps, and the small parsers/guards every other bot in
 * this fleet shares a copy of. Nothing here touches the network or storage. */
import { t } from "./i18n.ts";
import type { Lang } from "./i18n.ts";
import type { GuestReply } from "./guest.ts";

const DAY = 86_400;

/** Local calendar-day index for a UTC timestamp and a tz offset in minutes. */
export const dayIndex = (sec: number, tzMin: number): number => Math.floor((sec + tzMin * 60) / DAY);

/** The trailing 7 local day-indices ending at (and including) `todayIdx`, oldest first. */
export function weekDays(todayIdx: number): number[] {
  const days: number[] = [];
  for (let i = 6; i >= 0; i--) days.push(todayIdx - i);
  return days;
}

/** Epoch day 0 (1970-01-01) was a Thursday, so a local day index lands on Sunday
 * when it's 3 mod 7. Used to gate the weekly report inside the hourly cron. */
export const isSunday = (dayIdx: number): boolean => ((dayIdx % 7) + 7) % 7 === 3;

export const FREE_PRESETS = [15, 25, 50] as const;
export const DEFAULT_MINUTES = 25;
export const FREE_DAILY_CAP = 5;
export const STREAK_MINUTES = 25;
export const BREAK_MINUTES = 5;
export const JOIN_WINDOW_SEC = 120;

export interface ParsedFocusArgs { minutes: number | null; note: string; }

/** "25 write the report" -> {minutes:25, note:"write the report"}; "" -> default
 * (minutes:null); "write the report" (no leading number) -> the whole thing is
 * read as a note with no explicit length. */
export function parseFocusArgs(raw: string): ParsedFocusArgs {
  const trimmed = raw.trim();
  if (!trimmed) return { minutes: null, note: "" };
  const m = trimmed.match(/^(\d{1,3})(?:\s+(.*))?$/s);
  if (!m) return { minutes: null, note: trimmed.slice(0, 200) };
  return { minutes: Number(m[1]), note: (m[2] ?? "").trim().slice(0, 200) };
}

/** Free: only the fixed presets (or the default when nothing was given). Pro: any
 * whole minute from 1 to 180, plus the same default when nothing was given. Returns
 * null for anything invalid. */
export function validateLength(minutesArg: number | null, pro: boolean): number | null {
  if (minutesArg === null) return DEFAULT_MINUTES;
  if (!Number.isInteger(minutesArg)) return null;
  if (pro) return minutesArg >= 1 && minutesArg <= 180 ? minutesArg : null;
  return (FREE_PRESETS as readonly number[]).includes(minutesArg) ? minutesArg : null;
}

/** Unix end time for a session that starts at `startSec` and runs `minutes`. */
export const endTime = (startSec: number, minutes: number): number => startSec + minutes * 60;

/** "HH:MM" in the given tz offset, for the session's end-time line. */
export function formatClock(sec: number, tzMin: number): string {
  const local = ((sec + tzMin * 60) % DAY + DAY) % DAY;
  const h = Math.floor(local / 3600);
  const mi = Math.floor((local % 3600) / 60);
  return `${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}`;
}

export interface DueCandidate { id: number; status: string; ends_at: number; }

/** Sessions the cron should fire this tick: active and past their end time, oldest
 * first, capped at `limit` per run so one tick can never process an unbounded list. */
export function selectDueSessions<T extends DueCandidate>(sessions: T[], nowSec: number, limit = 200): T[] {
  return sessions
    .filter((s) => s.status === "active" && s.ends_at <= nowSec)
    .sort((a, b) => a.ends_at - b.ends_at)
    .slice(0, limit);
}

/** True while the "Join" button on a shared group session is still live. */
export const joinAllowed = (startedAt: number, nowSec: number, windowSec = JOIN_WINDOW_SEC): boolean =>
  nowSec >= startedAt && nowSec - startedAt <= windowSec;

/** True if a user (given today's session count) may start one more session. */
export const underDailyCap = (countToday: number, pro: boolean, freeCap = FREE_DAILY_CAP): boolean =>
  pro || countToday < freeCap;

/** Consecutive-day streak of local days with >= STREAK_MINUTES focus minutes,
 * counted back from today. Today not yet qualifying doesn't break a streak that's
 * still in progress — the count then starts from yesterday instead. */
export function computeStreak(qualifyingDays: Set<number>, todayIdx: number): number {
  let day = qualifyingDays.has(todayIdx) ? todayIdx : todayIdx - 1;
  let n = 0;
  while (qualifyingDays.has(day)) { n += 1; day -= 1; }
  return n;
}

/** Highest single-day minute total among `rows`, or 0 if empty. */
export function bestDayMinutes(rows: { day: number; minutes: number }[]): number {
  return rows.reduce((m, r) => Math.max(m, r.minutes), 0);
}

/** Telegram's pseudo-user id for "sent by a group's anonymous admin". */
export const GROUP_ANON_ID = 1087968824;
/** Other pseudo-senders: @Channel_Bot (posts on behalf of a linked channel) and
 * 777000 (Telegram's own service notifications). */
export const PSEUDO_SENDER_IDS = new Set([GROUP_ANON_ID, 136817688, 777000]);

/** True for a message worth treating as a real person: not a pseudo-user, not
 * posted on behalf of a channel, and not relayed via another bot's inline result. */
export function isRealSender(fromId: number | undefined, viaBot: unknown, senderChat?: unknown): boolean {
  return fromId !== undefined && !PSEUDO_SENDER_IDS.has(fromId) && !viaBot && !senderChat;
}

/** Deep-link `/start` payloads we attribute as an acquisition source, e.g. "site", "x". */
export const SOURCE_RE = /^[a-z]{2,12}$/;
export const isSourcePayload = (payload: string): boolean => SOURCE_RE.test(payload);

export function parseHour(s: string): number | null {
  const m = s.trim().match(/^(\d{1,2})(?::00)?\s*(am|pm)?$/i);
  if (!m) return null;
  let h = Number(m[1]);
  const ap = (m[2] ?? "").toLowerCase();
  if (ap === "pm" && h < 12) h += 12;
  if (ap === "am" && h === 12) h = 0;
  return h > 23 ? null : h;
}

export function parseTz(s: string): number | null {
  const m = s.trim().match(/^(?:utc)?\s*([+-])?(\d{1,2})(?::?(\d{2}))?$/i);
  if (!m) return null;
  const h = Number(m[2]), mi = Number(m[3] ?? "0");
  if (h > 14 || mi > 59) return null;
  return (m[1] === "-" ? -1 : 1) * (h * 60 + mi);
}

/** Guest Mode pitch: a focus session is per-user and stateful (a live timer, a streak),
 * so nothing useful fits in a one-shot guest reply. Every summon gets the localized
 * /start pitch, Markdown stripped (guest text carries no parse_mode). Pure — no ctx, no
 * store — so it is unit-testable under plain node. */
export function guestPitch(lang: Lang, dailyCap: number): GuestReply {
  const plain = t(lang, "start", { cap: dailyCap }).replaceAll("*", "").replaceAll("`", "");
  return { title: "🍅 FocusBot — focus timers with streaks", description: "Open the bot to start a session", text: plain };
}
