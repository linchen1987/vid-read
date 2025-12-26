export interface LLMMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface LLMResponse {
    content: string;
    // Add other fields as needed, e.g., token usage, etc.
}


export interface LLMProvider {
    chat(messages: LLMMessage[]): Promise<LLMResponse>;
}

export type ProviderType = 'xai' | 'deepseek' | 'openrouter' | 'doubao';

