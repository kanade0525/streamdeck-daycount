# 提出の手引き（Day Count）

**無料で出す。** Lite / Pro の分けは無い。

---

## やること

### 1. 配布物を作る

```sh
cd ~/development/streamdeck-daycount
npm run pack
```

`com.kanade0525.daycount.streamDeckPlugin` ができる。
（GitHub の [Release](https://github.com/kanade0525/streamdeck-daycount/releases) にも
同じものが置いてある）

### 2. Maker Console で出す

https://maker.elgato.com → Home → **Create product**

| 欄 | 入れるもの |
| --- | --- |
| Type | Stream Deck Plugin |
| File | `com.kanade0525.daycount.streamDeckPlugin` |
| Name | `Day Count` |
| Description | **`docs/description-en.md` をそのまま貼る**（2,819字） |
| Price | **Free** |
| Icon | `media/icon-512.png` |
| Thumbnail | `media/thumbnail.png` |
| Gallery | `media/gallery-1-two-ways.png` 〜 `gallery-5-quiet.png`（5点。最低3点） |
| Tags | `countdown` `date` `productivity` `workdays` `mac` |
| Support | `https://github.com/kanade0525/streamdeck-daycount/issues` |
| DRM protection | **Yes**（必須） |
| Release notes | 下記 |

### 3. 待つ

審査は **4〜10営業日**。

---

## Release notes（初回）

```
First release.

Put a date on a key and it keeps the number for you. Days until the date, or
days since it — a release, a renewal, a run of days without an incident.

- Count every day, or work days only. Weekends, and Japanese public holidays
  too if you want them skipped. Holidays are worked out on your machine, so
  nothing is downloaded and no list goes stale
- Hold a Days since key for two seconds and the count starts over from today,
  for a board like days-without-an-incident
- Blue while the date is far off, amber as it gets close, green on the day
- Your own label above the number and your own wording underneath
- Whole calendar days, so leap years and daylight saving never shift the count
- No account, no permission, no network
```

---

## 落ちたときの直し方

Server Watch で一度落ちている。同じ指摘が来る可能性がある。

| 指摘 | 対応 |
| --- | --- |
| 説明が足りない | 4,000字の枠に対して 2,819字。足す余地がある |
| デモ動画を送れ | 画面収録して `maker@elgato.com` に返信 |
| 版番号が違う | **修正版は同じ版番号のまま上げる。** 版を上げると弾かれる |

デモを撮るなら、この流れが短い。

1. キーに **Days until** を置く（未設定の絵が出ている）
2. 設定画面で日付を選ぶ → **その場で「◯日後です」と出る**
3. キーが青くなって日数が出る
4. 数え方を Work days only に変える → **数が減り、単位が WORK DAYS LEFT になる**
5. **Days since** を置いて、過去の日付を入れる → 経過日数が出る
6. **そのキーを2秒長押し** → バーが伸びて 0 に戻る

**2・4・6 を必ず入れる。** 設定した瞬間に結果が見えること、営業日で数えられること、
長押しで数え直せることは、いずれも既存の有料プラグインに無い。

---

## この道具が通りやすい理由

これまでの2本と違い、**説明が要る要素がない。**

| | Combo Counter | Server Watch | Day Count |
| --- | --- | --- | --- |
| 権限 | 入力監視が必要 | 不要 | **不要** |
| 通信 | なし | 利用者が入れた宛先へ | **なし** |
| 同梱バイナリ | あり（Swift） | なし | **なし** |

審査で説明を求められる点が無いので、落ちるとすれば説明文か画像の指摘だけ。

---

## 競合（調べた結果）

有料しか無かったので、無料で出す意味がある。

| | 価格 |
| --- | --- |
| [Event Countdown](https://marketplace.elgato.com/product/event-countdown-1bc63787-875b-4592-973c-c226c4d67a7d) | $3.99 |
| [Time Counter](https://marketplace.elgato.com/product/time-counter-d5498ecf-67b5-4751-b24b-7c540f72d542) | 約 $5.3 |

無料のもの（Countdown Timer / Dial Countdown / Tickwork / Activity Stopwatch /
DeckCal / iCal など）は、**すべて時間のタイマーかカレンダー連動**で、
任意の日付を数えるものではない。実際に入れて触って確かめた。
