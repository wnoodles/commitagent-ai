import * as vscode from 'vscode';
import { ProviderId } from '../ai/types';

export class SecretStore {
  constructor(private readonly secrets: vscode.SecretStorage) {}

  private apiKeyName(provider: ProviderId): string {
    return `commitAgent.apiKey.${provider}`;
  }

  async getApiKey(provider: ProviderId): Promise<string | undefined> {
    return this.secrets.get(this.apiKeyName(provider));
  }

  async setApiKey(provider: ProviderId, apiKey: string): Promise<void> {
    const value = apiKey.trim();
    if (!value) {
      await this.secrets.delete(this.apiKeyName(provider));
      return;
    }
    await this.secrets.store(this.apiKeyName(provider), value);
  }

  async getCustomHeaders(): Promise<Record<string, string> | undefined> {
    const raw = await this.secrets.get('commitAgent.secretHeaders.custom');
    if (!raw) {
      return undefined;
    }
    try {
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, string>;
      }
    } catch {
      // Invalid historical value is ignored instead of exposing it.
    }
    return undefined;
  }

  async setCustomHeaders(headers: Record<string, string> | undefined): Promise<void> {
    if (!headers || Object.keys(headers).length === 0) {
      await this.secrets.delete('commitAgent.secretHeaders.custom');
      return;
    }
    await this.secrets.store('commitAgent.secretHeaders.custom', JSON.stringify(headers));
  }
}
