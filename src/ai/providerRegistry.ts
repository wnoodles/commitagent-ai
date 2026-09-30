import { ExtensionConfig, resolveProviderConfig } from '../config/configuration';
import { SecretStore } from '../config/secretStore';
import { UserError } from '../utils/errors';
import { AIProvider } from './types';
import { PROVIDER_PRESETS } from './providerPresets';
import { OpenAICompatibleProvider } from './openAICompatibleProvider';

export class ProviderRegistry {
  constructor(private readonly secretStore: SecretStore) {}

  async create(config: ExtensionConfig): Promise<AIProvider> {
    const providerConfig = resolveProviderConfig(config);
    const apiKey = await this.secretStore.getApiKey(config.provider);
    const preset = PROVIDER_PRESETS[config.provider];

    if (!apiKey && !preset.apiKeyOptional) {
      throw new UserError(`请先设置 ${preset.label} 的 API Key`);
    }

    if (config.provider === 'custom') {
      providerConfig.extraHeaders = await this.secretStore.getCustomHeaders();
    }
    return new OpenAICompatibleProvider(providerConfig, apiKey);
  }
}
