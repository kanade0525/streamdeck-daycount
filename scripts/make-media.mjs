// Marketplace に出すサムネイルとギャラリー画像を作る。
//
// なぜ生成するか: 画面を手で撮って並べると、直すたびに撮り直しになる。
// プラグイン本体と同じ描画器（bin/draw.js）でキーを描けば、実物と必ず一致し、
// 見た目を変えたときは走らせ直すだけで済む。
//
// SVG から PNG にするのは、手元の Chrome を画面なしで動かして撮る。
// 画像変換の道具を入れずに済み、見えるものがそのまま出る。
//
// 規格: サムネイル・ギャラリーとも 1920×960 PNG。

import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { dayImage } from '../com.kanade0525.daycount.sdPlugin/bin/draw.js';

const OUT = 'media';
const TMP = join(OUT, '.work');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const W = 1920, H = 960;
const BG = '#0e1114';
const INK = '#e8f0e8';
const MUTED = '#79838d';

/** キー1枚。実物と同じ描画器を使う */
const key = (v, px = 200) =>
  `<div class="key" style="width:${px}px;height:${px}px">${dayImage(v)}</div>`;

const page = (body, extra = '') => `<!doctype html><meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: ${W}px; height: ${H}px; background: ${BG}; color: ${INK};
    font-family: -apple-system, "Helvetica Neue", Arial, sans-serif;
    overflow: hidden;
  }
  .key svg { width: 100%; height: 100%; display: block; }
  .key { border-radius: 14%; overflow: hidden; }
  .stage { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
  .inner { width: 1500px; }
  h1 { font-size: 86px; font-weight: 700; letter-spacing: -1.5px; }
  h2 { font-size: 52px; font-weight: 600; letter-spacing: -0.5px; }
  p  { font-size: 30px; color: ${MUTED}; line-height: 1.5; font-weight: 400; }
  .cap { font-size: 24px; color: ${MUTED}; margin-top: 18px; font-weight: 500; }
  .row { display: flex; align-items: center; }
  ${extra}
</style>
${body}`;

// ---- 1. サムネイル ----
const thumbnail = page(`
<div class="stage"><div class="inner row" style="gap:110px">
  <div class="row" style="gap:28px;flex-shrink:0">
    ${key({ days: 42, state: 'future', label: 'DAYS LEFT', name: 'Release' }, 250)}
    ${key({ days: 127, state: 'since', label: 'DAYS', name: 'No incident' }, 250)}
  </div>
  <div>
    <h1>Day Count</h1>
    <p style="margin-top:28px;font-size:36px;max-width:740px;line-height:1.4">
      Days to a date you choose, or days since one. Set the date and the key does the rest.
    </p>
  </div>
</div></div>`);

// ---- 2. 2つのアクション ----
const twoWays = page(`
<div class="stage"><div class="inner">
  <h2>Two ways to count</h2>
  <p style="margin-top:20px">Put either one on a key, type a date, and you are done. Nothing else to set up.</p>
  <div class="row" style="gap:110px;margin-top:80px;justify-content:center">
    <div style="text-align:center">
      ${key({ days: 42, state: 'future', label: 'DAYS LEFT', name: 'Release' }, 250)}
      <div class="cap">Days until — counts down to the date</div>
    </div>
    <div style="text-align:center">
      ${key({ days: 127, state: 'since', label: 'DAYS', name: 'Since launch' }, 250)}
      <div class="cap">Days since — counts up from the date</div>
    </div>
  </div>
</div></div>`);

// ---- 3. 近づくと色が変わる ----
const colours = page(`
<div class="stage"><div class="inner">
  <h2>It changes as the date gets close</h2>
  <p style="margin-top:20px">Blue while the date is far off, amber once it is near, green on the day itself. You choose how many days count as near.</p>
  <div class="row" style="gap:70px;margin-top:80px;justify-content:center">
    ${[
      [{ days: 128, state: 'future', label: 'DAYS LEFT' }, 'Far off'],
      [{ days: 3, state: 'near', label: 'DAYS LEFT' }, 'Getting close'],
      [{ days: 0, state: 'today', label: 'TODAY' }, 'The day itself'],
      [{ days: 12, state: 'past', label: 'DAYS AGO' }, 'Passed'],
    ].map(([v, cap]) => `<div style="text-align:center">${key(v, 200)}<div class="cap">${cap}</div></div>`).join('')}
  </div>
</div></div>`);

// ---- 4. 営業日 ----
const workdays = page(`
<div class="stage"><div class="inner">
  <h2>Count work days, not every day</h2>
  <p style="margin-top:20px">Skip weekends, and Japanese public holidays too. The holidays are worked out on your machine — nothing is downloaded, and no list goes stale.</p>
  <div class="row" style="gap:90px;margin-top:80px;justify-content:center">
    <div style="text-align:center">
      ${key({ days: 29, state: 'future', label: 'DAYS LEFT', name: 'Deadline' }, 240)}
      <div class="cap">Every day</div>
    </div>
    <div style="text-align:center">
      ${key({ days: 18, state: 'future', label: 'WORK DAYS LEFT', name: 'Deadline' }, 240)}
      <div class="cap">Work days only — the same deadline</div>
    </div>
  </div>
</div></div>`);

// ---- 5. 長押しで数え直す ----
const reset = page(`
<div class="stage"><div class="inner row" style="gap:120px">
  <div class="row" style="gap:30px;flex-shrink:0">
    ${key({ days: 127, state: 'since', label: 'NO INCIDENT', name: 'Line 2' }, 210)}
    ${key({ days: 127, state: 'since', label: 'NO INCIDENT', name: 'Line 2', holding: 0.7 }, 210)}
    ${key({ days: 0, state: 'today', label: 'TODAY', name: 'Line 2' }, 210)}
  </div>
  <div>
    <h2>Start again from today</h2>
    <p style="margin-top:24px;max-width:560px">
      Hold a Days since key for two seconds and the count starts over. A bar fills while you
      hold, so letting go cancels it, and a short press never does anything.
    </p>
  </div>
</div></div>`);

// ---- 6. 使いどころ ----
const uses = page(`
<div class="stage"><div class="inner">
  <h2>What people count</h2>
  <div class="row" style="gap:56px;margin-top:70px;justify-content:center">
    ${[
      [{ days: 42, state: 'future', label: 'DAYS LEFT', name: 'Release' }, 'A release'],
      [{ days: 5, state: 'near', label: 'DAYS LEFT', name: 'Renewal' }, 'A renewal'],
      [{ days: 127, state: 'since', label: 'DAYS', name: 'No incident' }, 'Days without an incident'],
      [{ days: 365, state: 'since', label: 'DAYS', name: 'Quit smoking' }, 'A habit you kept'],
    ].map(([v, cap]) => `<div style="text-align:center">${key(v, 190)}<div class="cap">${cap}</div></div>`).join('')}
  </div>
  <p style="margin-top:56px;text-align:center">Give each key its own label. Several keys can count different dates at once.</p>
</div></div>`);

// ---- 5. 何もしない ----
const quiet = page(`
<div class="stage"><div class="inner">
  <h2>It does nothing else</h2>
  <div class="row" style="gap:100px;margin-top:64px;align-items:stretch">
    <div style="flex:1">
      <div style="font-size:30px;font-weight:700;color:#57d08a;margin-bottom:26px">WHAT IT NEEDS</div>
      <p style="font-size:30px;color:${INK}">A date.</p>
      <p style="margin-top:22px">That is the whole setup. No account, no API key, no permission.</p>
    </div>
    <div style="width:1px;background:#252b31"></div>
    <div style="flex:1">
      <div style="font-size:30px;font-weight:700;color:#79838d;margin-bottom:26px">WHAT IT DOES NOT TOUCH</div>
      <p style="font-size:30px;color:${INK}">Your calendar. The network.</p>
      <p style="margin-top:22px">It subtracts two dates and draws the result. Nothing leaves your machine.</p>
    </div>
  </div>
</div></div>`);

// ---- 書き出し ----
// 画像の名前を変えたとき、前回のものが残ると混ざる。毎回まっさらにする
rmSync(OUT, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });
mkdirSync(OUT, { recursive: true });

const pages = [
  ['thumbnail', thumbnail],
  ['gallery-1-two-ways', twoWays],
  ['gallery-2-workdays', workdays],
  ['gallery-3-reset', reset],
  ['gallery-4-uses', uses],
  ['gallery-5-quiet', quiet],
];

for (const [name, html] of pages) {
  const src = join(TMP, `${name}.html`);
  writeFileSync(src, html);
  execFileSync(CHROME, [
    '--headless', '--disable-gpu', '--hide-scrollbars',
    `--screenshot=${join(OUT, `${name}.png`)}`,
    `--window-size=${W},${H}`,
    `--virtual-time-budget=1500`,
    src,
  ], { stdio: 'ignore' });
  console.log(`撮った: ${OUT}/${name}.png`);
}
rmSync(TMP, { recursive: true, force: true });
console.log(`\n${pages.length}枚。すべて ${W}×${H}`);
