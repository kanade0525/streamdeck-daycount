// キーに出す絵。72×72 の SVG を文字列で組み立てる。
//
// 出す情報は「数」と「単位」と「名前」の3つだけ。
// 日付そのものは出さない。設定した本人は覚えているし、72×72 に入れると数が小さくなる。

const BG = '#14181c';
const INK = '#eef2f6';
const MUTED = '#79838d';

// 状態ごとの色。期限が近いかどうかで変える
const SKIN = {
  future: { accent: '#7fa9d4', ground: BG },          // まだ先
  near:   { accent: '#d8a45e', ground: '#241d13' },   // 近い
  today:  { accent: '#57d08a', ground: '#16241c' },   // 当日
  past:   { accent: '#8a949e', ground: BG },          // 過ぎた
  since:  { accent: '#57d08a', ground: BG },          // 経過を数えている
  unset:  { accent: '#3a444e', ground: BG },          // 未設定
  wrong:  { accent: '#d8a45e', ground: BG },          // 数え方に合わない日付
};

const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

/** 桁が増えるほど字を小さくする。5桁（約27年）でも収まるところまで落とす */
const fontFor = (text) =>
  text.length >= 5 ? 24 : text.length === 4 ? 29 : text.length === 3 ? 34 : 40;

/** 表示名。幅に収まるところまで小さくし、それでも余るなら詰める */
const fitName = (raw) => {
  const s = String(raw ?? '').trim();
  if (!s) return { text: '', size: 0 };
  for (const size of [10, 9, 8]) {
    if (s.length * size * 0.56 <= 60) return { text: s, size };
  }
  return { text: `${s.slice(0, 12)}…`, size: 8 };
};

/**
 * @param {object} v
 * @param {number} v.days    日数
 * @param {string} v.state   future / near / today / past / since / unset
 * @param {string} v.label   単位の文字（DAYS / LEFT / 経過 など）
 * @param {string} [v.name]  表示名
 */
export const dayImage = (v) => {
  const skin = SKIN[v.state] ?? SKIN.future;
  const name = fitName(v.name);

  if (v.state === 'wrong') {
    // 数え方に合わない日付。それらしい数を出すより、直してもらう方がいい
    return `<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 72 72">
  <rect width="72" height="72" rx="10" fill="${BG}"/>
  <path d="M36 20 L50 46 H22 Z" fill="none" stroke="${skin.accent}" stroke-width="3" stroke-linejoin="round"/>
  <rect x="35" y="29" width="2" height="9" rx="1" fill="${skin.accent}"/>
  <rect x="35" y="40" width="2" height="2.6" rx="1" fill="${skin.accent}"/>
  <text x="36" y="63" text-anchor="middle" font-family="Helvetica, Arial, sans-serif"
        font-size="8" fill="${MUTED}">check the date</text>
</svg>`;
  }

  if (v.state === 'unset') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 72 72">
  <rect width="72" height="72" rx="10" fill="${BG}"/>
  <rect x="16" y="20" width="40" height="34" rx="4" fill="none" stroke="${skin.accent}" stroke-width="3"/>
  <line x1="16" y1="30" x2="56" y2="30" stroke="${skin.accent}" stroke-width="3"/>
  <text x="36" y="64" text-anchor="middle" font-family="Helvetica, Arial, sans-serif"
        font-size="8" fill="${MUTED}">set a date</text>
</svg>`;
  }

  const text = String(v.days);
  const size = fontFor(text);
  // 名前があると上に載るので、数を少し下げる
  const y = (name.text ? 44 : 40) + size * 0.34;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 72 72">
  <rect width="72" height="72" rx="10" fill="${skin.ground}"/>
  <rect x="0" y="0" width="72" height="3.5" rx="1.75" fill="${skin.accent}"/>
  ${name.text ? `<text x="36" y="18" text-anchor="middle" font-family="Helvetica, Arial, sans-serif"
        font-size="${name.size}" font-weight="600" fill="${skin.accent}">${esc(name.text)}</text>` : ''}
  <text x="36" y="${y.toFixed(1)}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif"
        font-size="${size}" font-weight="700" fill="${INK}">${text}</text>
  <text x="36" y="64" text-anchor="middle" font-family="Helvetica, Arial, sans-serif"
        font-size="9" font-weight="600" letter-spacing="0.5" fill="${MUTED}">${esc(v.label)}</text>
</svg>`;
};

export const dataUri = (svg) => `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
