import { useState, useRef, useCallback } from "react";
import { TranslationBatcher } from "../lib/translation-batcher";

interface UseTranslationResult {
    translate: (text: string) => Promise<string>;
    isTranslating: boolean;
}

export function useTranslation(targetLanguage: string = "zh-CN") {
    const batcherRef = useRef<TranslationBatcher | null>(null);
    const [isTranslating, setIsTranslating] = useState(false);

    // Initialize batcher
    if (!batcherRef.current) {
        // Get key inside effect or lazily? 
        // NOTE: We need to recreate batcher if key changes? 
        // For simplicity, we just read it once on mount. 
        // Ideally we should react to key changes, but that might require Context.
        const apiKey = localStorage.getItem("xai_api_key") || "";
        batcherRef.current = new TranslationBatcher(50, 20, targetLanguage, apiKey);
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
