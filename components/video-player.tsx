"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause } from "lucide-react";

interface VideoPlayerProps {
    videoId: string;
}

function formatDuration(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function VideoPlayer({ videoId }: VideoPlayerProps) {
    const playerRef = useRef<any>(null);
    const [playerReady, setPlayerReady] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

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
                    controls: 0, // Hide native controls
                    modestbranding: 1,
                    rel: 0,
                },
                events: {
                    onReady: (event: { target: any }) => {
                        if (!mounted) return;
                        playerRef.current = player;
                        setPlayerReady(true);
                        setDuration(player.getDuration());
                    },
                    onStateChange: (event: { data: number }) => {
                        if (!mounted) return;
                        // YT.PlayerState.PLAYING is 1
                        const playing = event.data === 1;
                        setIsPlaying(playing);

                        if (playing) {
                            if (intervalRef.current) clearInterval(intervalRef.current);
                            intervalRef.current = setInterval(() => {
                                if (playerRef.current && playerRef.current.getCurrentTime) {
                                    setCurrentTime(playerRef.current.getCurrentTime());
                                }
                            }, 1000);
                        } else {
                            if (intervalRef.current) {
                                clearInterval(intervalRef.current);
                                intervalRef.current = null;
                            }
                        }
                    }
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
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [videoId]);

    const togglePlay = () => {
        if (!playerRef.current) return;
        if (isPlaying) {
            playerRef.current.pauseVideo();
        } else {
            playerRef.current.playVideo();
        }
    };

    const handleSeek = (value: number[]) => {
        if (!playerRef.current) return;
        const time = value[0];
        playerRef.current.seekTo(time, true);
        setCurrentTime(time);
    };

    return (
        <div className="w-full flex flex-col gap-4">
            <Card className="overflow-hidden shadow-sm p-0">
                <div className="relative bg-black overflow-hidden aspect-video">
                    <div
                        id="youtube-player"
                        className="absolute top-0 left-0 w-full h-full"
                    />
                </div>
            </Card>

            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={togglePlay}>
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <div className="flex-1">
                        <Slider
                            value={[currentTime]}
                            max={duration}
                            step={1}
                            onValueChange={handleSeek}
                        />
                    </div>
                    <span className="text-sm font-mono text-muted-foreground min-w-[100px] text-right">
                        {formatDuration(currentTime)} / {formatDuration(duration)}
                    </span>
                </div>
            </div>
        </div>
    );
}
