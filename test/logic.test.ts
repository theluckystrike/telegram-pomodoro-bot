import { test } from "node:test";
import assert from "node:assert/strict";
import {
  BREAK_MINUTES, FREE_DAILY_CAP, FREE_PRESETS, GROUP_ANON_ID, JOIN_WINDOW_SEC, SOURCE_RE, bestDayMinutes,
  computeStreak, dayIndex, endTime, formatClock, isRealSender, isSourcePayload, joinAllowed, parseFocusArgs,
  parseHour, parseTz, selectDueSessions, underDailyCap, validateLength, weekDays,
} from "../src/logic.ts";

test("length validation: free plan only allows the fixed presets", () => {
  for (const p of FREE_PRESETS) assert.equal(validateLength(p, false), p);
  assert.equal(validateLength(20, false), null); // not a preset
  assert.equal(validateLength(0, false), null);
  assert.equal(validateLength(null, false), 25); // default
});

test("length validation: pro plan allows any 1-180 whole minute", () => {
  assert.equal(validateLength(1, true), 1);
  assert.equal(validateLength(180, true), 180);
  assert.equal(validateLength(90, true), 90);
  assert.equal(validateLength(181, true), null); // over cap
  assert.equal(validateLength(0, true), null); // under 1
  assert.equal(validateLength(12.5, true), null); // not integer
  assert.equal(validateLength(null, true), 25); // default applies to pro too
});

test("end-time computation", () => {
  const start = 1_000_000;
  assert.equal(endTime(start, 25), start + 25 * 60);
  assert.equal(endTime(start, 1), start + 60);
  // formatClock renders a UTC+2 end time correctly, wrapping past midnight.
  const midnightEve = Date.UTC(2026, 0, 1, 23, 50, 0) / 1000; // 23:50 UTC
  assert.equal(formatClock(midnightEve, 0), "23:50");
  assert.equal(formatClock(midnightEve, 20), "00:10"); // +20 min offset wraps to next day
});

test("due-session selection: only active + past end time, oldest first, bounded", () => {
  const now = 1_000_000;
  const sessions = [
    { id: 1, status: "active", ends_at: now - 10 },
    { id: 2, status: "done", ends_at: now - 20 }, // already completed, excluded
    { id: 3, status: "active", ends_at: now + 100 }, // not due yet
    { id: 4, status: "active", ends_at: now - 50 },
  ];
  const due = selectDueSessions(sessions, now);
  assert.deepEqual(due.map((s) => s.id), [4, 1]); // oldest ends_at first
  assert.equal(selectDueSessions(sessions, now, 1).length, 1); // limit respected
});

test("streak logic with tz: consecutive qualifying days, in-progress today doesn't break it", () => {
  const tzMin = -300; // UTC-5
  const today = dayIndex(1_700_000_000, tzMin);
  const qualifying = new Set([today, today - 1, today - 2]);
  assert.equal(computeStreak(qualifying, today), 3);
  // today not yet qualifying (session still running): streak counts from yesterday.
  const qualifyingSoFar = new Set([today - 1, today - 2, today - 3]);
  assert.equal(computeStreak(qualifyingSoFar, today), 3);
  // a gap breaks the streak.
  const withGap = new Set([today, today - 2]);
  assert.equal(computeStreak(withGap, today), 1);
  assert.equal(computeStreak(new Set(), today), 0);
  assert.equal(bestDayMinutes([{ day: today, minutes: 30 }, { day: today - 1, minutes: 55 }]), 55);
  assert.deepEqual(weekDays(today).length, 7);
});

test("group join window: allowed inside 2 minutes, closed after", () => {
  const startedAt = 1_000_000;
  assert.equal(joinAllowed(startedAt, startedAt), true);
  assert.equal(joinAllowed(startedAt, startedAt + JOIN_WINDOW_SEC), true); // exactly at the edge
  assert.equal(joinAllowed(startedAt, startedAt + JOIN_WINDOW_SEC + 1), false);
  assert.equal(joinAllowed(startedAt, startedAt - 1), false); // before start (clock skew) rejected
});

test("daily cap: free plan capped, pro unlimited", () => {
  assert.equal(underDailyCap(0, false), true);
  assert.equal(underDailyCap(FREE_DAILY_CAP - 1, false), true);
  assert.equal(underDailyCap(FREE_DAILY_CAP, false), false);
  assert.equal(underDailyCap(9999, true), true);
});

test("deep-link /start payloads: parseFocusArgs separates length from a Pro note", () => {
  assert.deepEqual(parseFocusArgs("25 write the report"), { minutes: 25, note: "write the report" });
  assert.deepEqual(parseFocusArgs(""), { minutes: null, note: "" });
  assert.deepEqual(parseFocusArgs("50"), { minutes: 50, note: "" });
  assert.deepEqual(parseFocusArgs("write the report"), { minutes: null, note: "write the report" });
});

test("source regex: /start deep-link attribution payloads", () => {
  assert.equal(isSourcePayload("site"), true);
  assert.equal(isSourcePayload("x"), false); // too short
  assert.equal(isSourcePayload("pro"), true); // syntactically valid; caller special-cases "pro" before attribution
  assert.equal(isSourcePayload("Has_Caps"), false);
  assert.equal(isSourcePayload("a".repeat(13)), false); // too long
  assert.equal(SOURCE_RE.test("ab"), true);
});

test("real-sender guard rejects anonymous admin, via_bot, channel posts and pseudo-senders", () => {
  assert.equal(isRealSender(42, undefined), true);
  assert.equal(isRealSender(GROUP_ANON_ID, undefined), false);
  assert.equal(isRealSender(42, true), false);
  assert.equal(isRealSender(undefined, undefined), false);
  assert.equal(isRealSender(777000, undefined), false);
  assert.equal(isRealSender(42, undefined, { id: -100, type: "channel" }), false);
});

test("parseHour and parseTz", () => {
  assert.equal(parseHour("9"), 9);
  assert.equal(parseHour("9pm"), 21);
  assert.equal(parseHour("24"), null);
  assert.equal(parseTz("+2"), 120);
  assert.equal(parseTz("-5:30"), -330);
  assert.equal(parseTz("+15"), null); // out of range
});

test("break duration constant used by the break-end 'Again' flow", () => {
  assert.equal(BREAK_MINUTES, 5);
});
