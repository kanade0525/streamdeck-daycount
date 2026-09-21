// 日数の勘定の検査。間違えても一見それらしく動くので、境目を厚く押さえる。
import test from 'node:test';
import assert from 'node:assert/strict';
import { daysBetween, parseDate, countFor, isNear, MODE, startOfDay } from '../com.kanade0525.daycount.sdPlugin/bin/daycount.js';

const at = (y, m, d, hh = 0, mm = 0) => new Date(y, m - 1, d, hh, mm).getTime();

// ---- 日付だけを見る ----

test('同じ日なら、時刻が違っても0日', () => {
  assert.equal(daysBetween(at(2026, 3, 1, 0, 1), at(2026, 3, 1, 23, 59)), 0);
});

test('日付が変われば1日', () => {
  assert.equal(daysBetween(at(2026, 3, 1, 23, 59), at(2026, 3, 2, 0, 1)), 1,
    '2分しか離れていなくても、日をまたげば1日');
});

test('過ぎた日付は負になる', () => {
  assert.equal(daysBetween(at(2026, 3, 10), at(2026, 3, 1)), -9);
});

test('月をまたぐ', () => {
  assert.equal(daysBetween(at(2026, 1, 31), at(2026, 2, 1)), 1);
});

test('うるう年の2月29日', () => {
  assert.equal(daysBetween(at(2028, 2, 28), at(2028, 3, 1)), 2, '2028年はうるう年');
  assert.equal(daysBetween(at(2026, 2, 28), at(2026, 3, 1)), 1, '2026年は平年');
});

test('年をまたぐ', () => {
  assert.equal(daysBetween(at(2026, 12, 31), at(2027, 1, 1)), 1);
});

test('長い期間', () => {
  assert.equal(daysBetween(at(2026, 1, 1), at(2027, 1, 1)), 365);
});

// ---- 日付の読み取り ----

test('YYYY-MM-DD を読む', () => {
  assert.equal(parseDate('2026-03-01'), at(2026, 3, 1));
  assert.equal(parseDate('2026-3-1'), at(2026, 3, 1), '0埋めなしも受ける');
});

test('前後の空白は落とす', () => {
  assert.equal(parseDate('  2026-03-01  '), at(2026, 3, 1));
});

test('読めないものは null', () => {
  for (const s of ['', '  ', '03/01/2026', '2026年3月1日', 'tomorrow', '2026-13-01', '2026-02-31']) {
    assert.equal(parseDate(s), null, `${JSON.stringify(s)} は読めないはず`);
  }
});

test('月日の順が地域で変わる書き方は受けない', () => {
  assert.equal(parseDate('01-03-2026'), null, '取り違えるくらいなら受けない');
});

// ---- 「まで」 ----

const until = (target, now) => countFor({ target, mode: MODE.until, now });

test('まで: 未来なら残り日数', () => {
  assert.deepEqual(until(at(2026, 3, 10), at(2026, 3, 1)), { days: 9, state: 'future' });
});

test('まで: 当日は 0 で today', () => {
  assert.deepEqual(until(at(2026, 3, 1), at(2026, 3, 1, 15)), { days: 0, state: 'today' });
});

test('まで: 過ぎたら past', () => {
  assert.deepEqual(until(at(2026, 3, 1), at(2026, 3, 5)), { days: 4, state: 'past' });
});

// ---- 「から」 ----

const since = (target, now) => countFor({ target, mode: MODE.since, now });

test('から: 過ぎた日付からの経過日数', () => {
  assert.deepEqual(since(at(2026, 3, 1), at(2026, 3, 10)), { days: 9, state: 'past' });
});

test('から: 当日は 0', () => {
  assert.deepEqual(since(at(2026, 3, 1), at(2026, 3, 1)), { days: 0, state: 'today' });
});

test('から: まだ来ていない日付なら future', () => {
  assert.deepEqual(since(at(2026, 3, 10), at(2026, 3, 1)), { days: 9, state: 'future' });
});

test('無事故◯日の使い方', () => {
  // 最後に事故があった日を入れて、そこからの日数を数える
  const lastIncident = at(2026, 1, 1);
  assert.equal(since(lastIncident, at(2026, 5, 8)).days, 127);
});

// ---- 期限が近いか ----

test('まで: 指定した日数以内なら近い', () => {
  assert.equal(isNear(until(at(2026, 3, 8), at(2026, 3, 1)), MODE.until, 7), true);
  assert.equal(isNear(until(at(2026, 3, 9), at(2026, 3, 1)), MODE.until, 7), false);
});

test('から: 近いという概念が無いので常に false', () => {
  assert.equal(isNear(since(at(2026, 1, 1), at(2026, 1, 2)), MODE.since, 7), false);
});

test('過ぎた日付は「近い」に含めない', () => {
  assert.equal(isNear(until(at(2026, 3, 1), at(2026, 3, 5)), MODE.until, 7), false);
});

// ---- 日付だけを取り出す ----

test('startOfDay は時刻を落とす', () => {
  const d = startOfDay(at(2026, 3, 1, 23, 59));
  assert.equal(d.getHours(), 0);
  assert.equal(d.getDate(), 1);
});

// ---- 数え方に合わない日付 ----
// 「から数える」キーに未来の日付を入れても、それらしい数を出してはいけない

test('まで数えるキーには、未来の日付が合う', async () => {
  const { isSensible } = await import('../com.kanade0525.daycount.sdPlugin/bin/daycount.js');
  assert.equal(isSensible(at(2026, 3, 10), MODE.until, at(2026, 3, 1)), true);
  assert.equal(isSensible(at(2026, 3, 1), MODE.until, at(2026, 3, 10)), false, '過ぎた日付は合わない');
});

test('から数えるキーには、過ぎた日付が合う', async () => {
  const { isSensible } = await import('../com.kanade0525.daycount.sdPlugin/bin/daycount.js');
  assert.equal(isSensible(at(2026, 3, 1), MODE.since, at(2026, 3, 10)), true);
  assert.equal(isSensible(at(2026, 3, 10), MODE.since, at(2026, 3, 1)), false,
    '無事故のキーに未来の日付は合わない');
});

test('当日はどちらでも合う', async () => {
  const { isSensible } = await import('../com.kanade0525.daycount.sdPlugin/bin/daycount.js');
  for (const mode of [MODE.until, MODE.since]) {
    assert.equal(isSensible(at(2026, 3, 1), mode, at(2026, 3, 1, 18)), true);
  }
});
