import * as path from 'path';
import { DiffMode } from '../config/configuration';
import { UserError } from '../utils/errors';
import { GitChange, GitRepository } from './gitApi';

export interface ChangedFile {
  path: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed' | 'untracked' | 'unknown';
  source: 'staged' | 'unstaged';
}

export interface RawChanges {
  source: 'staged' | 'unstaged' | 'all';
  diff: string;
  files: ChangedFile[];
  isEmpty: boolean;
}

const STATUS_NAMES: Record<number, ChangedFile['status']> = {
  0: 'modified',
  1: 'added',
  2: 'deleted',
  3: 'renamed',
  4: 'added',
  5: 'modified',
  6: 'deleted',
  7: 'untracked',
  8: 'unknown',
  9: 'added',
  10: 'renamed',
  11: 'modified'
};

function toChangedFiles(changes: GitChange[], root: string, source: ChangedFile['source']): ChangedFile[] {
  return changes.map(change => ({
    path: path.relative(root, change.renameUri?.fsPath ?? change.uri.fsPath).replace(/\\/g, '/'),
    status: STATUS_NAMES[change.status] ?? 'unknown',
    source
  }));
}

export async function collectChanges(repository: GitRepository, mode: DiffMode): Promise<RawChanges> {
  if (repository.state.mergeChanges.length > 0) {
    throw new UserError('请先解决 Git 冲突再生成提交信息');
  }

  const root = repository.rootUri.fsPath;
  const stagedFiles = toChangedFiles(repository.state.indexChanges, root, 'staged');
  const unstagedFiles = toChangedFiles(repository.state.workingTreeChanges, root, 'unstaged');
  const stagedDiff = stagedFiles.length > 0 ? await repository.diff(true) : '';

  if (mode === 'stagedOnly') {
    return {
      source: 'staged',
      diff: stagedDiff,
      files: stagedFiles,
      isEmpty: stagedFiles.length === 0 && !stagedDiff.trim()
    };
  }

  if (mode === 'stagedFirst' && (stagedFiles.length > 0 || stagedDiff.trim())) {
    return { source: 'staged', diff: stagedDiff, files: stagedFiles, isEmpty: false };
  }

  const unstagedDiff = unstagedFiles.length > 0 ? await repository.diff(false) : '';
  if (mode === 'allChanges') {
    const combined = [
      stagedDiff && '### STAGED CHANGES\n' + stagedDiff,
      unstagedDiff && '### UNSTAGED CHANGES\n' + unstagedDiff
    ].filter(Boolean).join('\n\n');
    return {
      source: 'all',
      diff: combined,
      files: [...stagedFiles, ...unstagedFiles],
      isEmpty: stagedFiles.length === 0 && unstagedFiles.length === 0 && !combined.trim()
    };
  }

  return {
    source: 'unstaged',
    diff: unstagedDiff,
    files: unstagedFiles,
    isEmpty: unstagedFiles.length === 0 && !unstagedDiff.trim()
  };
}
