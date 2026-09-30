import * as vscode from 'vscode';
import { GitApi, GitRepository } from './gitApi';
import { UserError } from '../utils/errors';

function isWithin(repository: GitRepository, uri: vscode.Uri): boolean {
  const root = repository.rootUri.fsPath.toLowerCase();
  const file = uri.fsPath.toLowerCase();
  return file === root || file.startsWith(root.endsWith('/') || root.endsWith('\\') ? root : `${root}${require('path').sep}`);
}

export async function resolveRepository(api: GitApi): Promise<GitRepository> {
  const repositories = api.repositories;
  if (repositories.length === 0) {
    throw new UserError('当前工作区不是 Git 仓库');
  }
  if (repositories.length === 1) {
    return repositories[0];
  }

  const activeUri = vscode.window.activeTextEditor?.document.uri;
  if (activeUri) {
    const matches = repositories.filter(repository => isWithin(repository, activeUri));
    if (matches.length === 1) {
      return matches[0];
    }
  }

  const selected = await vscode.window.showQuickPick(
    repositories.map(repository => ({
      label: vscode.workspace.asRelativePath(repository.rootUri, false),
      description: repository.rootUri.fsPath,
      repository
    })),
    { placeHolder: '选择需要生成 Commit Message 的 Git 仓库' }
  );

  if (!selected) {
    throw new UserError('已取消选择 Git 仓库');
  }
  return selected.repository;
}
