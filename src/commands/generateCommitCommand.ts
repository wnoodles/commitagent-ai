import * as vscode from 'vscode';
import { ProviderRegistry } from '../ai/providerRegistry';
import { buildPrompt } from '../ai/promptBuilder';
import { analyzeChanges } from '../analysis/changeAnalyzer';
import { parseCommitResponse } from '../commit/commitValidator';
import { getExtensionConfig } from '../config/configuration';
import { collectChanges } from '../git/changeCollector';
import { sanitizeChanges } from '../git/diffSanitizer';
import { GitApi } from '../git/gitApi';
import { resolveRepository } from '../git/repositoryResolver';
import { loadCommitRules } from '../rules/rulesLoader';
import { UserError } from '../utils/errors';
import { Logger } from '../utils/logger';

export interface GenerateDependencies {
  gitApi: GitApi;
  registry: ProviderRegistry;
  logger: Logger;
}

export async function generateCommitMessage(deps: GenerateDependencies): Promise<void> {
  const repository = await resolveRepository(deps.gitApi);
  const originalMessage = repository.inputBox.value;
  const config = getExtensionConfig(repository.rootUri);

  try {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'CommitAgent 正在分析 Git 修改…',
        cancellable: true
      },
      async (progress, token) => {
      const controller = new AbortController();
      token.onCancellationRequested(() => controller.abort());

      const raw = await collectChanges(repository, config.diffMode);
      if (raw.isEmpty) {
        throw new UserError('当前仓库没有可生成 Commit 的修改');
      }

      const sanitized = sanitizeChanges(raw, {
        maxDiffChars: config.maxDiffChars,
        maxFileDiffChars: config.maxFileDiffChars,
        excludePatterns: config.excludePatterns,
        redactSensitiveContent: config.redactSensitiveContent
      });
      const rules = await loadCommitRules(repository.rootUri, config.rulesFile);
      const summary = analyzeChanges(sanitized);

      deps.logger.info(`分析 ${summary.files.length} 个文件，来源：${summary.source}，规范：${rules.source}`);
      if (summary.redacted) deps.logger.info('发送前已过滤敏感内容');
      if (summary.truncated) deps.logger.info('发送前已截断过大的 diff');

      progress.report({ message: '正在调用 AI 生成提交信息…' });
      const provider = await deps.registry.create(config);
      const prompt = buildPrompt({
        rules: rules.content,
        summary,
        diff: sanitized.diff,
        language: config.language
      });
      const response = await provider.generate(prompt, controller.signal);
      const commit = parseCommitResponse(response.content);

      if (token.isCancellationRequested) {
        throw new UserError('已取消生成');
      }
      repository.inputBox.value = commit.message;
      deps.logger.info(`已使用 ${response.provider}/${response.model} 生成 Commit Message`);
        void vscode.window.showInformationMessage('Commit Message 已写入 Source Control，请确认后提交');
      }
    );
  } catch (error) {
    // Only successful validation can change the input box.
    repository.inputBox.value = originalMessage;
    throw error;
  }
}
