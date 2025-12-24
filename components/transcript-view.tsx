"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

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
}

export function TranscriptView({ transcript, currentTime, onSeek, className }: TranscriptViewProps) {
    const activeIndex = transcript.findIndex(
        (segment) => currentTime >= segment.start && currentTime < segment.start + segment.duration
    );

    const activeRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (activeRef.current) {
            activeRef.current.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
        }
    }, [activeIndex]);

    if (!transcript || transcript.length === 0) {
        return <div className="p-4 text-center text-muted-foreground">No transcript available</div>;
    }

    return (
        <div className={cn("h-full overflow-y-auto rounded-md border bg-card p-4", className)}>
            <div className="flex flex-col gap-2">
                {transcript.map((segment, index) => {
                    const isActive = index === activeIndex;
                    return (
                        <div
                            key={index}
                            ref={isActive ? activeRef : null}
                            className={cn(
                                "cursor-pointer rounded p-2 transition-colors hover:bg-muted",
                                isActive ? "bg-primary/20 font-medium" : "text-muted-foreground"
                            )}
                            onClick={() => onSeek(segment.start)}
                        >
                            <span className="text-xs font-mono opacity-50 mr-2">
                                {Math.floor(segment.start / 60)}:
                                {Math.floor(segment.start % 60).toString().padStart(2, "0")}
                            </span>
                            {segment.text}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
