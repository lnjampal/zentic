import { describe, it, expect } from 'vitest';
import { getLanguageName, LANGUAGE_NAMES } from './languages.js';

describe('languages', () => {
  it('should return correct language names', () => {
    expect(getLanguageName('en')).toBe('English');
    expect(getLanguageName('de')).toBe('German');
  });

  it('should default to English for unknown codes', () => {
    expect(getLanguageName('xyz')).toBe('English');
  });

  it('should have language names configuration object', () => {
    expect(LANGUAGE_NAMES).toBeDefined();
    expect(LANGUAGE_NAMES.en).toBe('English');
  });
});
