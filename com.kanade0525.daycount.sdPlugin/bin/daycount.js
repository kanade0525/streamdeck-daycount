// 日付の計算。Stream Deck も描画も知らないので、Node から直接呼んで検査できる。
//
// 日数の勘定は、間違えても一見それらしく動いてしまう。
//   ・時刻を含めたまま引くと、同じ日なのに「0日」と「1日」が混ざる
//   ・夏時間のある地域では、24時間で割ると1日ずれる
// そこで **その地域の暦の上での日付** に落としてから引く。

/** その時刻の「日付」だけを取り出す（時刻は捨てる） */
export const startOfDay = (t) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * 暦の上で何日離れているか。未来なら正、過去なら負。
 * 24時間で割らずに、日付を1日ずつ進めて数える方式にはしない（遅いため）。
 * 代わりに、両端を正午に寄せてから割る。夏時間の1時間のずれでは日付が変わらない。
 */
export const daysBetween = (from, to) => {
  const a = startOfDay(from); a.setHours(12);
  const b = startOfDay(to);   b.setHours(12);
  return Math.round((b - a) / 86_400_000);
};

/** 入力された日付の文字列を時刻に直す。読めなければ null */
export const parseDate = (text) => {
  const s = String(text ?? '').trim();
  if (!s) return null;
  // YYYY-MM-DD だけを受ける。地域によって月日の順が変わる書き方は受けない
  const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!m) return null;
  const [, y, mo, d] = m.map(Number);
  const date = new Date(y, mo - 1, d);
  // 2026-02-31 のような存在しない日を弾く
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null;
  return date.getTime();
};

export const MODE = { until: 'until', since: 'since' };

/** 数え方。暦の日数か、営業日か */
export const COUNT = { calendar: 'calendar', business: 'business' };

/**
 * 2つの日付の間の営業日数。土日と、指定があれば祝日を飛ばす。
 *
 * 数えるのは「あと何営業日あるか」なので、**始まりの日は含めず、終わりの日は含める**。
 * 明日が営業日なら「あと1営業日」。今日は、もう来てしまっているので数えない。
 *
 * @param {(d: Date) => boolean} isHoliday 祝日かどうか。飛ばさないなら () => false
 */
export const businessDaysBetween = (from, to, isHoliday = () => false) => {
  const a = startOfDay(from);
  const b = startOfDay(to);
  if (a.getTime() === b.getTime()) return 0;

  const forward = b > a;
  const cursor = new Date(a);
  let count = 0;
  // 1日ずつ進める。日数は多くても数千なので、これで足りる
  while (cursor.getTime() !== b.getTime()) {
    cursor.setDate(cursor.getDate() + (forward ? 1 : -1));
    const day = cursor.getDay();
    if (day === 0 || day === 6) continue;
    if (isHoliday(cursor)) continue;
    count += 1;
  }
  return forward ? count : -count;
};

/**
 * 表示する数と状態を決める。
 * @param {object} opts
 * @param {number} opts.target  対象の日付
 * @param {string} opts.mode    until（まで）か since（から）
 * @param {number} [opts.now]
 * @returns {{days: number, state: string}}
 *   state は today / future / past のいずれか。描画はこれで色を変える
 */
export const countFor = ({ target, mode = MODE.until, now = Date.now(), count = COUNT.calendar, isHoliday }) => {
  // 状態（今日か・未来か・過去か）は暦で決める。営業日の数え方に関わらず、
  // 「今日が当日かどうか」は暦の話だから
  const calendar = daysBetween(now, target);
  const diff = count === COUNT.business
    ? businessDaysBetween(now, target, isHoliday)
    : calendar;

  if (calendar === 0) return { days: 0, state: 'today' };
  if (mode === MODE.until) {
    // まだ来ていなければ残り日数、過ぎていたら「過ぎた」
    return calendar > 0 ? { days: diff, state: 'future' } : { days: -diff, state: 'past' };
  }
  // since は、過ぎた日付からの経過日数。まだ来ていなければ「これから」
  return calendar < 0 ? { days: -diff, state: 'past' } : { days: diff, state: 'future' };
};

/**
 * 期限が近いか。until のときだけ意味を持つ。
 * 何日前から色を変えるかは設定で決める
 */
export const isNear = (count, mode, withinDays) =>
  mode === MODE.until && count.state === 'future' && count.days <= withinDays;
