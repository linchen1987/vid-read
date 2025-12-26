import { OpenAICompatibleProvider } from './openai-compatible';
import { LLM_CONFIG } from '@/lib/constants';

export class XAIProvider extends OpenAICompatibleProvider {
    constructor(apiKey: string) {
        super({
            apiKey,
            baseUrl: LLM_CONFIG.xai.baseUrl,
            model: LLM_CONFIG.xai.model
        });
    }
}
