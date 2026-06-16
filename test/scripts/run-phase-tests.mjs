#!/usr/bin/env node
import { execSync } from 'node:child_process';

const phase = process.argv[2] ?? '0';
const PHASE_COMMANDS = {
  '0': ['npm run build', 'npm run test:e2e:smoke'],
  '1': ['npm run test:unit'],
  '2': ['npm run test:integration', 'npm run test:e2e:smoke'],
  '3': ['npm run test:component'],
  '5': ['npm run test:unit -- test/unit/export'],
};

const cmds = PHASE_COMMANDS[phase] ?? ['npm run test'];
for (const cmd of cmds) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
}
