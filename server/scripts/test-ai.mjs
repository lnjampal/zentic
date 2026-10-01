#!/usr/bin/env node
/**
 * Check that each configured AI key works: sends a one-line prompt to every
 * provider that has a key in server/.env and prints OK or the error.
 *
 *   npm run ai:test
 */
import 'dotenv/config';
import { generateText } from 'ai';
import { resolveModel } from '../src/lib/ai-provider.js';

const CHECKS = [
  { name: 'google', key: 'GOOGLE_GENERATIVE_AI_API_KEY', model: 'google/gemini-3-flash-preview' },
  { name: 'openai', key: 'OPENAI_API_KEY', model: 'openai/gpt-5-mini' },
  { name: 'anthropic', key: 'ANTHROPIC_API_KEY', model: 'anthropic/claude-haiku-4-5' },
];

console.log(`Analysis model in use: ${process.env.AUDIT_LLM_MODEL || '(default)'}`);
for (const c of CHECKS) {
  if (!process.env[c.key]) {
    console.log(`  ${c.name.padEnd(9)} skipped (no ${c.key})`);
    continue;
  }
  const started = Date.now();
  try {
    const { text } = await generateText({ model: resolveModel(c.model), prompt: 'Reply with the single word OK.' });
    console.log(`  ${c.name.padEnd(9)} OK in ${Date.now() - started} ms (${c.model}) → ${text.trim().slice(0, 20)}`);
  } catch (err) {
    console.log(`  ${c.name.padEnd(9)} FAILED (${c.model}): ${err.message.split('\n')[0].slice(0, 200)}`);
  }
}
