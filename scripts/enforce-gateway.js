#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = 'src';
const exts = new Set(['.ts', '.tsx']);
let violations = [];

const allowedImports = ['@/server/api/gateway', '.functions'];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      if (path === join('src', 'server')) continue;
      walk(path);
      continue;
    }
    const ext = path.slice(path.lastIndexOf('.'));
    if (!exts.has(ext)) continue;
    const lines = readFileSync(path, 'utf8').split(/\r?\n/);
    lines.forEach((line, index) => {
      if (line.includes('@/server/') && !allowedImports.some((allowed) => line.includes(allowed))) {
        violations.push(`${path}:${index + 1} ${line}`);
      }
    });
  }
}

console.log('Checking forbidden imports...');
walk(root);
if (violations.length) {
  console.error('ARCHITECTURE VIOLATION DETECTED');
  console.error(violations.join('\n'));
  process.exit(1);
}
console.log('Gateway OS Clean');
