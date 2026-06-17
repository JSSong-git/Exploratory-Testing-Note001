# Exploratory Testing Chrome Extension

Greenfield WXT + TypeScript + React rebuild for exploratory testing sessions.

## Scripts

- `npm run dev` — development with HMR
- `npm run build` — production build to `.output/`
- `npm test` — Vitest unit/integration/component tests
- `npm run test:e2e:smoke` — Playwright smoke (requires build first)
- `npm run test:affected` — run tests mapped to changed files
- `npm run test:all` — unit + component + integration + smoke + feature + regression E2E

## Load in Chrome

1. `npm run build`
2. Open `chrome://extensions`
3. Enable Developer mode → Load unpacked → `.output/chrome-mv3`
