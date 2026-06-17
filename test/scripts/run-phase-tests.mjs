#!/usr/bin/env node
import { execSync } from 'node:child_process';

const phase = process.argv[2] ?? '0';
const PHASE_COMMANDS = {
  '0': ['npm run build', 'npm run test:e2e:smoke'],
  '1': ['npm run test:unit -- test/unit/core', 'npm run test:unit -- test/unit/storage', 'npm run test:e2e:regression -- test/e2e/regression/storage-quota.spec.ts'],
  '2': ['npm run test:integration', 'npm run test:e2e:smoke'],
  '3': ['npm run test:component', 'npm run test:e2e -- test/e2e/features/annotation-basic.spec.ts'],
  '4': [
    'npm run test:e2e -- test/e2e/features/crop-screenshot.spec.ts',
    'npm run test:e2e -- test/e2e/features/screenshot-confirm.spec.ts',
  ],
  '5': [
    'npm run test:unit -- test/unit/export',
    'npm run test:e2e -- test/e2e/features/export-markdown.spec.ts',
    'npm run test:e2e:regression -- test/e2e/regression/legacy-json-import.spec.ts',
  ],
  '6': ['npm run test:e2e -- test/e2e/features/report-preview.spec.ts'],
  '7': ['npm run test:all'],
};

const cmds = PHASE_COMMANDS[phase] ?? ['npm run test'];
for (const cmd of cmds) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
}
