import test from 'node:test';
import assert from 'node:assert/strict';
import { detectScopes } from '../src/analysis/scopeDetector';
import { detectTypeHints } from '../src/analysis/typeHints';

test('detects a business scope from generic directories', () => {
  assert.deepEqual(
    detectScopes(['src/views/quote/edit.vue', 'src/api/quote.ts']),
    ['quote']
  );
});

test('detects documentation-only changes', () => {
  assert.deepEqual(detectTypeHints(['README.md', 'docs/install.md']), ['docs']);
});
