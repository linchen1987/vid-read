"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";

interface VideoPlayerProps {
    videoId: string;
}

export function VideoPlayer({ videoId }: VideoPlayerProps) {
    const playerRef = useRef<any>(null);
    const [playerReady, setPlayerReady] = useState(false);

    useEffect(() => {
        if (!videoId) return;

        let mounted = true;
        let player: any = null;

        const initializePlayer = () => {
            if (!mounted || playerRef.current) return;

            player = new (window as any).YT.Player("youtube-player", {
                videoId: videoId,
                playerVars: {
                    autoplay: 1,
                    controls: 1,
                    modestbranding: 1,
                    rel: 0,
                },
                events: {
                    onReady: (event: { target: any }) => {
                        if (!mounted) return;
                        playerRef.current = player;
                        setPlayerReady(true);
                    },
                },
            });
        };

        if ((window as any).YT && (window as any).YT.Player) {
            initializePlayer();
        } else {
            if (typeof document !== 'undefined' && document.body && !document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
                const tag = document.createElement("script");
                tag.src = "https://www.youtube.com/iframe_api";
                document.body.appendChild(tag);
            }

            const existingCallback = (window as any).onYouTubeIframeAPIReady;
            (window as any).onYouTubeIframeAPIReady = () => {
                if (existingCallback) existingCallback();
                if (mounted) initializePlayer();
            };
        }

        return () => {
            mounted = false;
            setPlayerReady(false);
            if (playerRef.current) {
                try {
                    playerRef.current.destroy();
                } catch (e) {
                    console.error('Error destroying player:', e);
                }
                playerRef.current = null;
            }
        };
    }, [videoId]);

    return (
        <div className="w-full">
            <Card className="overflow-hidden shadow-sm p-0">
                <div className="relative bg-black overflow-hidden aspect-video">
                    <div
                        id="youtube-player"
                        className="absolute top-0 left-0 w-full h-full"
                    />
                </div>
            </Card>
        </div>
    );
}
