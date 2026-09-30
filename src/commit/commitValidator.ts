import { COMMIT_TYPES, CommitResult } from './commitSchema';
import { CommitType } from '../analysis/typeHints';
import { renderCommit } from './commitRenderer';
import { UserError } from '../utils/errors';

function stripFence(text: string): string {
  return text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
}

function extractJson(text: string): string {
  const clean = stripFence(text);
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  if (start < 0 || end <= start) {
    throw new UserError('模型没有返回有效的 JSON Commit 信息');
  }
  return clean.slice(start, end + 1);
}

function validatedModelMessage(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const message = stripFence(value).replace(/\r\n/g, '\n').trim();
  if (!message || message.includes('```') || /^diff --git /m.test(message)) return undefined;
  if (/^\+(?!\s)/m.test(message) || /^-(?!\s)/m.test(message)) return undefined;
  const firstLine = message.split('\n')[0];
  if ([...firstLine].length > 72 || /[。.!！；;]$/u.test(firstLine)) return undefined;
  return message;
}

export function parseCommitResponse(content: string): CommitResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJson(content));
  } catch (error) {
    if (error instanceof UserError) throw error;
    throw new UserError('模型返回的 Commit JSON 无法解析');
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new UserError('模型返回的 Commit 数据无效');
  }
  const value = parsed as Record<string, unknown>;
  const type = String(value.type ?? '').toLowerCase() as CommitType;
  if (!COMMIT_TYPES.includes(type)) {
    throw new UserError(`模型返回了不支持的 Commit 类型：${String(value.type ?? '')}`);
  }
  const subject = String(value.subject ?? '').trim();
  if (!subject) {
    throw new UserError('模型返回的 Commit subject 为空');
  }
  const scope = String(value.scope ?? '').trim();
  const body = Array.isArray(value.body) ? value.body.map(String) : [];
  const message = validatedModelMessage(value.message) ?? renderCommit({ type, scope, subject, body });
  if (/^```|```$/.test(message) || /^[-+]\d+/m.test(message)) {
    throw new UserError('生成内容包含不允许的代码块或 diff 行号');
  }
  return { type, scope, subject, body, message };
}
