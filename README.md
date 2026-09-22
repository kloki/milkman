# milkman

A Postman-style local playground for the [TypeSafe AI](https://docs.typesafe.ai/introduction) System One API. Build requests against Jev (`state` + typed Noul/Choice/Score questions), send them, and inspect the structured answers — with both formatted and raw JSON views for input and output.

Built with Electron, React 19, TypeScript, and [performative-ui](https://performative-ui.cncl.co/). Light theme, neon-rainbow accents.

## Features

- **Request builder** — state editor (objects/arrays are sent as JSON, everything else as a string), model picker populated from `GET /v1/models`, and type-specific question editors:
  - **Noul** — yes/no, optional definitions of what "yes" and "no" mean
  - **Choice** — option → meaning map (up to 255 options)
  - **Score** — ordered level descriptions (2–10 levels)
- **JSON input view** — CodeMirror editor with live JSON linting; edits win over the builder, last valid parse is kept
- **Formatted response** — per-answer cards with a noul gauge, choice probability bars + winner badge, score scale with weighted marker + legend, confidence meters, and token-usage counters
- **JSON response view** — syntax-highlighted pretty JSON with copy; friendly hints for 401/422/429/529 errors
- **Request history + presets** — presets are pinned at the top of the history list (clearing recent requests always leaves the presets), and past requests restore the full request + response with one click
- **Presets** — seven ready-to-run examples, including milkman-themed ones (delivery triage, freshness panel, morning route)
- **Settings** — API key persisted via a local store, with `TYPESAFE_API_KEY` env fallback, plus a "Test connection" button

## Requirements

- Node.js >= 18 (tested with 22)
- npm

## Getting started

```bash
npm install
npm run dev
```

Set your API key via **Settings** in the app (saved locally), or export it before launching:

```bash
export TYPESAFE_API_KEY=ts-...
npm run dev
```

## Scripts

| Command              | Description                                   |
| -------------------- | --------------------------------------------- |
| `npm run dev`        | Start the app in dev mode (HMR)               |
| `npm run build`      | Build main, preload, and renderer to `out/`   |
| `npm run start`      | Preview a production build                   |
| `npm run typecheck`  | Type-check the whole project                  |
| `npm test`           | Run the unit tests (vitest)                   |
| `npm run package`    | Build + package a Linux AppImage to `dist/`   |

## How requests are made

All API calls run in the Electron main process via IPC (no CORS, real status codes, accurate timing):

- `POST {baseUrl}/v1/systemone` — the evaluation endpoint
- `GET {baseUrl}/v1/models` — model listing (populates the model picker and powers "Test connection")

Default base URL is `https://api.typesafe.ai`.

## Project layout

```
src/
  main/        window, IPC handlers, HTTP client, persistent store
  preload/     contextBridge → window.milkman API
  renderer/    React app (builder, JSON editor, response views, sidebar, settings)
  shared/      shared TypeScript types
tests/         vitest unit tests for request building/validation
```

## Running the AppImage

Requires FUSE 2 (`libfuse2` on Debian/Ubuntu):

```bash
sudo apt install libfuse2
./dist/milkman-0.1.0.AppImage
```

If you don't have FUSE (or can't install it), run with `--appimage-extract-and-run` instead:

```bash
./dist/milkman-0.1.0.AppImage --appimage-extract-and-run
```

## Troubleshooting

### SUID sandbox error on `npm run dev`

```
FATAL:sandbox/linux/suid/client/setuid_sandbox_host.cc:166] ... chrome-sandbox is owned by root and has mode 4755
```

The packaged AppImage doesn't have this problem; it only affects the `node_modules` copy used in dev. Fix it (run once after every `npm install`):

```bash
sudo chown root:root node_modules/electron/dist/chrome-sandbox
sudo chmod 4755 node_modules/electron/dist/chrome-sandbox
```

Or bypass the sandbox for local development:

```bash
npm run dev -- -- --no-sandbox
```