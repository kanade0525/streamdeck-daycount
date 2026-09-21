// 営業日の数え方と、祝日の計算の検査。
// 祝日は内閣府の公表データ（tests/syukujitsu.csv）と突き合わせる。
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { businessDaysBetween, countFor, COUNT, MODE } from '../com.kanade0525.daycount.sdPlugin/bin/daycount.js';
import { holidaysOf, isHolidayJP, isWeekend } from '../com.kanade0525.daycount.sdPlugin/bin/holidays-jp.js';

const at = (y, m, d) => new Date(y, m - 1, d).getTime();

// ---- 営業日 ----

test('平日だけ数える', () => {
  // 2026-03-02(月) から 2026-03-06(金) まで
  assert.equal(businessDaysBetween(at(2026, 3, 2), at(2026, 3, 6)), 4);
});

test('土日を飛ばす', () => {
  // 金曜から翌月曜は、暦で3日・営業日で1日
  assert.equal(businessDaysBetween(at(2026, 3, 6), at(2026, 3, 9)), 1);
});

test('同じ日は0', () => {
  assert.equal(businessDaysBetween(at(2026, 3, 2), at(2026, 3, 2)), 0);
});

test('過去向きは負になる', () => {
  assert.equal(businessDaysBetween(at(2026, 3, 6), at(2026, 3, 2)), -4);
});

test('1週間は5営業日', () => {
  assert.equal(businessDaysBetween(at(2026, 3, 2), at(2026, 3, 9)), 5);
});

test('祝日を飛ばす', () => {
  // 2026-05-03(日) 憲法記念日、05-04 みどりの日、05-05 こどもの日、05-06 休日
  const withHoliday = businessDaysBetween(at(2026, 5, 1), at(2026, 5, 8), isHolidayJP);
  const without = businessDaysBetween(at(2026, 5, 1), at(2026, 5, 8));
  assert.ok(withHoliday < without, `祝日を飛ばした方が少ない（${withHoliday} < ${without}）`);
  assert.equal(withHoliday, 2, '5/7(木) と 5/8(金) の2営業日');
  assert.equal(without, 5, '土日だけ飛ばすなら5営業日');
});

// ---- 祝日の計算 ----

test('内閣府の公表データと一致する（2007年以降）', () => {
  const rows = readFileSync(new URL('./syukujitsu.csv', import.meta.url), 'utf8')
    .split('\n').slice(1).map((l) => l.trim()).filter(Boolean)
    .map((l) => { const [d] = l.split(','); const [y, m, dd] = d.split('/').map(Number); return { y, k: `${y}-${m}-${dd}` }; });

  const years = [...new Set(rows.map((r) => r.y))].filter((y) => y >= 2007).sort();
  for (const y of years) {
    const official = new Set(rows.filter((r) => r.y === y).map((r) => r.k));
    const mine = new Set(holidaysOf(y).keys());
    assert.deepEqual([...mine].sort(), [...official].sort(), `${y}年の祝日`);
  }
});

test('ハッピーマンデーが月曜になる', () => {
  for (const y of [2026, 2027, 2028]) {
    for (const name of ['成人の日', '海の日', '敬老の日', 'スポーツの日']) {
      const found = [...holidaysOf(y)].find(([, n]) => n === name);
      const [key] = found;
      const [yy, mm, dd] = key.split('-').map(Number);
      assert.equal(new Date(yy, mm - 1, dd).getDay(), 1, `${y}年の${name}`);
    }
  }
});

test('振替休日が入る', () => {
  // 2026-05-03(日) 憲法記念日 → 5/6 が休日（5/4,5/5 が祝日なので繰り下がる）
  assert.equal(isHolidayJP(new Date(2026, 4, 6)), true);
});

test('国民の休日が入る', () => {
  // 2026-09-21(月) 敬老の日、09-23(水) 秋分の日 → 09-22(火) が休日
  assert.equal(isHolidayJP(new Date(2026, 8, 22)), true);
});

test('土日の判定', () => {
  assert.equal(isWeekend(new Date(2026, 2, 7)), true, '土曜');
  assert.equal(isWeekend(new Date(2026, 2, 8)), true, '日曜');
  assert.equal(isWeekend(new Date(2026, 2, 9)), false, '月曜');
});

// ---- 組み合わせ ----

test('当日かどうかは暦で決める', () => {
  // 営業日で数えていても、今日が当日なら today
  const r = countFor({ target: at(2026, 3, 7), mode: MODE.until, now: at(2026, 3, 7),
    count: COUNT.business, isHoliday: isHolidayJP });
  assert.deepEqual(r, { days: 0, state: 'today' }, '土曜でも当日は当日');
});

test('営業日で数えると、暦より少なくなる', () => {
  const opts = { target: at(2026, 3, 31), mode: MODE.until, now: at(2026, 3, 2) };
  const cal = countFor({ ...opts, count: COUNT.calendar });
  const biz = countFor({ ...opts, count: COUNT.business, isHoliday: isHolidayJP });
  assert.ok(biz.days < cal.days, `${biz.days} < ${cal.days}`);
  assert.equal(cal.state, biz.state, '状態は変わらない');
});

// ---- 単位の言葉 ----
// 「から数える」キーに未来の日付が入ったとき、「あと◯日」と出てはいけない。
// 無事故◯日のキーに「あと100日」では意味が通らない。

test('から数えるキーに未来の日付を入れても、残り日数の言い方をしない', async () => {
  const { labelFor } = await import('../com.kanade0525.daycount.sdPlugin/bin/labels.js');
  assert.equal(labelFor('future', MODE.since, '', COUNT.calendar), 'DAYS TO GO');
  assert.notEqual(labelFor('future', MODE.since, '', COUNT.calendar), 'DAYS LEFT');
});

test('まで数えるキーは、これまでどおり残り日数', async () => {
  const { labelFor } = await import('../com.kanade0525.daycount.sdPlugin/bin/labels.js');
  assert.equal(labelFor('future', MODE.until, '', COUNT.calendar), 'DAYS LEFT');
  assert.equal(labelFor('past', MODE.until, '', COUNT.calendar), 'DAYS AGO');
});

test('営業日で数えていることが単位で分かる', async () => {
  const { labelFor } = await import('../com.kanade0525.daycount.sdPlugin/bin/labels.js');
  assert.match(labelFor('future', MODE.until, '', COUNT.business), /WORK DAYS/);
  assert.match(labelFor('past', MODE.since, '', COUNT.business), /WORK DAYS/);
});

test('当日は数え方に関わらず TODAY', async () => {
  const { labelFor } = await import('../com.kanade0525.daycount.sdPlugin/bin/labels.js');
  for (const mode of [MODE.until, MODE.since]) {
    for (const c of [COUNT.calendar, COUNT.business]) {
      assert.equal(labelFor('today', mode, '', c), 'TODAY');
    }
  }
});

test('自分で単位を決めたら、それを使う', async () => {
  const { labelFor } = await import('../com.kanade0525.daycount.sdPlugin/bin/labels.js');
  assert.equal(labelFor('past', MODE.since, '無事故', COUNT.calendar), '無事故');
});
