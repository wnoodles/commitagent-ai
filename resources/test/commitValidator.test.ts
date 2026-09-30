import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCommitResponse } from '../src/commit/commitValidator';

test('parses fenced JSON and renders a conventional commit', () => {
  const result = parseCommitResponse(`\`\`\`json
  {
    "type": "feat",
    "scope": "quote",
    "subject": "添加报价毛利率校验。",
    "body": ["降低异常报价进入后续流程的风险。"]
  }
  \`\`\``);

  assert.equal(
    result.message,
    '✨ feat(quote): 添加报价毛利率校验\n\n- 降低异常报价进入后续流程的风险'
  );
});

test('rejects unsupported types', () => {
  assert.throws(
    () => parseCommitResponse('{"type":"unknown","subject":"更新内容","scope":"","body":[]}'),
    /不支持的 Commit 类型/
  );
});

test('limits the first line to 72 characters', () => {
  const result = parseCommitResponse(JSON.stringify({
    type: 'fix', scope: 'very-long-module', subject: '修复'.repeat(80), body: []
  }));
  assert.ok([...result.message.split('\n')[0]].length <= 72);
});

test('respects a safe project-formatted message from the model', () => {
  const result = parseCommitResponse(JSON.stringify({
    type: 'docs', scope: '', subject: '更新说明', body: [], message: '📝 docs: 更新项目安装说明'
  }));
  assert.equal(result.message, '📝 docs: 更新项目安装说明');
});
