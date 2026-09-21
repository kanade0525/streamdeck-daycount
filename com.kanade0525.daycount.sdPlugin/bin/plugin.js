// Stream Deck との接続。公式SDK（@elgato/streamdeck）に乗せている。
//
// 日付の勘定なので、変わるのは日をまたいだ瞬間だけ。
// それでも時計のずれや、眠りからの復帰を拾うために1分ごとに確かめる。
// 絵が変わらなければ送らないので、CPU は平常値のまま。

import streamDeck, { SingletonAction } from '@elgato/streamdeck';
import { parseDate, countFor, isNear, MODE } from './daycount.js';
import { dayImage, dataUri } from './draw.js';
import { RateLimiter } from './rate-limit.js';

const logger = streamDeck.logger;
const TICK_MS = 60_000;   // 1分ごとに確かめる

const DEFAULTS = {
  date: '',
  name: '',
  label: '',          // 空なら状態に応じて決める
  nearWithin: 7,      // 何日前から色を変えるか（まで、のみ）
};

/** キーごとの設定と、最後に送った絵。絵が変わらなければ送らない */
const keys = new Map();   // action.id -> {action, settings, mode, limiter, lastSvg}

const labelFor = (state, mode, custom) => {
  if (custom) return custom;
  if (state === 'today') return 'TODAY';
  if (mode === MODE.until) return state === 'past' ? 'DAYS AGO' : 'DAYS LEFT';
  return state === 'future' ? 'DAYS LEFT' : 'DAYS';
};

const render = (entry) => {
  const s = entry.settings;
  const target = parseDate(s.date);
  if (target === null) return dayImage({ state: 'unset' });

  const count = countFor({ target, mode: entry.mode });
  const near = isNear(count, entry.mode, Number(s.nearWithin) || DEFAULTS.nearWithin);

  // 経過を数えている時は、過ぎていることが普通なので灰色にしない
  let state = count.state;
  if (near) state = 'near';
  else if (entry.mode === MODE.since && state === 'past') state = 'since';

  return dayImage({
    days: count.days,
    state,
    label: labelFor(count.state, entry.mode, s.label),
    name: s.name,
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

  onKeyUp(ev) {
    // 押しても何も起きない。日付を消す操作を割り当てると、事故で消える
    const entry = keys.get(ev.action.id);
    if (entry) paint(entry);
  }
}

streamDeck.actions.registerAction(new DayAction(MODE.until, 'com.kanade0525.daycount.until'));
streamDeck.actions.registerAction(new DayAction(MODE.since, 'com.kanade0525.daycount.since'));

await streamDeck.connect();
logger.info('接続した');
