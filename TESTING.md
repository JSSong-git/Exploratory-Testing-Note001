# Testing Guide

## Quick commands

| Command | When to run |
|---------|-------------|
| `npm test` | After any `lib/**` change (unit + component + integration) |
| `npm run test:affected` | After any file change (git diff based) |
| `npm run test:phase 1` | Phase-specific gate |
| `npm run build` | Before E2E |
| `npm run test:e2e:smoke` | After build / manifest / entrypoint changes |
| `npm run test:all` | Before PR / Phase completion |

## Change → test mapping

See `test/scripts/run-affected-tests.mjs` for glob → suite mapping.

## Regression scenarios (do not skip)

1. Storage: session JSON has no inline base64 (`test/unit/regression/storage-separation.test.ts`)
2. Storage quota: 12 screenshots + export (`test/e2e/regression/storage-quota.spec.ts`)
3. Title required on save (E2E `annotation-basic`, `screenshot-confirm`)
4. SaveDetailsDialog after full screenshot (`screenshot-confirm`)
5. Legacy JSON import (E2E `legacy-json-import`)
6. Markdown export (`export-markdown`)
7. Crop screenshot flow (`crop-screenshot`)
8. Report preview (`report-preview`)
9. Extension smoke load

## E2E notes

- Requires `npm run build` first (loads `.output/chrome-mv3`)
- Uses headed Chromium with unpacked extension
- Selectors use `data-testid` only
