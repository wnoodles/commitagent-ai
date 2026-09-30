import * as vscode from 'vscode';
import { getExtensionConfig } from '../config/configuration';
import { ProviderRegistry } from '../ai/providerRegistry';
import { PROVIDER_PRESETS } from '../ai/providerPresets';

export async function testConnection(registry: ProviderRegistry): Promise<void> {
  const config = getExtensionConfig();
  const provider = await registry.create(config);
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `正在测试 ${PROVIDER_PRESETS[config.provider].label} 连接…`,
      cancellable: true
    },
    async (_progress, token) => {
      const controller = new AbortController();
      token.onCancellationRequested(() => controller.abort());
      await provider.testConnection(controller.signal);
    }
  );
  void vscode.window.showInformationMessage(`${PROVIDER_PRESETS[config.provider].label} 连接成功`);
}
