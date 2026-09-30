import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeChatCompletionsUrl } from '../src/ai/providerPresets';

test('normalizes a base URL', () => {
  assert.equal(
    normalizeChatCompletionsUrl('https://api.example.com/v1/'),
    'https://api.example.com/v1/chat/completions'
  );
});

test('does not append the endpoint twice', () => {
  assert.equal(
    normalizeChatCompletionsUrl('https://api.example.com/v1/chat/completions'),
    'https://api.example.com/v1/chat/completions'
  );
});
