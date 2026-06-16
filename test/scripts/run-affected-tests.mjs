#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { execSync as exec } from 'node:child_process';

const MAPPING = [
  { pattern: /^lib\/core\//, cmds: ['npm run test:unit -- test/unit/core'] },
  { pattern: /^lib\/storage\//, cmds: ['npm run test:unit -- test/unit/storage'] },
  { pattern: /^lib\/export\//, cmds: ['npm run test:unit -- test/unit/export'] },
  { pattern: /^entrypoints\/popup\//, cmds: ['npm run test:component'] },
  { pattern: /^lib\/background\//, cmds: ['npm run test:integration'] },
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
