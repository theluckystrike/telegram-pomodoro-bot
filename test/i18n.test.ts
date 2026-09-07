import { test } from "node:test";
import assert from "node:assert/strict";
import { LANGS, t } from "../src/i18n.ts";

const BTN_KEYS = ["btn_unlockPro", "btn_openBot", "btn_start25", "btn_shareBot", "btn_break", "btn_again"] as const;
const INTERP_KEYS = ["groupStart", "joinClosed", "help"] as const;

test("every locale has every btn_* key non-empty", () => {
  for (const lang of LANGS) {
    for (const key of BTN_KEYS) {
      const s = t(lang, key);
      assert.ok(s.length > 0, `${lang}/${key} is empty`);
    }
  }
  assert.equal(LANGS.length, 11);
});

test("no btn_* label exceeds 32 chars in any locale", () => {
  for (const lang of LANGS) {
    for (const key of BTN_KEYS) {
      const s = t(lang, key);
      assert.ok(s.length <= 32, `${lang}/${key} is ${s.length} chars: "${s}"`);
    }
  }
});

test("{btn} interpolation in groupStart/joinClosed/help never leaves a literal {btn} behind", () => {
  for (const lang of LANGS) {
    const btn = t(lang, "joinBtn");
    for (const key of INTERP_KEYS) {
      const s = t(lang, key, { minutes: 25, end: "12:00", cap: 3, btn });
      assert.ok(!s.includes("{btn}"), `${lang}/${key} left an unsubstituted {btn}`);
    }
  }
});

test("groupStart and help — which always describe tapping the join button — quote the actual localized joinBtn label", () => {
  for (const lang of LANGS) {
    const btn = t(lang, "joinBtn");
    for (const key of ["groupStart", "help"] as const) {
      const s = t(lang, key, { minutes: 25, end: "12:00", cap: 3, btn });
      assert.ok(s.includes(btn), `${lang}/${key} doesn't quote the real joinBtn label — copy/button mismatch`);
    }
  }
});

test("btn_break substitutes {minutes} for every locale", () => {
  for (const lang of LANGS) {
    const s = t(lang, "btn_break", { minutes: 5 });
    assert.ok(s.includes("5"), `${lang}: missing minutes`);
    assert.ok(!s.includes("{minutes}"), `${lang}: unsubstituted placeholder`);
  }
});
