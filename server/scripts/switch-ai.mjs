#!/usr/bin/env node
/**
 * Switch which AI provider the server uses for analysis (site audit checks and
 * fix drafts, topic/prompt/competitor suggestions).
 *
 *   npm run ai            → show the current provider and which keys are set
 *   npm run ai:google     → Gemini  (needs GOOGLE_GENERATIVE_AI_API_KEY)
 *   npm run ai:openai     → OpenAI  (needs OPENAI_API_KEY)
 *
 * Rewrites the *_MODEL lines in server/.env and nudges nodemon to restart, so
 * a running `npm run dev` picks the change up within a few seconds. Prompt
 * tracking is not affected: it always uses each engine's own SDK.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath = path.join(root, '.env');

const PRESETS = {
  google: { model: 'google/gemini-3-flash-preview', key: 'GOOGLE_GENERATIVE_AI_API_KEY' },
  openai: { model: 'openai/gpt-5-mini', key: 'OPENAI_API_KEY' },
};
const MODEL_VARS = [
  'AUDIT_LLM_MODEL',
  'DEFAULT_SUGGESTION_MODEL',
  'TOPIC_SUGGESTION_MODEL',
  'PROMPT_SUGGESTION_MODEL',
  'COMPETITOR_SUGGESTION_MODEL',
];

if (!fs.existsSync(envPath)) {
  console.error('server/.env not found. Run ./start-local.sh once first.');
  process.exit(1);
}
let env = fs.readFileSync(envPath, 'utf8');
const get = (name) => (env.match(new RegExp(`^${name}=(.*)$`, 'm'))?.[1] ?? '').trim();

const target = process.argv[2];
if (!target || target === 'status') {
  const current = get('AUDIT_LLM_MODEL') || '(default: google/gemini-3-flash-preview)';
  console.log(`Current analysis model: ${current}`);
  for (const [name, p] of Object.entries(PRESETS)) {
    console.log(`  ${name.padEnd(7)} ${p.model.padEnd(32)} key ${get(p.key) ? 'set' : 'MISSING'} (${p.key})`);
  }
  console.log('Switch with: npm run ai:google  or  npm run ai:openai');
  process.exit(0);
}

const preset = PRESETS[target];
if (!preset) {
  console.error(`Unknown provider "${target}". Use one of: ${Object.keys(PRESETS).join(', ')}`);
  process.exit(1);
}
if (!get(preset.key)) {
  console.error(`${preset.key} is empty in server/.env. Add the key first, then run this again.`);
  process.exit(1);
}

for (const name of MODEL_VARS) {
  const line = `${name}=${preset.model}`;
  env = new RegExp(`^${name}=.*$`, 'm').test(env) ? env.replace(new RegExp(`^${name}=.*$`, 'm'), line) : `${env.trimEnd()}\n${line}\n`;
}
fs.writeFileSync(envPath, env);

// nodemon watches src/, not .env: touch the entry file so a running dev server restarts.
const entry = path.join(root, 'src', 'server.js');
const now = new Date();
fs.utimesSync(entry, now, now);

console.log(`Switched analysis to ${target} (${preset.model}). A running dev server restarts in a few seconds.`);
