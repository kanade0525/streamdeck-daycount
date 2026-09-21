// キーの絵を実寸で書き出して、目で確かめるための道具。
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { dayImage } from '../com.kanade0525.daycount.sdPlugin/bin/draw.js';

const OUT = 'preview';
const TMP = join(OUT, '.work');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const cases = [
  ['未設定', { state: 'unset' }],
  ['まだ先', { days: 128, state: 'future', label: 'DAYS LEFT' }],
  ['近い', { days: 3, state: 'near', label: 'DAYS LEFT' }],
  ['当日', { days: 0, state: 'today', label: 'TODAY' }],
  ['過ぎた', { days: 12, state: 'past', label: 'DAYS AGO' }],
  ['経過', { days: 127, state: 'since', label: 'DAYS' }],
  ['名前つき', { days: 42, state: 'future', label: 'DAYS LEFT', name: 'リリース' }],
  ['無事故', { days: 127, state: 'since', label: '無事故', name: '第二工場' }],
  ['長い名前', { days: 7, state: 'near', label: 'DAYS LEFT', name: 'very-long-label' }],
  ['4桁', { days: 1000, state: 'since', label: 'DAYS' }],
  ['5桁', { days: 10000, state: 'since', label: 'DAYS' }],
];

const tiles = cases.map(([name, v]) => `<div class="t">
  <div class="k" style="width:72px;height:72px">${dayImage(v)}</div>
  <div class="k" style="width:168px;height:168px">${dayImage(v)}</div>
  <div class="cap">${name}</div>
</div>`).join('');

rmSync(OUT, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });
writeFileSync(join(TMP, 'p.html'), `<!doctype html><meta charset="utf-8"><style>
  body { margin:0; padding:22px; background:#3a3f45; font:12px -apple-system,Helvetica,Arial,sans-serif; color:#cfd6dd; }
  .grid { display:flex; flex-wrap:wrap; gap:20px; }
  .t { display:flex; flex-direction:column; align-items:center; gap:8px; }
  .k svg { width:100%; height:100%; display:block; }
  .cap { color:#98a2ab; }
</style><div class="grid">${tiles}</div>`);
execFileSync(CHROME, ['--headless', '--disable-gpu', '--hide-scrollbars',
  `--screenshot=${join(OUT, 'keys.png')}`, '--window-size=1100,900',
  '--virtual-time-budget=1200', join(TMP, 'p.html')], { stdio: 'ignore' });
rmSync(TMP, { recursive: true, force: true });
console.log(`${OUT}/keys.png に書き出した`);
