// Stream Deck との接続。公式SDK（@elgato/streamdeck）に乗せている。
//
// 日付の勘定なので、変わるのは日をまたいだ瞬間だけ。
// それでも時計のずれや、眠りからの復帰を拾うために1分ごとに確かめる。
// 絵が変わらなければ送らないので、CPU は平常値のまま。

import streamDeck, { SingletonAction } from '@elgato/streamdeck';
import { parseDate, countFor, isNear, isSensible, MODE, COUNT } from './daycount.js';
import { isHolidayJP } from './holidays-jp.js';
import { labelFor } from './labels.js';
import { dayImage, dataUri } from './draw.js';
import { RateLimiter } from './rate-limit.js';

const logger = streamDeck.logger;
const TICK_MS = 60_000;   // 1分ごとに確かめる

// 数え直しは記録が消える操作なので、短い押下では絶対に起こさない。
// 押している間は進み具合をキーに出して、指を離せば止められるようにする
const RESET_HOLD_MS = 2000;

const DEFAULTS = {
  date: '',
  name: '',
  label: '',            // 空なら状態に応じて決める
  nearWithin: 7,        // 何日前から色を変えるか（まで、のみ）
  resetOnHold: true,    // 長押しで今日から数え直す（から、のみ）
  count: COUNT.calendar,// 暦の日数か、営業日か
  skipHolidays: false,  // 営業日のとき、日本の祝日も飛ばすか
};

/** キーごとの設定と、最後に送った絵。絵が変わらなければ送らない */
const keys = new Map();   // action.id -> {action, settings, mode, limiter, lastSvg}

const render = (entry) => {
  const s = entry.settings;
  const target = parseDate(s.date);
  if (target === null) return dayImage({ state: 'unset' });

  // 数え方に合わない日付（から数えるキーに未来の日付など）は、
  // それらしい数を出さずに、直してもらう
  if (!isSensible(target, entry.mode)) return dayImage({ state: 'wrong' });

  const counting = s.count === COUNT.business ? COUNT.business : COUNT.calendar;
  const count = countFor({
    target,
    mode: entry.mode,
    count: counting,
    isHoliday: s.skipHolidays ? isHolidayJP : undefined,
  });
  const near = isNear(count, entry.mode, Number(s.nearWithin) || DEFAULTS.nearWithin);

  // 経過を数えている時は、過ぎていることが普通なので灰色にしない
  let state = count.state;
  if (near) state = 'near';
  else if (entry.mode === MODE.since && state === 'past') state = 'since';

  return dayImage({
    days: count.days,
    state,
    label: labelFor(count.state, entry.mode, s.label, counting),
    name: s.name,
    holding: entry.holdingSince ? (Date.now() - entry.holdingSince) / RESET_HOLD_MS : 0,
  });
};

const paint = (entry) => {
  const svg = render(entry);
  if (svg === entry.lastSvg) return;   // 絵が変わらなければ送らない
  entry.lastSvg = svg;
  entry.limiter.request(dataUri(svg));
};

const paintAll = () => { for (const entry of keys.values()) paint(entry); };

// 1分ごと。日付が変わった瞬間を取りこぼさないため、間隔は短めに取る
setInterval(paintAll, TICK_MS);

class DayAction extends SingletonAction {
  constructor(mode, manifestId) {
    super();
    this.mode = mode;
    this.manifestId = manifestId;
  }

  #upsert(ev) {
    const existing = keys.get(ev.action.id);
    const entry = existing ?? {
      action: ev.action,
      mode: this.mode,
      limiter: new RateLimiter({ minIntervalMs: 100, send: (img) => ev.action.setImage(img) }),
      lastSvg: null,
    };
    entry.settings = { ...DEFAULTS, ...(ev.payload?.settings ?? {}) };
    keys.set(ev.action.id, entry);
    ev.action.setTitle('');
    paint(entry);
  }

  onWillAppear(ev) { this.#upsert(ev); }
  onDidReceiveSettings(ev) { this.#upsert(ev); }
  onWillDisappear(ev) { keys.delete(ev.action.id); }

  /** 長押しで数え直せるキーか。「から数える」で、設定が入っているときだけ */
  #canReset(entry) {
    return entry.mode === MODE.since && entry.settings.resetOnHold !== false;
  }

  onKeyDown(ev) {
    const entry = keys.get(ev.action.id);
    if (!entry || !this.#canReset(entry)) return;
    // 押している間、進み具合を出す。指を離せば止められることが見て分かる
    entry.holdingSince = Date.now();
    entry.holdTimer = setInterval(() => paint(entry), 100);
    paint(entry);
  }

  onKeyUp(ev) {
    const entry = keys.get(ev.action.id);
    if (!entry) return;
    if (!this.#canReset(entry)) { paint(entry); return; }

    clearInterval(entry.holdTimer);
    const held = entry.holdingSince ? Date.now() - entry.holdingSince : 0;
    entry.holdingSince = 0;

    if (held < RESET_HOLD_MS) { paint(entry); return; }   // 短い押下では何も起きない

    const today = new Date();
    const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
      + `-${String(today.getDate()).padStart(2, '0')}`;
    entry.settings = { ...entry.settings, date };
    ev.action.setSettings(entry.settings);
    logger.info(`今日から数え直した（${date}）`);
    paint(entry);
  }
}

streamDeck.actions.registerAction(new DayAction(MODE.until, 'com.kanade0525.daycount.until'));
streamDeck.actions.registerAction(new DayAction(MODE.since, 'com.kanade0525.daycount.since'));

await streamDeck.connect();
logger.info('接続した');
