import { CommitType } from '../analysis/typeHints';

export const COMMIT_TYPES: CommitType[] = [
  'feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build',
  'ci', 'chore', 'revert', 'init', 'release'
];

export interface CommitResult {
  type: CommitType;
  scope: string;
  subject: string;
  body: string[];
  message: string;
}

export const TYPE_EMOJI: Record<CommitType, string> = {
  feat: '✨', fix: '🐛', docs: '📝', style: '🎨', refactor: '♻️',
  perf: '⚡️', test: '✅', build: '🛠', ci: '⚙️', chore: '🔧',
  revert: '⏪', init: '🎉', release: '🚀'
};
