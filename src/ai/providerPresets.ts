import { ProviderId } from './types';

export interface ProviderPreset {
  id: ProviderId;
  label: string;
  defaultBaseUrl: string;
  defaultModel: string;
  apiKeyOptional?: boolean;
}

export const PROVIDER_PRESETS: Record<ProviderId, ProviderPreset> = {
  deepseek: {
    id: 'deepseek',
    label: 'DeepSeek',
    defaultBaseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-flash'
  },
  kimi: {
    id: 'kimi',
    label: 'Kimi / Moonshot',
    defaultBaseUrl: 'https://api.moonshot.cn/v1',
    defaultModel: 'kimi-k2.5'
  },
  openai: {
    id: 'openai',
    label: 'OpenAI',
    defaultBaseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-5-mini'
  },
  custom: {
    id: 'custom',
    label: 'Custom OpenAI-compatible',
    defaultBaseUrl: 'http://localhost:11434/v1',
    defaultModel: '',
    apiKeyOptional: true
  }
};

export function normalizeChatCompletionsUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/+$/, '');
  if (!trimmed) {
    throw new Error('Base URL 不能为空');
  }
  if (/\/chat\/completions$/i.test(trimmed)) {
    return trimmed;
  }
  return `${trimmed}/chat/completions`;
}
