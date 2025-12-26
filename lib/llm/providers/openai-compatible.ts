import { LLMMessage, LLMProvider, LLMResponse } from '../types';

export interface OpenAICompatibleConfig {
    apiKey: string;
    baseUrl: string;
    model: string;
}

export class OpenAICompatibleProvider implements LLMProvider {
    protected config: OpenAICompatibleConfig;

    constructor(config: OpenAICompatibleConfig) {
        this.config = config;
    }

    async chat(messages: LLMMessage[]): Promise<LLMResponse> {
        if (!this.config.apiKey) {
            throw new Error('API Key is missing');
        }

        console.log(`[${this.constructor.name}] Sending request to ${this.config.baseUrl}...`);

        const response = await fetch(this.config.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`,
            },
            body: JSON.stringify({
                model: this.config.model,
                messages: messages,
                temperature: 0.3,
                response_format: { type: 'json_object' }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[${this.constructor.name}] API Error:`, response.status, errorText);
            throw new Error(`${this.constructor.name} error: ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content;

        if (!content) {
            console.error(`[${this.constructor.name}] Empty content`);
            throw new Error(`Empty response from ${this.constructor.name}`);
        }

        return { content };
    }
}
