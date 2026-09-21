// 数の下に出す単位の文字を決める。
//
// ここを間違えると、数が合っていても意味が通らなくなる。
// 「無事故」のキーに「あと100日」と出るようなことが起きるので、切り出して検査する。

import { MODE, COUNT } from './daycount.js';

/**
 * @param {string} state   today / future / past
 * @param {string} mode    until（まで）/ since（から）
 * @param {string} custom  利用者が決めた文字。あればそれを使う
 * @param {string} count   calendar / business
 */
export const labelFor = (state, mode, custom, count) => {
  if (custom) return custom;
  if (state === 'today') return 'TODAY';

  const work = count === COUNT.business;

  if (mode === MODE.until) {
    if (state === 'past') return work ? 'WORK DAYS AGO' : 'DAYS AGO';
    return work ? 'WORK DAYS LEFT' : 'DAYS LEFT';
  }

  // 「から数える」キーに未来の日付が入っている場合。
  // まだ始まっていないので「あと◯日」ではなく「◯日後から」と出す
  if (state === 'future') return work ? 'WORK DAYS TO GO' : 'DAYS TO GO';
  return work ? 'WORK DAYS' : 'DAYS';
};
