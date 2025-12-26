import { OpenAICompatibleProvider } from './openai-compatible';
import { LLM_CONFIG } from '@/lib/constants';

export class OpenRouterProvider extends OpenAICompatibleProvider {
    constructor(apiKey: string) {
        super({
            apiKey,
            baseUrl: LLM_CONFIG.openrouter.baseUrl,
            model: LLM_CONFIG.openrouter.model
        });
    }
}
