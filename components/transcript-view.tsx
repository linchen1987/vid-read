import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslations } from "next-intl";
import { Languages, Copy, FileText, Check, Download, Type } from "lucide-react";
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
    // Find the active segment. We iterate through all segments to find the "best" match.
    // We favor the latest segment that matches the current time within a 2s lookahead window.
    // This helps with player lag and short segments, ensuring we don't get stuck on the previous line.
    let activeIndex = -1;
    const offset = 1.0;
    for (let i = 0; i < transcript.length; i++) {
        const segment = transcript[i];
        if (segment.start > currentTime + offset) break;

        if (currentTime >= segment.start - offset && currentTime < segment.start + segment.duration) {
            activeIndex = i;
        }
    }

    const [translations, setTranslations] = useState<Record<number, string>>({});
    const [showTranslation, setShowTranslation] = useState(false);
    const { translate } = useTranslation("zh-CN"); // This is AI translation hook, generic name.
    const t = useTranslations("TranscriptView");
    const [isTranslatingAll, setIsTranslatingAll] = useState(false);
    const [copiedState, setCopiedState] = useState<"original" | "article" | null>(null);

    const TRANSCRIPT_FONT_SIZE_KEY = "@vidread/transcript-font-size";
    type FontSize = "text-sm" | "text-base" | "text-lg" | "text-xl";
    const [fontSize, setFontSizeState] = useState<FontSize>("text-base");

    useEffect(() => {
        const savedSize = localStorage.getItem(TRANSCRIPT_FONT_SIZE_KEY);
        if (savedSize) {
            setFontSizeState(savedSize as FontSize);
        }
    }, []);

    const setFontSize = (size: FontSize) => {
        setFontSizeState(size);
        localStorage.setItem(TRANSCRIPT_FONT_SIZE_KEY, size);
    };

    const fontSizes: { label: string; value: FontSize }[] = [
        { label: t("small"), value: "text-sm" },
        { label: t("medium"), value: "text-base" },
        { label: t("large"), value: "text-lg" },
        { label: t("extraLarge"), value: "text-xl" },
    ];

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
    const scrollRef = useRef<HTMLDivElement>(null);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isAutoScrolling = useRef(false);
    const [isUserScrolling, setIsUserScrolling] = useState(false);

    // Auto-scroll logic
    useEffect(() => {
        if (activeIndex !== -1 && scrollRef.current && !isUserScrolling) {
            // Fix: The direct child is the wrapper div, so we need to access its children
            const wrapper = scrollRef.current.firstElementChild;
            if (!wrapper) return;

            const activeEl = wrapper.children[activeIndex] as HTMLElement;
            if (activeEl) {
                isAutoScrolling.current = true;
                // Scroll with smooth behavior
                activeEl.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                });

                // Reset auto-scrolling flag after a delay to cover the smooth scroll duration
                setTimeout(() => {
                    isAutoScrolling.current = false;
                }, 1000);
            }
        }
    }, [activeIndex, isUserScrolling]);

    const handleScroll = () => {
        // If we are auto-scrolling, ignore this event
        if (isAutoScrolling.current) return;

        setIsUserScrolling(true);
        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }
        scrollTimeoutRef.current = setTimeout(() => {
            setIsUserScrolling(false);
        }, 60 * 1000); // Resume auto-scroll after 60 seconds of inactivity
    };

    const handleCopy = async (type: "original" | "article") => {
        if (!transcript.length) return;

        let textToCopy = "";

        if (type === "original") {
            textToCopy = transcript.map((segment) => {
                const timeStr = `${Math.floor(segment.start / 60)}:${Math.floor(segment.start % 60).toString().padStart(2, "0")}`;
                return `[${timeStr}] ${segment.text}`;
            }).join("\n");
        } else {
            // Article mode: join text with spaces, removing timestamps
            textToCopy = transcript.map((segment) => {
                return segment.text;
            }).join(" ");
        }

        try {
            await navigator.clipboard.writeText(textToCopy);
            setCopiedState(type);
            setTimeout(() => setCopiedState(null), 2000);
        } catch (err) {
            console.error("Failed to copy text: ", err);
        }
    };

    const handleDownload = (type: "text" | "srt") => {
        if (!transcript.length) return;

        let content = "";
        let filename = `transcript.${type}`;
        let mimeType = "text/plain";

        if (type === "text") {
            content = transcript.map(s => s.text).join("\n");
        } else if (type === "srt") {
            content = transcript.map((segment, index) => {
                const formatTime = (seconds: number) => {
                    const date = new Date(seconds * 1000);
                    const hh = Math.floor(seconds / 3600).toString().padStart(2, '0');
                    const mm = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
                    const ss = Math.floor(seconds % 60).toString().padStart(2, '0');
                    const ms = Math.floor((seconds % 1) * 1000).toString().padStart(3, '0');
                    return `${hh}:${mm}:${ss},${ms}`;
                };
                const start = formatTime(segment.start);
                const end = formatTime(segment.start + segment.duration);
                return `${index + 1}\n${start} --> ${end}\n${segment.text}\n`;
            }).join("\n");
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (!transcript || transcript.length === 0) {
        return <div className="p-4 text-center text-muted-foreground">{t('noTranscript')}</div>;
    }

    return (
        <div className={cn("flex flex-col h-full bg-card rounded-lg overflow-hidden border shadow-sm relative", className)}>
            <div className="p-3 border-b bg-muted/30 flex justify-between items-center">
                <h3 className="font-semibold text-sm">{t('title')}</h3>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1.5 text-xs"
                        onClick={() => setShowTranslation(!showTranslation)}
                    >
                        <Languages className="w-3.5 h-3.5" />
                        {showTranslation ? t('hideTranslation') : t('translate')}
                    </Button>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Type className="h-4 w-4" />
                                <span className="sr-only">{t('fontSize')}</span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-40 p-1" align="end">
                            <div className="flex flex-col gap-0.5">
                                {fontSizes.map((size) => (
                                    <Button
                                        key={size.value}
                                        variant="ghost"
                                        size="sm"
                                        className={cn(
                                            "justify-start gap-2 h-8 px-2 text-xs font-normal",
                                            fontSize === size.value && "bg-accent text-accent-foreground"
                                        )}
                                        onClick={() => setFontSize(size.value)}
                                    >
                                        <span className={cn("font-medium", size.value === "text-sm" ? "text-xs" : size.value === "text-lg" ? "text-lg" : size.value === "text-xl" ? "text-xl" : "text-sm")}>A</span>
                                        {size.label}
                                        {fontSize === size.value && <Check className="ml-auto h-3.5 w-3.5" />}
                                    </Button>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Copy className="h-4 w-4" />
                                <span className="sr-only">{t('copy')}</span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-1" align="end">
                            <div className="flex flex-col gap-0.5">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="justify-start gap-2 h-8 px-2 text-xs font-normal"
                                    onClick={() => handleCopy("article")}
                                >
                                    {copiedState === "article" ? (
                                        <Check className="h-3.5 w-3.5 text-green-500" />
                                    ) : (
                                        <FileText className="h-3.5 w-3.5" />
                                    )}
                                    {t('copyText')}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="justify-start gap-2 h-8 px-2 text-xs font-normal"
                                    onClick={() => handleCopy("original")}
                                >
                                    {copiedState === "original" ? (
                                        <Check className="h-3.5 w-3.5 text-green-500" />
                                    ) : (
                                        <Copy className="h-3.5 w-3.5" />
                                    )}
                                    {t('copySubtitles')}
                                </Button>
                                <div className="h-px bg-border my-1" />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="justify-start gap-2 h-8 px-2 text-xs font-normal"
                                    onClick={() => handleDownload("text")}
                                >
                                    <Download className="h-3.5 w-3.5" />
                                    {t('downloadText')}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="justify-start gap-2 h-8 px-2 text-xs font-normal"
                                    onClick={() => handleDownload("srt")}
                                >
                                    <Download className="h-3.5 w-3.5" />
                                    {t('downloadSubtitles')}
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-2 relative"
                onScroll={handleScroll}
            >
                <div className="flex flex-col gap-0">
                    {transcript.map((segment, index) => {
                        const isActive = index === activeIndex;
                        return (
                            <div
                                key={index}
                                className={cn(
                                    "cursor-pointer rounded-sm p-2 transition-colors hover:bg-muted/50 flex gap-3",
                                    isActive ? "bg-primary/10" : "text-muted-foreground"
                                )}
                                onClick={() => onSeek(segment.start)}
                            >
                                <div className="flex-none w-10 text-xs font-mono opacity-40 pt-0.5 text-right select-none">
                                    {Math.floor(segment.start / 60)}:
                                    {Math.floor(segment.start % 60).toString().padStart(2, "0")}
                                </div>
                                <div className="flex-1">
                                    <p className={cn(fontSize, "leading-relaxed", isActive && "font-medium text-foreground")}>
                                        {segment.text}
                                    </p>
                                    {showTranslation && translations[index] && (
                                        <p className={cn("mt-1 text-primary/80 leading-relaxed", fontSize)}>
                                            {translations[index]}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            {
                isUserScrolling && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
                        <Button
                            size="sm"
                            variant="secondary"
                            className="shadow-lg bg-background/80 backdrop-blur-sm border hover:bg-background/90"
                            onClick={() => setIsUserScrolling(false)}
                        >
                            {t('backToCurrent')}
                        </Button>
                    </div>
                )
            }
        </div >
    );
}
