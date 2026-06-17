#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { execSync as exec } from 'node:child_process';

const MAPPING = [
  { pattern: /^lib\/core\//, cmds: ['npm run test:unit -- test/unit/core'] },
  { pattern: /^lib\/storage\//, cmds: ['npm run test:unit -- test/unit/storage', 'npm run test:e2e:regression -- test/e2e/regression/storage-quota.spec.ts'] },
  { pattern: /^lib\/export\//, cmds: ['npm run test:unit -- test/unit/export', 'npm run test:e2e -- test/e2e/features/export-markdown.spec.ts'] },
  { pattern: /^lib\/editor\//, cmds: ['npm run test:unit -- test/unit/editor'] },
  { pattern: /^lib\/messaging\//, cmds: ['npm run test:integration'] },
  { pattern: /^lib\/background\//, cmds: ['npm run test:integration', 'npm run test:e2e:smoke'] },
  { pattern: /^lib\/background\/handlers\//, cmds: ['npm run test:integration'] },
  { pattern: /^entrypoints\/popup\//, cmds: ['npm run test:component', 'npm run test:e2e -- test/e2e/features/annotation-basic.spec.ts'] },
  { pattern: /^entrypoints\/content\.ts$/, cmds: ['npm run build', 'npm run test:e2e -- test/e2e/features/crop-screenshot.spec.ts'] },
  { pattern: /^entrypoints\/annotation-editor\//, cmds: ['npm run test:e2e -- test/e2e/features/crop-screenshot.spec.ts'] },
  { pattern: /^entrypoints\/save-details\//, cmds: ['npm run test:component', 'npm run test:e2e -- test/e2e/features/crop-screenshot.spec.ts'] },
  { pattern: /^entrypoints\/report\//, cmds: ['npm run test:e2e -- test/e2e/features/report-preview.spec.ts'] },
  { pattern: /^components\/SaveDetailsDialog\.tsx$/, cmds: ['npm run test:component'] },
  { pattern: /^wxt\.config\.ts$/, cmds: ['npm run build', 'npm run test:e2e:smoke'] },
];

function getChangedFiles() {
  try {
    const out = execSync('git diff --name-only HEAD', { encoding: 'utf8' });
    return out.split('\n').map((l) => l.trim()).filter(Boolean);
  } catch {
    return ['wxt.config.ts'];
  }
}

const files = getChangedFiles();
const commands = new Set(['npm run test:unit']);

for (const file of files) {
  for (const rule of MAPPING) {
    if (rule.pattern.test(file)) {
      rule.cmds.forEach((c) => commands.add(c));
    }
  }
}

for (const cmd of commands) {
  console.log(`> ${cmd}`);
  exec(cmd, { stdio: 'inherit' });
}
