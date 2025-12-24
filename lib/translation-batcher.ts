import { fetchProxy } from "./proxy";

export class TranslationBatcher {
    private queue: Array<{
        text: string;
        resolve: (value: string) => void;
        reject: (reason: any) => void;
    }> = [];
    private processing = false;
    private timer: NodeJS.Timeout | null = null;

    constructor(
        private readonly batchDelay: number = 50,
        private readonly maxBatchSize: number = 50,
        private readonly targetLanguage: string = "zh-CN",
        private readonly apiKey: string = ""
    ) { }

    translate(text: string): Promise<string> {
        return new Promise((resolve, reject) => {
            this.queue.push({ text, resolve, reject });
            this.scheduleBatch();
        });
    }

    private scheduleBatch() {
        if (this.processing) return;

        if (this.queue.length >= this.maxBatchSize) {
            if (this.timer) clearTimeout(this.timer);
            this.processBatch();
            return;
        }

        if (!this.timer) {
            this.timer = setTimeout(() => {
                this.timer = null;
                this.processBatch();
            }, this.batchDelay);
        }
    }

    private async processBatch() {
        if (this.processing || this.queue.length === 0) return;

        this.processing = true;
        const batch = this.queue.splice(0, this.maxBatchSize);
        const texts = batch.map((item) => item.text);

        try {
            const TARGET_API = 'https://api.x.ai/v1/chat/completions';
            const headers: Record<string, string> = {
                "Content-Type": "application/json",
            };
            if (this.apiKey) {
                headers["Authorization"] = `Bearer ${this.apiKey}`;
            } else {
                throw new Error("Missing XAI API Key");
            }

            const response = await fetchProxy(TARGET_API, {
                method: "POST",
                headers: headers,
                body: JSON.stringify({
                    model: 'grok-4-1-fast-non-reasoning',
                    messages: [
                        {
                            role: 'system',
                            content: `You are a professional translator. Translate the following texts into ${this.targetLanguage || 'Chinese'}. 
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
                throw new Error(`Translation failed: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const data = await response.json();
            // Parse nested JSON content from LLM response
            const content = data.choices[0]?.message?.content;
            if (!content) throw new Error("Empty response from translation provider");

            let parsed;
            try {
                parsed = JSON.parse(content);
            } catch (e) {
                throw new Error("Failed to parse JSON from LLM");
            }

            const translations: string[] = parsed.translations;

            batch.forEach((item, index) => {
                item.resolve(translations[index] || item.text);
            });
        } catch (error) {
            console.error("Batch translation error:", error);
            // Reject so the caller knows it failed and doesn't cache the result
            batch.forEach((item) => {
                item.reject(error);
            });
        } finally {
            this.processing = false;
            if (this.queue.length > 0) {
                this.scheduleBatch();
            }
        }
    }
}
