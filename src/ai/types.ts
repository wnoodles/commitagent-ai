export type ProviderId = 'deepseek' | 'kimi' | 'openai' | 'custom';

export interface ProviderConfig {
  provider: ProviderId;
  baseUrl: string;
  model: string;
  temperature: number;
  timeoutMs: number;
  extraHeaders?: Record<string, string>;
}

export interface GenerateRequest {
  systemPrompt: string;
  userPrompt: string;
}

export interface AIResult {
  content: string;
  provider: ProviderId;
  model: string;
}

export interface AIProvider {
  generate(request: GenerateRequest, signal?: AbortSignal): Promise<AIResult>;
  testConnection(signal?: AbortSignal): Promise<void>;
}
