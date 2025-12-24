import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { texts, targetLanguage } = await request.json();

        if (!texts || !Array.isArray(texts) || texts.length === 0) {
            return NextResponse.json({ error: 'Invalid request: texts array required' }, { status: 400 });
        }

        const authHeader = request.headers.get('authorization');
        const xApiKey = request.headers.get('x-api-key');

        let apiKey = xApiKey;
        if (!apiKey && authHeader && authHeader.startsWith('Bearer ')) {
            apiKey = authHeader.substring(7);
        }

        console.log("[API] Translation request received. Texts count:", texts.length, "Target:", targetLanguage);

        if (!apiKey) {
            console.error("[API] Missing XAI_API_KEY");
            return NextResponse.json({ error: 'Server configuration error: Missing API Key' }, { status: 401 });
        }

        // XAI uses OpenAI-compatible API
        console.log("[API] Calling XAI...");
        const response = await fetch('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'grok-4-1-fast-non-reasoning',
                messages: [
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
                ],
                temperature: 0.3,
                response_format: { type: 'json_object' }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("[API] XAI API Error:", response.status, errorText);
            return NextResponse.json({ error: `Translation provider error: ${response.statusText}`, details: errorText }, { status: 502 });
        }

        const data = await response.json();
        console.log("[API] XAI response received");
        const content = data.choices[0]?.message?.content;

        if (!content) {
            console.error("[API] Empty content from XAI");
            return NextResponse.json({ error: 'Empty response from translation provider' }, { status: 502 });
        }

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
