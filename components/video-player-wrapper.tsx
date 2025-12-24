"use client";

import { useEffect, useState } from "react";
import { VideoPlayer } from "./video-player";
import { fetchVideoMetadata } from "@/actions/metadata";
import { fetchTranscript } from "@/actions/transcript";
import { videoDB, TranscriptSegment } from "@/lib/db";

interface VideoPlayerWrapperProps {
    videoId: string;
}

export function VideoPlayerWrapper({ videoId }: VideoPlayerWrapperProps) {
    const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
    const [metadata, setMetadata] = useState<any>(undefined); // Use VideoMeta type if available or any for now
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            if (!videoId) return;

            let loadedTranscript = false;
            let loadedMetadata = false;

            // 1. Try DB
            try {
                const videoData = await videoDB.getVideo(videoId);
                if (videoData) {
                    if (videoData.transcript && videoData.transcript.length > 0) {
                        console.log("Using cached transcript from DB");
                        setTranscript(videoData.transcript);
                        loadedTranscript = true;
                    }
                    if (videoData.metadata) {
                        // Check if we have the new field 'publishDate'
                        if (videoData.metadata.publishDate) {
                            console.log("Using cached metadata from DB");
                            setMetadata(videoData.metadata);
                            loadedMetadata = true;
                        } else {
                            console.log("Cached metadata missing publishDate, will re-fetch");
                            // Don't set loadedMetadata to true, so it falls through to fetch
                            // But we can set stale metadata tentatively
                            setMetadata(videoData.metadata);
                        }
                    }
                }
            } catch (e) {
                console.error("Failed to load from DB", e);
            }

            // 2. Fetch missing data from API
            try {
                if (!loadedTranscript) {
                    console.log("Fetching transcript from server");
                    const data = await fetchTranscript(videoId);
                    setTranscript(data);

                    // Save Transcript
                    const videoData = await videoDB.getVideo(videoId);
                    await videoDB.saveVideo({
                        ...videoData,
                        id: videoId,
                        updatedAt: Date.now(),
                        transcript: data,
                    });
                }

                if (!loadedMetadata) {
                    console.log("Fetching metadata from server");
                    const meta = await fetchVideoMetadata(videoId);
                    if (meta) {
                        const videoMeta = {
                            title: meta.title,
                            author: meta.author_name,
                            description: meta.description,
                            publishDate: meta.publish_date
                        };
                        setMetadata(videoMeta);

                        // Save Metadata
                        const videoData = await videoDB.getVideo(videoId);
                        await videoDB.saveVideo({
                            ...videoData,
                            id: videoId,
                            updatedAt: Date.now(),
                            metadata: videoMeta
                        });
                    }
                }
            } catch (error) {
                console.error("Failed to fetch data", error);
            } finally {
                setIsLoading(false);
            }
        }

        loadData();
    }, [videoId]);

    return <VideoPlayer videoId={videoId} transcript={transcript} metadata={metadata} />;
}
