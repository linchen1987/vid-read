import { NextRequest, NextResponse } from 'next/server';
import { createLLMProvider } from '@/lib/llm/factory';
import { DEFAULT_PROVIDER } from '@/lib/constants';

export async function POST(request: NextRequest) {
    try {
        const { texts, targetLanguage, provider: providerType } = await request.json();

        if (!texts || !Array.isArray(texts) || texts.length === 0) {
            return NextResponse.json({ error: 'Invalid request: texts array required' }, { status: 400 });
        }

        const authHeader = request.headers.get('authorization');
        const xApiKey = request.headers.get('x-api-key');

        let apiKey = xApiKey;
        if (!apiKey && authHeader && authHeader.startsWith('Bearer ')) {
            apiKey = authHeader.substring(7);
        }

        console.log(`[API] Translation request. Provider: ${providerType || DEFAULT_PROVIDER}, Texts: ${texts.length}, Target: ${targetLanguage}`);

        if (!apiKey) {
            console.error("[API] Missing API Key");
            return NextResponse.json({ error: 'Server configuration error: Missing API Key' }, { status: 401 });
        }

        const provider = createLLMProvider(providerType || DEFAULT_PROVIDER, apiKey);

        console.log("[API] Calling LLM Provider...");

        const llmResponse = await provider.chat([
            {
                role: 'system',
                content: `You are a professional translator. Translate the following texts into ${targetLanguage || 'Chinese'}. 
            be concise and natural.
            Output ONLY a JSON object with a "translations" key containing the array of translated strings in the same order.
            Example: { "translations": ["Hello", "World"] } -> { "translations": ["你好", "世界"] }`
            },
            {
                role: 'user',
                content: JSON.stringify({ texts })
            }
        ]);

        console.log("[API] Provider response received");
        const content = llmResponse.content;

        let parsed;
        try {
            parsed = JSON.parse(content);
        } catch (e) {
            console.error("[API] Failed to parse JSON from LLM:", content);
            return NextResponse.json({ error: 'Invalid response format from provider' }, { status: 502 });
        }

        return NextResponse.json({ translations: parsed.translations });

    } catch (error) {
        console.error('[API] Translation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
