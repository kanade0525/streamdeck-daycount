Day Count puts a date on a Stream Deck key and keeps the number up to date for you. Choose a date in the future and the key counts down the days to it. Choose one in the past and the key counts the days since. There is nothing else to set up: no account, no API key, no permission to grant. Type a date and the key does the rest from then on.

## Two actions

| | What it does |
| --- | --- |
| **Days until** | Counts down to the date. Turns amber as the date gets close |
| **Days since** | Counts up from the date, for anything you want to keep a run going on |

Both take the same settings, so you can swap one for the other without redoing anything.

## Reading the key

- **Blue** — the date is still some way off
- **Amber** — the date is close. You choose how many days count as close; seven by default
- **Green** — today is the day, or the key is counting up from a past date
- **Grey** — a **Days until** date that has already gone by

Give a key its own label and it appears above the number. The unit text underneath
(`DAYS LEFT`, `DAYS AGO`, `TODAY`) follows the state on its own, or you can set your own
wording — useful for things like a days-without-an-incident board.

## Setting it up

1. Drop **Days until** or **Days since** on a key
2. Type the date
3. That is it

As you type the date, the settings panel tells you what the key will show — 42 days left,
127 days so far — so a typo is visible before you save. Several keys can count different
dates at once, each with its own label.

## What it counts

Whole days on the calendar, not hours. A date one minute after midnight tomorrow is one
day away, not zero. Leap years, month ends and daylight saving changes are all handled,
so the number never jumps by a day for the wrong reason.

Dates are written as `YYYY-MM-DD`. Formats where the order of day and month changes from
country to country are not accepted, because a date read the wrong way around is worse
than one that is refused.

## What it does not do

It subtracts two dates and draws the result. It does not read your calendar, it does not
ask for any permission, and it makes no network connections at all.

## Requirements

macOS 12 or later, Stream Deck 6.9 or later. Works on keys.
