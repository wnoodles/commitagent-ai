import * as vscode from 'vscode';
import { ProviderConfig, ProviderId } from '../ai/types';
import { PROVIDER_PRESETS } from '../ai/providerPresets';

export type DiffMode = 'stagedFirst' | 'stagedOnly' | 'allChanges';

export interface ExtensionConfig {
  provider: ProviderId;
  baseUrl: string;
  model: string;
  diffMode: DiffMode;
  rulesFile: string;
  language: string;
  temperature: number;
  maxDiffChars: number;
  maxFileDiffChars: number;
  requestTimeoutMs: number;
  excludePatterns: string[];
  redactSensitiveContent: boolean;
}

export function getExtensionConfig(resource?: vscode.Uri): ExtensionConfig {
  const config = vscode.workspace.getConfiguration('commitAgent', resource);
  return {
    provider: config.get<ProviderId>('provider', 'deepseek'),
    baseUrl: config.get<string>('baseUrl', '').trim(),
    model: config.get<string>('model', '').trim(),
    diffMode: config.get<DiffMode>('diffMode', 'stagedFirst'),
    rulesFile: config.get<string>('rulesFile', '.commitagent-rules/commit-style.md'),
    language: config.get<string>('language', 'zh-CN'),
    temperature: config.get<number>('temperature', 0.2),
    maxDiffChars: config.get<number>('maxDiffChars', 60000),
    maxFileDiffChars: config.get<number>('maxFileDiffChars', 12000),
    requestTimeoutMs: config.get<number>('requestTimeoutMs', 60000),
    excludePatterns: config.get<string[]>('excludePatterns', []),
    redactSensitiveContent: config.get<boolean>('redactSensitiveContent', true)
  };
}

export function resolveProviderConfig(config: ExtensionConfig): ProviderConfig {
  const preset = PROVIDER_PRESETS[config.provider];
  const baseUrl = config.baseUrl || preset.defaultBaseUrl;
  const model = config.model || preset.defaultModel;
  if (!model) {
    throw new Error('请先在 CommitAgent 设置中填写模型名称');
  }
  return {
    provider: config.provider,
    baseUrl,
    model,
    temperature: config.temperature,
    timeoutMs: config.requestTimeoutMs
  };
}
