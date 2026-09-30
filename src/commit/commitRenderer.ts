import { CommitResult, TYPE_EMOJI } from './commitSchema';

function cleanSubject(subject: string): string {
  return subject.trim().replace(/[。.!！；;]+$/u, '');
}

export function renderCommit(result: Omit<CommitResult, 'message'>): string {
  const scope = result.scope.trim().replace(/[^\p{L}\p{N}_.\-/]/gu, '-').replace(/^-+|-+$/g, '');
  const prefix = `${TYPE_EMOJI[result.type]} ${result.type}${scope ? `(${scope})` : ''}: `;
  let subject = cleanSubject(result.subject);
  const available = Math.max(1, 72 - [...prefix].length);
  if ([...subject].length > available) {
    subject = [...subject].slice(0, available).join('').replace(/[，、,:：\s-]+$/u, '');
  }
  const firstLine = prefix + subject;
  const body = result.body
    .map(item => item.trim().replace(/^[-*]\s*/, '').replace(/[。]+$/u, ''))
    .filter(Boolean)
    .slice(0, 4);
  return body.length > 0 ? `${firstLine}\n\n${body.map(item => `- ${item}`).join('\n')}` : firstLine;
}
