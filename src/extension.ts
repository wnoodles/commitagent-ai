import * as vscode from 'vscode';
import { ProviderRegistry } from './ai/providerRegistry';
import { selectProvider, setApiKey, setCustomHeaders } from './commands/configureProviderCommand';
import { generateCommitMessage } from './commands/generateCommitCommand';
import { testConnection } from './commands/testConnectionCommand';
import { SecretStore } from './config/secretStore';
import { getGitApi } from './git/gitApi';
import { Logger } from './utils/logger';
import { toUserMessage } from './utils/errors';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const logger = new Logger();
  const secretStore = new SecretStore(context.secrets);
  const registry = new ProviderRegistry(secretStore);
  context.subscriptions.push(logger);

  const runSafely = (task: () => Promise<void>) => async () => {
    try {
      await task();
    } catch (error) {
      logger.error('操作失败', error);
      const action = await vscode.window.showErrorMessage(`CommitAgent：${toUserMessage(error)}`, '查看日志');
      if (action === '查看日志') logger.show();
    }
  };

  const generate = async () => {
    const gitApi = await getGitApi();
    await generateCommitMessage({ gitApi, registry, logger });
  };

  context.subscriptions.push(
    vscode.commands.registerCommand('commitAgent.generate', runSafely(generate)),
    vscode.commands.registerCommand('commitAgent.regenerate', runSafely(generate)),
    vscode.commands.registerCommand('commitAgent.selectProvider', runSafely(selectProvider)),
    vscode.commands.registerCommand('commitAgent.setApiKey', runSafely(() => setApiKey(secretStore))),
    vscode.commands.registerCommand('commitAgent.setCustomHeaders', runSafely(() => setCustomHeaders(secretStore))),
    vscode.commands.registerCommand('commitAgent.testConnection', runSafely(() => testConnection(registry))),
    vscode.commands.registerCommand('commitAgent.openSettings', () =>
      vscode.commands.executeCommand('workbench.action.openSettings', '@ext:commitagent.commitagent-ai')
    )
  );

  logger.info('CommitAgent AI 已激活');
}

export function deactivate(): void {
  // Disposables are managed by VS Code.
}
