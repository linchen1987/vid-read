import { LLMProvider, ProviderType } from './types';
import { XAIProvider } from './providers/xai';
import { DeepSeekProvider } from './providers/deepseek';
import { OpenRouterProvider } from './providers/openrouter';

export function createLLMProvider(type: ProviderType, apiKey: string): LLMProvider {
    switch (type) {
        case 'xai':
            return new XAIProvider(apiKey);
        case 'deepseek':
            return new DeepSeekProvider(apiKey);
        case 'openrouter':
            return new OpenRouterProvider(apiKey);
        default:
            throw new Error(`Unsupported provider type: ${type}`);
    }
}
