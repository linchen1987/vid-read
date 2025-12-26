import { ProviderType } from "@/lib/llm/types";

export const AI_CONFIG_STORAGE_KEY = "vidread_ai_config";
export const DEFAULT_PROVIDER: ProviderType = "deepseek";

export const PROVIDERS_CONFIG: { id: ProviderType; name: string; url?: string }[] = [
    { id: 'deepseek', name: 'DeepSeek', url: 'https://platform.deepseek.com/api_keys' },
    { id: 'openrouter', name: 'OpenRouter', url: 'https://openrouter.ai/settings/keys' },
    { id: 'xai', name: 'X.AI (Grok)', url: 'https://console.x.ai' },
];

export const LLM_CONFIG = {
    xai: {
        baseUrl: 'https://api.x.ai/v1/chat/completions',
        model: 'grok-4-1-fast-non-reasoning'
    },
    deepseek: {
        baseUrl: 'https://api.deepseek.com/chat/completions',
        model: 'deepseek-chat'
    },
    openrouter: {
        baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
        model: 'bytedance-seed/seed-1.6-flash'
    }
} as const;
