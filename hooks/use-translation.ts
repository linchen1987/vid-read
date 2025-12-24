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
        batcherRef.current = new TranslationBatcher(50, 20, targetLanguage);
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
