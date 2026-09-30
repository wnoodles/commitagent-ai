import * as vscode from 'vscode';
import { PROVIDER_PRESETS } from '../ai/providerPresets';
import { ProviderId } from '../ai/types';
import { getExtensionConfig } from '../config/configuration';
import { SecretStore } from '../config/secretStore';
import { UserError } from '../utils/errors';

export async function selectProvider(): Promise<void> {
  const current = getExtensionConfig().provider;
  const selected = await vscode.window.showQuickPick(
    Object.values(PROVIDER_PRESETS).map(preset => ({
      label: preset.label,
      description: preset.id === current ? '当前使用' : preset.defaultBaseUrl,
      id: preset.id
    })),
    { placeHolder: '选择 CommitAgent 使用的 AI Provider' }
  );
  if (!selected) return;

  await vscode.workspace.getConfiguration('commitAgent').update(
    'provider', selected.id, vscode.ConfigurationTarget.Global
  );

  if (selected.id === 'custom') {
    await configureCustomEndpoint();
  }
  void vscode.window.showInformationMessage(`CommitAgent 已切换到 ${selected.label}`);
}

export async function configureCustomEndpoint(): Promise<void> {
  const config = getExtensionConfig();
  const baseUrl = await vscode.window.showInputBox({
    title: 'Custom API Base URL',
    prompt: '填写 OpenAI-compatible API 地址，可包含 /v1，但不要重复填写 /chat/completions',
    value: config.baseUrl || PROVIDER_PRESETS.custom.defaultBaseUrl,
    ignoreFocusOut: true,
    validateInput: value => /^https?:\/\//i.test(value.trim()) ? undefined : '请输入 http:// 或 https:// 地址'
  });
  if (!baseUrl) throw new UserError('已取消 Custom Provider 配置');

  const model = await vscode.window.showInputBox({
    title: 'Custom Model',
    prompt: '填写服务端支持的模型名称',
    value: config.model,
    ignoreFocusOut: true,
    validateInput: value => value.trim() ? undefined : '模型名称不能为空'
  });
  if (!model) throw new UserError('已取消 Custom Provider 配置');

  const settings = vscode.workspace.getConfiguration('commitAgent');
  await settings.update('baseUrl', baseUrl.trim(), vscode.ConfigurationTarget.Global);
  await settings.update('model', model.trim(), vscode.ConfigurationTarget.Global);
}

export async function setApiKey(secretStore: SecretStore): Promise<void> {
  const provider = getExtensionConfig().provider;
  const preset = PROVIDER_PRESETS[provider];
  const value = await vscode.window.showInputBox({
    title: `${preset.label} API Key`,
    prompt: preset.apiKeyOptional
      ? '输入 API Key；本地服务不需要密钥时可留空并按 Enter'
      : 'API Key 将安全保存在 VS Code SecretStorage 中',
    password: true,
    ignoreFocusOut: true
  });
  if (value === undefined) return;
  await secretStore.setApiKey(provider as ProviderId, value);
  void vscode.window.showInformationMessage(value.trim() ? `${preset.label} API Key 已保存` : `${preset.label} API Key 已清除`);
}

export async function setCustomHeaders(secretStore: SecretStore): Promise<void> {
  const value = await vscode.window.showInputBox({
    title: 'Custom Provider 请求头',
    prompt: '填写 JSON 对象；留空并按 Enter 可清除。内容保存在 SecretStorage 中',
    placeHolder: '{"X-API-Key":"..."}',
    password: true,
    ignoreFocusOut: true,
    validateInput: input => {
      if (!input.trim()) return undefined;
      try {
        const parsed: unknown = JSON.parse(input);
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? undefined : '必须是 JSON 对象';
      } catch {
        return 'JSON 格式不正确';
      }
    }
  });
  if (value === undefined) return;
  const headers = value.trim() ? JSON.parse(value) as Record<string, string> : undefined;
  await secretStore.setCustomHeaders(headers);
  void vscode.window.showInformationMessage(headers ? 'Custom Provider 请求头已保存' : 'Custom Provider 请求头已清除');
}
