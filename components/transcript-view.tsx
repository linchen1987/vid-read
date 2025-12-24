import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { Languages } from "lucide-react";
import { videoDB } from "@/lib/db";

interface TranscriptSegment {
    text: string;
    start: number;
    duration: number;
}

interface TranscriptViewProps {
    transcript: TranscriptSegment[];
    currentTime: number;
    onSeek: (time: number) => void;
    className?: string;
    videoId: string;
}

export function TranscriptView({ transcript, currentTime, onSeek, className, videoId }: TranscriptViewProps) {
    const activeIndex = transcript.findIndex(
        (segment) => currentTime >= segment.start && currentTime < segment.start + segment.duration
    );

    const [translations, setTranslations] = useState<Record<number, string>>({});
    const [showTranslation, setShowTranslation] = useState(false);
    const { translate } = useTranslation("zh-CN");
    const [isTranslatingAll, setIsTranslatingAll] = useState(false);

    // Load translations from DB on mount/change
    useEffect(() => {
        async function loadTranslations() {
            if (!videoId) return;
            const videoData = await videoDB.getVideo(videoId);
            if (videoData && videoData.translations && videoData.translations["zh-CN"]) {
                setTranslations(videoData.translations["zh-CN"]);
            }
        }
        loadTranslations();
    }, [videoId]);

    useEffect(() => {
        if (showTranslation && transcript.length > 0 && !isTranslatingAll) {
            const hasMissingTranslations = transcript.some((_, idx) => !translations[idx]);
            if (hasMissingTranslations) {
                setIsTranslatingAll(true);

                // Process in chunks or all at once? The batcher handles concurrency.
                // We need to save as we go or at the end.
                Promise.all(transcript.map(async (segment, index) => {
                    if (translations[index]) return;
                    try {
                        const translatedText = await translate(segment.text);

                        // Update state
                        setTranslations(prev => ({ ...prev, [index]: translatedText }));

                        // Save to DB
                        // Note: highly concurrent writes to IDB might be slow if not batched. 
                        // But for now let's trust IDB and our batcher speed.
                        // Ideally we'd save the whole object once at the end, but partial progress is good.
                        videoDB.saveTranslation(videoId, "zh-CN", index, translatedText);

                    } catch (e) {
                        console.error("Translation failed for segment", index, e);
                    }
                })).finally(() => setIsTranslatingAll(false));
            }
        }
    }, [showTranslation, transcript, translate, translations, isTranslatingAll, videoId]);


    // Auto-scroll logic
    const activeRef = (node: HTMLDivElement | null) => {
        if (node && activeIndex >= 0) {
            // Only scroll if we are tracking active index
            node.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
        }
    };

    if (!transcript || transcript.length === 0) {
        return <div className="p-4 text-center text-muted-foreground">No transcript available</div>;
    }

    return (
        <div className={cn("flex flex-col h-full overflow-hidden rounded-md border bg-card", className)}>
            <div className="flex items-center justify-between p-2 border-b bg-muted/20">
                <span className="text-sm font-medium pl-2">Transcript</span>
                <Button
                    variant={showTranslation ? "secondary" : "ghost"}
                    size="sm"
                    className="h-8 gap-2"
                    onClick={() => setShowTranslation(!showTranslation)}
                >
                    <Languages className="w-4 h-4" />
                    {showTranslation ? "Original" : "Translate"}
                </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
                <div className="flex flex-col gap-4">
                    {transcript.map((segment, index) => {
                        const isActive = index === activeIndex;
                        return (
                            <div
                                key={index}
                                ref={isActive ? activeRef : null}
                                className={cn(
                                    "cursor-pointer rounded p-3 transition-colors hover:bg-muted/50",
                                    isActive ? "bg-primary/10 border-l-2 border-primary" : "text-muted-foreground border-l-2 border-transparent"
                                )}
                                onClick={() => onSeek(segment.start)}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-mono opacity-50">
                                        {Math.floor(segment.start / 60)}:
                                        {Math.floor(segment.start % 60).toString().padStart(2, "0")}
                                    </span>
                                </div>
                                <p className={cn("leading-relaxed", isActive && "font-medium text-foreground")}>
                                    {segment.text}
                                </p>
                                {showTranslation && translations[index] && (
                                    <p className="mt-2 text-sm text-primary/80 leading-relaxed border-t pt-2 border-dashed border-primary/20">
                                        {translations[index]}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
