import { useState, useRef, useCallback } from "react";
import { TranslationBatcher } from "../lib/translation-batcher";
import { AI_CONFIG_STORAGE_KEY, DEFAULT_PROVIDER } from "@/lib/constants";

interface UseTranslationResult {
    translate: (text: string) => Promise<string>;
    isTranslating: boolean;
}

export function useTranslation(targetLanguage: string = "zh-CN") {
    const batcherRef = useRef<TranslationBatcher | null>(null);
    const [isTranslating, setIsTranslating] = useState(false);

    // Initialize batcher
    if (!batcherRef.current) {
        // Read from consolidated storage
        let provider = DEFAULT_PROVIDER;
        let apiKey = "";

        try {
            const stored = localStorage.getItem(AI_CONFIG_STORAGE_KEY);
            if (stored) {
                const config = JSON.parse(stored);
                if (config.provider) provider = config.provider;
                if (config.keys && config.keys[provider]) apiKey = config.keys[provider];
            }
        } catch (e) {
            console.error("Failed to load AI config in hook:", e);
        }

        batcherRef.current = new TranslationBatcher(50, 20, targetLanguage, apiKey, provider);
    }

    const translate = useCallback(
        async (text: string): Promise<string> => {
            if (!text) return "";

            // Persistence is now handled by the component (VideoDB)
            setIsTranslating(true);
            try {
                const translation = await batcherRef.current!.translate(text);
                return translation;
            } finally {
                setIsTranslating(false);
            }
        },
        [targetLanguage]
    );

    return { translate, isTranslating };
}
