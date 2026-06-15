import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiHelpDto } from './dto/ai-help.dto';
import { renderMarkdown } from './utils/llmmd2html';
import * as fs from 'fs/promises';
import * as path from 'path';

interface CacheEntry {
  response: string | null;
  html: string | null;
  modelUsed: string;
  expiresAt: number;
}

@Injectable()
export class AiService {
  private readonly cache = new Map<string, CacheEntry>();
  private readonly cacheTTLSeconds: number;
  private readonly logFilePath: string;

  constructor(private readonly configService: ConfigService) {
    this.cacheTTLSeconds = Number(this.configService.get<number>('cacheTTLSeconds')) || 600;
    this.logFilePath = path.join(process.cwd(), 'logs', 'ai-errors.log');
  }

  private async logError(message: string) {
    const directory = path.dirname(this.logFilePath);
    const line = `[${new Date().toISOString()}] ${message}\n`;
    await fs.mkdir(directory, { recursive: true });
    await fs.appendFile(this.logFilePath, line, 'utf8');
  }

  private makeCacheKey(dto: AiHelpDto) {
    const title = dto.title?.trim().toLowerCase() ?? '';
    const description = dto.description?.trim().toLowerCase() ?? '';
    return `${title}|||${description}`;
  }

  private getCachedResponse(key: string) {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry;
  }

  private cacheResponse(key: string, response: string | null, html: string | null, modelUsed: string) {
    this.cache.set(key, {
      response,
      html,
      modelUsed,
      expiresAt: Date.now() + this.cacheTTLSeconds * 1000
    });
  }

  async getHelp(dto: AiHelpDto) {
    const apiKey = this.configService.get<string>('openRouterApiKey');
    const modelList = (this.configService.get<string>('openRouterModels') ?? '')
      .split(',')
      .map((model) => model.trim())
      .filter(Boolean);

    if (!apiKey) {
      throw new InternalServerErrorException('OpenRouter API key is not configured.');
    }

    if (!modelList.length) {
      throw new InternalServerErrorException('No OpenRouter models are configured.');
    }

    const cacheKey = this.makeCacheKey(dto);
    const cached = this.getCachedResponse(cacheKey);
    if (cached) {
      return {
        response: cached.response,
        html: cached.html,
        modelUsed: cached.modelUsed,
        cached: true
      };
    }

    const systemPrompt = `You are an intelligent task assistant. Provide concise and actionable guidance. Break tasks into clear steps.`;
    const userPrompt = `Task Title:\n${dto.title}\n\nTask Description:\n${dto.description}`;

    let lastError: string | null = null;

    try {
      for (const model of modelList) {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ]
          })
        });

        if (response.ok) {
          const data = await response.json();
          const content = data?.choices?.[0]?.message?.content ?? null;
          const html = content ? renderMarkdown(content) : null;
          this.cacheResponse(cacheKey, content, html, model);
          return {
            response: content,
            html,
            modelUsed: model,
            cached: false
          };
        }

        const errorBody = await response.text();
        lastError = `model=${model} status=${response.status} ${response.statusText} body=${errorBody}`;
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }

    const errorMessage = `All OpenRouter model attempts failed. Last error: ${lastError}`;
    try {
      await this.logError(errorMessage);
    } catch {
      // If logging fails, do not expose internal errors to the client.
    }
    throw new InternalServerErrorException('AI assistance cannot be provided currently.');
  }
}
