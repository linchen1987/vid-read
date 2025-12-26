import { OpenAICompatibleProvider } from './openai-compatible';
import { LLM_CONFIG } from '@/lib/constants';

export class DeepSeekProvider extends OpenAICompatibleProvider {
    constructor(apiKey: string) {
        super({
            apiKey,
            baseUrl: LLM_CONFIG.deepseek.baseUrl,
            model: LLM_CONFIG.deepseek.model
        });
    }
}
