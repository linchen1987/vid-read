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
            const headers: Record<string, string> = { "Content-Type": "application/json" };
            if (this.apiKey) {
                headers["x-api-key"] = this.apiKey;
            }

            const response = await fetch("/api/translate", {
                method: "POST",
                headers: headers,
                body: JSON.stringify({ texts, targetLanguage: this.targetLanguage }),
            });

            if (!response.ok) {
                throw new Error(`Translation failed: ${response.statusText}`);
            }

            const data = await response.json();
            const translations: string[] = data.translations;

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
