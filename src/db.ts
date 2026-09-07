import { BaseStore, FleetStats, now } from "./kit.ts";
import { isSunday, selectDueSessions } from "./logic.ts";

const QA_CHAT = -1001234567890;

export type SessionKind = "solo" | "group" | "break";
export type SessionStatus = "active" | "done" | "stopped";

export interface Session {
  id: number; user_id: number; chat_id: number; kind: SessionKind; length_min: number;
  prior_len: number | null; started_at: number; ends_at: number; status: SessionStatus;
  note: string; message_id: number | null;
}
export interface GroupMember { user_id: number; handle: string; }
export interface ReportSub { id: number; report_hour: number; tz_min: number; pro: number; lang: string; last_report_week: number; }

const SCHEMA = `
CREATE TABLE IF NOT EXISTS sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, chat_id INTEGER NOT NULL,
  kind TEXT NOT NULL, length_min INTEGER NOT NULL, prior_len INTEGER, started_at INTEGER NOT NULL, ends_at INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', note TEXT NOT NULL DEFAULT '', message_id INTEGER, created INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS sessions_due ON sessions(status, ends_at);
CREATE INDEX IF NOT EXISTS sessions_chat ON sessions(chat_id, status);
CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id, created);
CREATE TABLE IF NOT EXISTS group_members (session_id INTEGER NOT NULL, user_id INTEGER NOT NULL, handle TEXT NOT NULL, PRIMARY KEY (session_id, user_id));
CREATE TABLE IF NOT EXISTS daily_minutes (user_id INTEGER NOT NULL, day INTEGER NOT NULL, minutes INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (user_id, day));
CREATE TABLE IF NOT EXISTS prefs (user_id INTEGER PRIMARY KEY, report_hour INTEGER NOT NULL DEFAULT 9, last_report_week INTEGER NOT NULL DEFAULT 0, lang TEXT NOT NULL DEFAULT 'en');
CREATE TABLE IF NOT EXISTS reports (user_id INTEGER NOT NULL, ts INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS sources (user_id INTEGER PRIMARY KEY, src TEXT NOT NULL, ts INTEGER NOT NULL);`;

const SESSION_COLS = "id, user_id, chat_id, kind, length_min, prior_len, started_at, ends_at, status, note, message_id";

export class Store extends BaseStore {
  /** Extends BaseStore.forgetUser with this bot's own per-user tables: `sources`, `sessions`
   * (the user's own focus sessions), `group_members`, `daily_minutes`, `prefs`, `reports`. */
  forgetUser(id: number): number {
    return super.forgetUser(id) + this.forgetTables(id, [
      ["sources", "user_id"], ["sessions", "user_id"], ["group_members", "user_id"],
      ["daily_minutes", "user_id"], ["prefs", "user_id"], ["reports", "user_id"],
    ]);
  }

  constructor(ctx: DurableObjectState, env: Record<string, unknown>) {
    super(ctx, env, SCHEMA);
  }

  async startSession(s: { user_id: number; chat_id: number; kind: SessionKind; length_min: number; prior_len?: number | null; started_at: number; ends_at: number; note?: string }): Promise<number> {
    this.run(
      `INSERT INTO sessions (user_id, chat_id, kind, length_min, prior_len, started_at, ends_at, note, created)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`,
      s.user_id, s.chat_id, s.kind, s.length_min, s.prior_len ?? null, s.started_at, s.ends_at, s.note ?? "", now(),
    );
    return this.lastId();
  }
  async setMessageId(id: number, messageId: number): Promise<void> { this.run("UPDATE sessions SET message_id = ?2 WHERE id = ?1", id, messageId); }
  async getSession(id: number): Promise<Session | null> { return this.one<Session>(`SELECT ${SESSION_COLS} FROM sessions WHERE id = ?1`, id); }
  /** Any active session in this chat, regardless of kind — used to block starting a
   * second overlapping timer (solo, group, or break) in the same chat. */
  async activeSession(chatId: number): Promise<Session | null> {
    return this.one<Session>(`SELECT ${SESSION_COLS} FROM sessions WHERE chat_id = ?1 AND status = 'active' LIMIT 1`, chatId);
  }
  async markStatus(id: number, status: SessionStatus): Promise<void> { this.run("UPDATE sessions SET status = ?2 WHERE id = ?1", id, status); }
  async joinSession(id: number, userId: number, handle: string): Promise<void> {
    this.run("INSERT OR IGNORE INTO group_members (session_id, user_id, handle) VALUES (?1, ?2, ?3)", id, userId, handle);
  }
  async groupMembers(id: number): Promise<GroupMember[]> {
    return this.all<GroupMember>("SELECT user_id, handle FROM group_members WHERE session_id = ?1 ORDER BY user_id LIMIT 200", id);
  }
  /** Sessions still marked active whose end time has passed, capped per cron tick. */
  async dueSessions(nowSec: number, limit = 200): Promise<Session[]> {
    const candidates = this.all<Session>(`SELECT ${SESSION_COLS} FROM sessions WHERE status = 'active' AND ends_at <= ?1 ORDER BY ends_at LIMIT ?2`, nowSec, limit * 2);
    return selectDueSessions(candidates, nowSec, limit);
  }
  async sessionsToday(userId: number, dayIdx: number, tzMin: number): Promise<number> {
    const r = this.one<{ n: number }>(
      "SELECT COUNT(*) AS n FROM sessions WHERE user_id = ?1 AND kind != 'break' AND CAST((started_at + ?2 * 60) / 86400 AS INTEGER) = ?3",
      userId, tzMin, dayIdx);
    return r?.n ?? 0;
  }
  async addMinutes(userId: number, dayIdx: number, minutes: number): Promise<void> {
    this.run(`INSERT INTO daily_minutes (user_id, day, minutes) VALUES (?1, ?2, ?3)
              ON CONFLICT(user_id, day) DO UPDATE SET minutes = minutes + ?3`, userId, dayIdx, minutes);
  }
  async minutesSince(userId: number, sinceDay: number): Promise<{ day: number; minutes: number }[]> {
    return this.all<{ day: number; minutes: number }>("SELECT day, minutes FROM daily_minutes WHERE user_id = ?1 AND day >= ?2 ORDER BY day LIMIT 400", userId, sinceDay);
  }
  async bestDayMinutes(userId: number): Promise<number> {
    const r = this.one<{ m: number | null }>("SELECT MAX(minutes) AS m FROM daily_minutes WHERE user_id = ?1", userId);
    return r?.m ?? 0;
  }
  async getLang(userId: number): Promise<string> {
    const r = this.one<{ lang: string }>("SELECT lang FROM prefs WHERE user_id = ?1", userId);
    return r?.lang ?? "en";
  }
  async setReportHour(userId: number, hour: number): Promise<void> {
    this.run("INSERT INTO prefs (user_id, report_hour) VALUES (?1, ?2) ON CONFLICT(user_id) DO UPDATE SET report_hour = ?2", userId, hour);
  }
  /** Persists the user's Telegram UI language so the cron report (no live ctx) can use it. */
  async setLang(userId: number, lang: string): Promise<void> {
    this.run("INSERT INTO prefs (user_id, lang) VALUES (?1, ?2) ON CONFLICT(user_id) DO UPDATE SET lang = ?2", userId, lang);
  }
  /** Pro users whose local hour matches their report_hour, whose local day is Sunday,
   * and who haven't already gotten this Sunday's report. */
  async dueReports(nowSec: number): Promise<ReportSub[]> {
    const rows = this.all<ReportSub>(
      `SELECT u.id, p.report_hour, u.tz_min, u.pro, p.lang, p.last_report_week FROM users u JOIN prefs p ON p.user_id = u.id
       WHERE u.pro = 1 LIMIT 5000`);
    const DAY = 86_400;
    return rows.filter((r) => {
      const local = nowSec + r.tz_min * 60;
      const day = Math.floor(local / DAY);
      return Math.floor((local % DAY) / 3600) === r.report_hour && isSunday(day) && day !== r.last_report_week;
    });
  }
  async markReported(userId: number, day: number): Promise<void> { this.run("UPDATE prefs SET last_report_week = ?2 WHERE user_id = ?1", userId, day); }
  async logReport(userId: number): Promise<void> { this.run("INSERT INTO reports (user_id, ts) VALUES (?1, ?2)", userId, now()); }
  /** First-touch attribution for a deep-link source payload (e.g. ?start=site). */
  async addSource(userId: number, src: string): Promise<void> {
    this.run("INSERT OR IGNORE INTO sources (user_id, src, ts) VALUES (?1, ?2, ?3)", userId, src, now());
  }
  async stats(): Promise<FleetStats> {
    const c = this.one<{ n: number }>(
      `SELECT COUNT(*) AS n FROM sessions WHERE status = 'done' AND kind != 'break' AND chat_id != ?1 AND ${this.notTestUser("user_id")}`, QA_CHAT);
    const gm = this.one<{ n: number }>(
      `SELECT COUNT(DISTINCT chat_id) AS n FROM sessions WHERE kind = 'group' AND chat_id != ?1 AND ${this.notTestUser("user_id")}`, QA_CHAT);
    const gs = this.one<{ n: number }>(
      `SELECT COUNT(*) AS n FROM sessions WHERE kind = 'group' AND status = 'done' AND chat_id != ?1 AND ${this.notTestUser("user_id")}`, QA_CHAT);
    const mins = this.one<{ m: number | null }>(`SELECT SUM(minutes) AS m FROM daily_minutes WHERE ${this.notTestUser("user_id")}`);
    const sr = this.all<{ src: string; n: number }>(`SELECT src, COUNT(*) AS n FROM sources WHERE ${this.notTestUser("user_id")} GROUP BY src`);
    const s: Record<string, number> = {};
    for (const r of sr) s["src_" + r.src] = r.n;
    return { ...this.userStats(), ...s, events: c?.n ?? 0, minutes: mins?.m ?? 0, groups: gm?.n ?? 0, group_sessions: gs?.n ?? 0 };
  }
}
