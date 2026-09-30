import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeChanges } from '../src/git/diffSanitizer';

test('omits sensitive files and redacts tokens', () => {
  const result = sanitizeChanges({
    source: 'staged',
    isEmpty: false,
    files: [
      { path: '.env', status: 'modified', source: 'staged' },
      { path: 'src/api.ts', status: 'modified', source: 'staged' }
    ],
    diff: [
      'diff --git a/.env b/.env',
      '--- a/.env',
      '+++ b/.env',
      '+PASSWORD=super-secret-value',
      'diff --git a/src/api.ts b/src/api.ts',
      '--- a/src/api.ts',
      '+++ b/src/api.ts',
      '+const token = "sk-1234567890abcdefghijkl";'
    ].join('\n')
  }, {
    maxDiffChars: 60000,
    maxFileDiffChars: 12000,
    excludePatterns: [],
    redactSensitiveContent: true
  });

  assert.match(result.diff, /sensitive file/);
  assert.doesNotMatch(result.diff, /super-secret-value/);
  assert.doesNotMatch(result.diff, /sk-1234567890abcdefghijkl/);
  assert.equal(result.redacted, true);
});

test('omits lockfile bodies', () => {
  const result = sanitizeChanges({
    source: 'staged',
    isEmpty: false,
    files: [{ path: 'package-lock.json', status: 'modified', source: 'staged' }],
    diff: 'diff --git a/package-lock.json b/package-lock.json\n+large lock data'
  }, {
    maxDiffChars: 60000,
    maxFileDiffChars: 12000,
    excludePatterns: [],
    redactSensitiveContent: true
  });
  assert.match(result.diff, /excluded file/);
  assert.doesNotMatch(result.diff, /large lock data/);
});
