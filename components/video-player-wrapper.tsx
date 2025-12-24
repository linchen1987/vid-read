"use client";

import { useEffect, useState } from "react";
import { VideoPlayer } from "./video-player";
import { fetchTranscript } from "@/actions/transcript";

interface TranscriptSegment {
    text: string;
    start: number;
    duration: number;
}

interface VideoPlayerWrapperProps {
    videoId: string;
}

export function VideoPlayerWrapper({ videoId }: VideoPlayerWrapperProps) {
    const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadTranscript() {
            if (!videoId) return;

            const cacheKey = `transcript_${videoId}`;
            const cached = localStorage.getItem(cacheKey);

            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    console.log("Using cached transcript");
                    setTranscript(parsed);
                    setIsLoading(false);
                    return;
                } catch (e) {
                    console.error("Failed to parse cached transcript", e);
                    localStorage.removeItem(cacheKey);
                }
            }

            try {
                console.log("Fetching transcript from server");
                const data = await fetchTranscript(videoId);
                setTranscript(data);
                localStorage.setItem(cacheKey, JSON.stringify(data));
            } catch (error) {
                console.error("Failed to fetch transcript", error);
            } finally {
                setIsLoading(false);
            }
        }

        loadTranscript();
    }, [videoId]);

    return <VideoPlayer videoId={videoId} transcript={transcript} />;
}
