# History Navigator — Islam Museum Time Browser client

A clean, static, **AI-free** client for the Islam Museum Time Browser. It reads prepared
JSON records from `https://islam.museum/time-browser-data/<lang>/index.json` and shows them
on a timeline. There is no model call, no generation, no voice, no video and no telemetry —
the earlier AI-Studio code (Gemini, voice, telemetry, AI prompt modal, AI image calls) was
removed, not flagged off.

Record shape and data URL: `time-browser-plan/DESIGN.md` §2–§3 in `amado2k5/islam-museum`.

## Stack

- React 19, Vite 8, TypeScript 5.9 (typescript-eslint caps TS at <6.1 today)
- Tailwind CSS 4 via `@tailwindcss/vite`
- Vitest + Testing Library, ESLint 10 flat config

## Run

```sh
npm install
npm run dev        # opens the client; if the real feed is not live yet it falls back to
                   # /time-browser-data/<lang>/index.json then /sample/index.json
npm test           # vitest
npm run lint
npm run build      # tsc -b && vite build
```

## Layout (DESIGN §1)

- Full viewport, no page scroll; only panels scroll.
- Phone: bottom timeline strip + bottom sheet. Tablet/desktop: timeline across the bottom,
  detail panel on the side.
- Keyboard: arrows (RTL-aware), Home/End move between stops.
- Languages: العربية / English / اردو. RTL is set on the document.
- Deep links: `#<kind>/<slug>`.

## Data

- `index.json` per language under `DATA_BASE` (`src/services/data.ts`, one constant).
- The client normalizes the TB1 index shape (`{base, topics}`) onto the UI record.
- Stops with no real image show their prepared SVG card or cluster map; media paths resolve
  against the origin that served `index.json`.
- Draft records show a visible "draft" label.
