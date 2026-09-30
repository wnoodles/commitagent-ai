import * as vscode from 'vscode';

export interface GitChange {
  uri: vscode.Uri;
  originalUri?: vscode.Uri;
  renameUri?: vscode.Uri;
  status: number;
}

export interface GitRepositoryState {
  indexChanges: GitChange[];
  workingTreeChanges: GitChange[];
  mergeChanges: GitChange[];
}

export interface GitRepository {
  rootUri: vscode.Uri;
  inputBox: { value: string };
  state: GitRepositoryState;
  diff(cached?: boolean): Promise<string>;
}

export interface GitApi {
  repositories: GitRepository[];
  onDidOpenRepository: vscode.Event<GitRepository>;
}

interface GitExtensionExports {
  enabled: boolean;
  getAPI(version: 1): GitApi;
}

export async function getGitApi(): Promise<GitApi> {
  const extension = vscode.extensions.getExtension<GitExtensionExports>('vscode.git');
  if (!extension) {
    throw new Error('VS Code 内置 Git 扩展不可用');
  }
  const exports = extension.isActive ? extension.exports : await extension.activate();
  if (!exports.enabled) {
    throw new Error('VS Code Git 扩展已被禁用');
  }
  return exports.getAPI(1);
}
