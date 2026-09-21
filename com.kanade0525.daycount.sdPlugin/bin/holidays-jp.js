// 日本の祝日を計算で出す。表を持たず、通信もしない。
//
// なぜ計算するか: 表を同梱すると毎年の更新が要る（内閣府の公表は翌年ぶんだけ）。
// この道具は「ネットワークに繋がない」のが売りなので、取りに行く選択肢も無い。
// 祝日法の規則はほぼ計算で表せるので、そちらを採る。
//
// 検算は内閣府の公表データ（syukujitsu.csv）と突き合わせて行う。tests/ を参照。
//
// 扱う範囲は 2007年以降。それ以前は祝日法の改正が多く、規則が今と違う。

const ymd = (y, m, d) => new Date(y, m - 1, d);
const key = (date) => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

/** その月の n 回目の月曜（ハッピーマンデー） */
const nthMonday = (y, m, n) => {
  const first = ymd(y, m, 1);
  const offset = (8 - first.getDay()) % 7;   // 最初の月曜まで
  return ymd(y, m, 1 + offset + (n - 1) * 7);
};

/**
 * 春分・秋分の日。天文学的に決まるので、近似式を使う。
 * 1980〜2099 の範囲で、公表値と一致することを検算している。
 */
const equinox = (y, spring) => {
  const base = spring ? 20.8431 : 23.2488;
  const day = Math.floor(base + 0.242194 * (y - 1980) - Math.floor((y - 1980) / 4));
  return ymd(y, spring ? 3 : 9, day);
};

/** その年の「祝日そのもの」（振替休日と国民の休日を除く） */
const baseHolidays = (y) => {
  const list = [
    [ymd(y, 1, 1), '元日'],
    [nthMonday(y, 1, 2), '成人の日'],
    [ymd(y, 2, 11), '建国記念の日'],
    [equinox(y, true), '春分の日'],
    [ymd(y, 4, 29), '昭和の日'],
    [ymd(y, 5, 3), '憲法記念日'],
    [ymd(y, 5, 4), 'みどりの日'],
    [ymd(y, 5, 5), 'こどもの日'],
    [nthMonday(y, 7, 3), '海の日'],
    [nthMonday(y, 9, 3), '敬老の日'],
    [equinox(y, false), '秋分の日'],
    [nthMonday(y, 10, 2), 'スポーツの日'],
    [ymd(y, 11, 3), '文化の日'],
    [ymd(y, 11, 23), '勤労感謝の日'],
  ];

  // 天皇誕生日は在位で変わる。2019年は即位の関係で無し
  if (y >= 2020) list.push([ymd(y, 2, 23), '天皇誕生日']);
  else if (y <= 2018) list.push([ymd(y, 12, 23), '天皇誕生日']);

  // 山の日は2016年から
  if (y >= 2016) list.push([ymd(y, 8, 11), '山の日']);

  // 即位に伴う一度きりの祝日。規則で表せないので、ここだけ書く
  if (y === 2019) {
    list.push([ymd(2019, 4, 30), '国民の休日']);
    list.push([ymd(2019, 5, 1), '天皇の即位の日']);
    list.push([ymd(2019, 5, 2), '国民の休日']);
    list.push([ymd(2019, 10, 22), '即位礼正殿の儀の行われる日']);
  }

  // 東京五輪の年だけ日付が動いた。規則で表せないので、ここだけ書く
  if (y === 2020) {
    const moved = new Map([['海の日', ymd(2020, 7, 23)], ['スポーツの日', ymd(2020, 7, 24)], ['山の日', ymd(2020, 8, 10)]]);
    for (const item of list) { const m = moved.get(item[1]); if (m) item[0] = m; }
  }
  if (y === 2021) {
    const moved = new Map([['海の日', ymd(2021, 7, 22)], ['スポーツの日', ymd(2021, 7, 23)], ['山の日', ymd(2021, 8, 8)]]);
    for (const item of list) { const m = moved.get(item[1]); if (m) item[0] = m; }
  }

  return list.sort((a, b) => a[0] - b[0]);
};

/**
 * その年の祝日と休日をすべて返す。
 * - 振替休日: 祝日が日曜なら、次の平日が休み
 * - 国民の休日: 祝日にはさまれた平日が休み（9月の敬老の日と秋分の日の間など）
 * @returns {Map<string, string>} 'YYYY-M-D' → 名前
 */
export const holidaysOf = (y) => {
  const out = new Map();
  const base = baseHolidays(y);
  for (const [date, name] of base) out.set(key(date), name);

  // 振替休日。日曜と重なったら、次の「祝日でない日」まで送る
  for (const [date] of base) {
    if (date.getDay() !== 0) continue;
    const moved = new Date(date);
    do { moved.setDate(moved.getDate() + 1); } while (out.has(key(moved)));
    out.set(key(moved), '休日');
  }

  // 国民の休日。祝日と祝日にはさまれた平日
  for (const [date] of base) {
    const mid = new Date(date);
    mid.setDate(mid.getDate() + 1);
    const next = new Date(date);
    next.setDate(next.getDate() + 2);
    if (out.has(key(mid))) continue;            // すでに休み
    if (mid.getDay() === 0 || mid.getDay() === 6) continue;  // 土日は対象外
    if (base.some(([d]) => key(d) === key(next))) out.set(key(mid), '休日');
  }

  return out;
};

const cache = new Map();
const yearMap = (y) => {
  if (!cache.has(y)) cache.set(y, holidaysOf(y));
  return cache.get(y);
};

/** その日が日本の祝日・休日か */
export const isHolidayJP = (date) => yearMap(date.getFullYear()).has(key(date));

/** その日が土日か */
export const isWeekend = (date) => date.getDay() === 0 || date.getDay() === 6;
