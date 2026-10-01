import { readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
for (const dir of ['src/components/ui', 'src/hooks']) {
  for (const file of readdirSync(resolve(root, dir)).filter(f => f.endsWith('.tsx'))) {
    const source = readFileSync(resolve(root, dir, file), 'utf8');
    assert.match(source, /^\s*["']use client["'];?/, `${dir}/${file} must declare its client boundary`);
  }
}
for (const file of ['src/generated/tokens.tsx', 'src/lib/utils.tsx',
  'src/lib/button-variants.tsx', 'src/lib/badge-variants.tsx', 'src/lib/toggle-variants.tsx']) {
  const source = readFileSync(resolve(root, file), 'utf8');
  assert.doesNotMatch(source, /["']use client["']/, `${file} must stay server-safe`);
  assert.doesNotMatch(source, /\b(?:window|document)\s*\./, `${file} cannot access browser globals`);
}
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
assert.ok(pkg.peerDependencies.react && pkg.peerDependencies['react-dom']);
for (const subpath of ['.', './tokens', './components/*', './hooks/*', './lib/*']) {
  assert.ok(pkg.exports[subpath].types, `${subpath} needs a typed export`);
}
assert.ok(pkg.sideEffects.includes('**/*.css'), 'Theme CSS must not be tree-shaken');
console.log('Client boundaries, server-safe utilities, typed exports, and CSS retention passed.');