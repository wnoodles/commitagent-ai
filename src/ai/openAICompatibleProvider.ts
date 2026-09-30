import { AIProvider, AIResult, GenerateRequest, ProviderConfig } from './types';
import { normalizeChatCompletionsUrl } from './providerPresets';
import { UserError } from '../utils/errors';

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
  error?: { message?: string };
}

export class OpenAICompatibleProvider implements AIProvider {
  constructor(
    private readonly config: ProviderConfig,
    private readonly apiKey?: string
  ) {}

  async generate(request: GenerateRequest, signal?: AbortSignal): Promise<AIResult> {
    const content = await this.request([
      { role: 'system', content: request.systemPrompt },
      { role: 'user', content: request.userPrompt }
    ], signal);

    return {
      content,
      provider: this.config.provider,
      model: this.config.model
    };
  }

  async testConnection(signal?: AbortSignal): Promise<void> {
    await this.request(
      [
        { role: 'system', content: 'You are a connection test.' },
        { role: 'user', content: 'Reply with OK only.' }
      ],
      signal
    );
  }

  private async request(
    messages: Array<{ role: string; content: string }>,
    externalSignal: AbortSignal | undefined
  ): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);
    const abortListener = () => controller.abort();
    externalSignal?.addEventListener('abort', abortListener, { once: true });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.config.extraHeaders
    };
    if (this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`;
    }

    try {
      const response = await fetch(normalizeChatCompletionsUrl(this.config.baseUrl), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: this.config.model,
          temperature: this.config.temperature,
          messages
        }),
        signal: controller.signal
      });

      const raw = await response.text();
      let data: ChatCompletionResponse = {};
      try {
        data = JSON.parse(raw) as ChatCompletionResponse;
      } catch {
        if (!response.ok) {
          throw new UserError(`AI 服务返回 HTTP ${response.status}`);
        }
        throw new UserError('AI 服务返回了无法解析的响应');
      }

      if (!response.ok) {
        throw this.httpError(response.status, data.error?.message);
      }

      const responseContent = data.choices?.[0]?.message?.content;
      const content = typeof responseContent === 'string'
        ? responseContent
        : responseContent?.map(part => part.text ?? '').join('');

      if (!content?.trim()) {
        throw new UserError('AI 没有返回有效内容');
      }
      return content.trim();
    } catch (error) {
      if (controller.signal.aborted) {
        if (externalSignal?.aborted) {
          throw new UserError('已取消生成');
        }
        throw new UserError('AI 请求超时，请重试或调整超时时间');
      }
      throw error;
    } finally {
      clearTimeout(timeout);
      externalSignal?.removeEventListener('abort', abortListener);
    }
  }

  private httpError(status: number, providerMessage?: string): UserError {
    const suffix = providerMessage ? `：${providerMessage.slice(0, 240)}` : '';
    if (status === 401 || status === 403) {
      return new UserError(`API Key 无效或没有访问权限${suffix}`);
    }
    if (status === 404) {
      return new UserError(`Base URL、接口路径或模型名称可能不正确${suffix}`);
    }
    if (status === 429) {
      return new UserError(`请求过于频繁或账户额度不足${suffix}`);
    }
    return new UserError(`AI 服务请求失败（HTTP ${status}）${suffix}`);
  }
}
