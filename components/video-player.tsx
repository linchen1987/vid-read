"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { TranscriptView } from "@/components/transcript-view";
import { videoDB, VideoMeta } from "@/lib/db";
import { ExternalLink } from "lucide-react";

interface TranscriptSegment {
    text: string;
    start: number;
    duration: number;
}

const VOLUME_STORAGE_KEY = "VIDREAD_PLAYER_VOLUME";
const MUTED_STORAGE_KEY = "VIDREAD_PLAYER_MUTED";

interface VideoPlayerProps {
    videoId: string;
    transcript?: TranscriptSegment[];
    metadata?: VideoMeta;
}

function formatDuration(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function formatTimeAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (isNaN(seconds)) return "";

    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60
    };

    if (seconds < intervals.minute) {
        return "just now";
    } else if (seconds < intervals.hour) {
        const count = Math.floor(seconds / intervals.minute);
        return `${count} minute${count > 1 ? 's' : ''} ago`;
    } else if (seconds < intervals.day) {
        const count = Math.floor(seconds / intervals.hour);
        return `${count} hour${count > 1 ? 's' : ''} ago`;
    } else if (seconds < intervals.week) {
        const count = Math.floor(seconds / intervals.day);
        return `${count} day${count > 1 ? 's' : ''} ago`;
    } else if (seconds < intervals.month) {
        const count = Math.floor(seconds / intervals.week);
        return `${count} week${count > 1 ? 's' : ''} ago`;
    } else if (seconds < intervals.year) {
        const count = Math.floor(seconds / intervals.month);
        return `${count} month${count > 1 ? 's' : ''} ago`;
    } else {
        const count = Math.floor(seconds / intervals.year);
        return `${count} year${count > 1 ? 's' : ''} ago`;
    }
}

export function VideoPlayer({ videoId, transcript = [], metadata }: VideoPlayerProps) {
    console.log("VideoPlayer metadata:", metadata);
    const playerRef = useRef<any>(null);
    const [playerReady, setPlayerReady] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [volume, setVolume] = useState(100);
    const [isMuted, setIsMuted] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const [hoverTime, setHoverTime] = useState<number | null>(null);
    const [hoverPosition, setHoverPosition] = useState<number | null>(null);

    // Resizable layout state
    const [leftPanelPercentage, setLeftPanelPercentage] = useState(20);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDraggingRef = useRef(false);

    // Keep a ref of the latest percentage to access inside the event listener closure
    const percentageRef = useRef(leftPanelPercentage);
    useEffect(() => {
        percentageRef.current = leftPanelPercentage;
    }, [leftPanelPercentage]);

    const [isDragging, setIsDragging] = useState(false);



    // Persistence: Layout Ratio
    useEffect(() => {
        const savedRatio = localStorage.getItem("layout-left-panel-ratio");
        if (savedRatio) {
            const parsed = parseFloat(savedRatio);
            if (!isNaN(parsed) && parsed >= 20 && parsed <= 80) {
                setLeftPanelPercentage(parsed);
            }
        }
    }, []);



    // Persistence: Playback Time (Load)
    useEffect(() => {
        if (!videoId || !playerReady) return;

        const loadPlaybackTime = async () => {
            const videoData = await videoDB.getVideo(videoId);
            if (videoData?.lastPlaybackTime && playerRef.current) {
                const time = videoData.lastPlaybackTime;
                // Only seek if it's significant (e.g. > 5s) and not near end
                if (time > 2 && Math.abs(time - duration) > 5) {
                    seekTo(time);
                }
            }
        };
        loadPlaybackTime();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [videoId, playerReady, duration]); // Seek once when player is ready

    const currentTimeRef = useRef(0);

    useEffect(() => {
        currentTimeRef.current = currentTime;
    }, [currentTime]);

    const playerId = useMemo(() => `youtube-player-${videoId}`, [videoId]);

    // Persistence: Playback Time (Save)
    // Save every 5 seconds if playing
    useEffect(() => {
        if (!isPlaying || !videoId) return;

        const saveInterval = setInterval(() => {
            if (currentTimeRef.current > 0) {
                videoDB.savePlaybackTime(videoId, currentTimeRef.current);
            }
        }, 5000);

        return () => {
            clearInterval(saveInterval);
            // Save on unmount or strict effect cleanup
            if (currentTimeRef.current > 0) {
                videoDB.savePlaybackTime(videoId, currentTimeRef.current);
            }
        };
    }, [isPlaying, videoId]);

    useEffect(() => {
        if (!videoId) return;

        let mounted = true;
        let player: any = null;

        const initializePlayer = () => {
            if (!mounted) return;
            // Prevent double initialization if playerRef already has a value
            if (playerRef.current) return;

            player = new (window as any).YT.Player(playerId, {
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
                        setPlayerReady(true);
                        setDuration(event.target.getDuration());
                        if (event.target.getPlaybackRate) {
                            setPlaybackRate(event.target.getPlaybackRate());
                        }

                        // Restore volume settings
                        const savedVolume = localStorage.getItem(VOLUME_STORAGE_KEY);
                        const savedMuted = localStorage.getItem(MUTED_STORAGE_KEY);

                        if (savedVolume !== null) {
                            const vol = parseInt(savedVolume, 10);
                            event.target.setVolume(vol);
                            setVolume(vol);
                        } else if (event.target.getVolume) {
                            setVolume(event.target.getVolume());
                        }

                        if (savedMuted !== null) {
                            const muted = savedMuted === "true";
                            if (muted) {
                                event.target.mute();
                            } else {
                                event.target.unMute();
                            }
                            setIsMuted(muted);
                        } else if (event.target.isMuted) {
                            setIsMuted(event.target.isMuted());
                        }
                    },
                    onPlaybackRateChange: (event: { data: number }) => {
                        if (!mounted) return;
                        setPlaybackRate(event.data);
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
                            // Save on pause
                            if (currentTimeRef.current > 0) {
                                videoDB.savePlaybackTime(videoId, currentTimeRef.current);
                            }
                        }
                    }
                },
            });
            // Capture reference immediately to ensure cleanup capabilities
            playerRef.current = player;
        };

        if ((window as any).YT && (window as any).YT.Player) {
            initializePlayer();
        } else {
            // Check if script is already present but API not ready?
            // Actually usually window.YT is sufficient check.
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
            // Save on unmount
            if (currentTimeRef.current > 0) {
                videoDB.savePlaybackTime(videoId, currentTimeRef.current);
            }
        };
    }, [videoId, playerId]);

    const togglePlay = () => {
        if (!playerRef.current) return;
        if (isPlaying) {
            playerRef.current.pauseVideo();
        } else {
            playerRef.current.playVideo();
        }
    };

    const seekTo = (time: number) => {
        if (!playerRef.current) return;
        playerRef.current.seekTo(time, true);
        setCurrentTime(time);
        if (!isPlaying) {
            playerRef.current.playVideo();
        }
    };

    const handleSeek = (value: number[]) => {
        seekTo(value[0]);
    };

    const toggleMute = () => {
        if (!playerRef.current) return;
        if (isMuted) {
            playerRef.current.unMute();
            setIsMuted(false);
            localStorage.setItem(MUTED_STORAGE_KEY, "false");
        } else {
            playerRef.current.mute();
            setIsMuted(true);
            localStorage.setItem(MUTED_STORAGE_KEY, "true");
        }
    };

    const handleVolumeChange = (value: number[]) => {
        if (!playerRef.current) return;
        const newVolume = value[0];
        playerRef.current.setVolume(newVolume);
        setVolume(newVolume);
        localStorage.setItem(VOLUME_STORAGE_KEY, newVolume.toString());

        // If volume is > 0 and was muted, unmute
        if (newVolume > 0 && isMuted) {
            playerRef.current.unMute();
            setIsMuted(false);
            localStorage.setItem(MUTED_STORAGE_KEY, "false");
        }
        // If volume becomes 0, mute
        if (newVolume === 0 && !isMuted) {
            playerRef.current.mute();
            setIsMuted(true);
            localStorage.setItem(MUTED_STORAGE_KEY, "true");
        }
    };

    // Keyboard controls
    const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isFastForwardingRef = useRef(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                return;
            }

            if (e.code === 'Space') {
                e.preventDefault();
                if (!e.repeat && !longPressTimeoutRef.current && !isFastForwardingRef.current) {
                    longPressTimeoutRef.current = setTimeout(() => {
                        longPressTimeoutRef.current = null; // Clear ref to indicate long press activated
                        if (playerRef.current) {
                            playerRef.current.setPlaybackRate(2);
                            isFastForwardingRef.current = true;
                        }
                    }, 200);
                }
            }

            if (e.code === 'ArrowRight') {
                e.preventDefault();
                if (!e.repeat && !longPressTimeoutRef.current && !isFastForwardingRef.current) {
                    longPressTimeoutRef.current = setTimeout(() => {
                        longPressTimeoutRef.current = null; // Clear ref to indicate long press activated
                        if (playerRef.current) {
                            playerRef.current.setPlaybackRate(2);
                            isFastForwardingRef.current = true;
                        }
                    }, 200);
                }
            }

            if (e.code === 'ArrowLeft') {
                e.preventDefault();
                // Seek backward 5s immediately
                if (playerRef.current && !e.repeat) {
                    const curr = playerRef.current.getCurrentTime();
                    seekTo(curr - 5);
                }
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                return;
            }

            if (e.code === 'Space') {
                e.preventDefault();
                if (longPressTimeoutRef.current) {
                    // Short press
                    clearTimeout(longPressTimeoutRef.current);
                    longPressTimeoutRef.current = null;
                    togglePlay();
                } else if (isFastForwardingRef.current) {
                    // Start of long press release
                    if (playerRef.current) playerRef.current.setPlaybackRate(1);
                    isFastForwardingRef.current = false;
                }
            }

            if (e.code === 'ArrowRight') {
                e.preventDefault();
                if (longPressTimeoutRef.current) {
                    // Short press
                    clearTimeout(longPressTimeoutRef.current);
                    longPressTimeoutRef.current = null;
                    if (playerRef.current) {
                        const curr = playerRef.current.getCurrentTime();
                        seekTo(curr + 5);
                    }
                } else if (isFastForwardingRef.current) {
                    // Long press release
                    if (playerRef.current) playerRef.current.setPlaybackRate(1);
                    isFastForwardingRef.current = false;
                }
            }
        };

        // Use capture to ensure we handle events even if focused elements (like Slider) try to consume them
        window.addEventListener('keydown', handleKeyDown, true);
        window.addEventListener('keyup', handleKeyUp, true);
        return () => {
            window.removeEventListener('keydown', handleKeyDown, true);
            window.removeEventListener('keyup', handleKeyUp, true);
            if (longPressTimeoutRef.current) clearTimeout(longPressTimeoutRef.current);
        };
    }, [isPlaying]); // Re-bind when togglePlay/seekTo dependencies change

    const handleMouseDown = (e: React.MouseEvent) => {
        isDraggingRef.current = true;
        setIsDragging(true);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'col-resize';
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDraggingRef.current || !containerRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const newPercentage = ((e.clientX - containerRect.left) / containerRect.width) * 100;

        // Limit the resize range (e.g., between 20% and 80%)
        const constrainedPercentage = Math.max(20, Math.min(80, newPercentage));
        setLeftPanelPercentage(constrainedPercentage);
    };

    const handleMouseUp = () => {
        isDraggingRef.current = false;
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';

        // Save final percentage from ref to avoid stale closure
        localStorage.setItem("layout-left-panel-ratio", percentageRef.current.toString());
    };

    return (
        <div
            className="w-full"
            ref={containerRef}
            style={{
                '--left-panel-width': `${leftPanelPercentage}%`
            } as React.CSSProperties}
        >
            <div className="flex flex-col lg:flex-row gap-0 lg:gap-4 relative">
                {/* Left Panel: Video + Controls */}
                <div
                    className="flex flex-col gap-4 w-full lg:w-[var(--left-panel-width)] shrink-0"
                >
                    {metadata && (
                        <div className="flex flex-col gap-1">
                            <h1 className="text-xl font-semibold leading-tight line-clamp-2" title={metadata.title}>
                                {metadata.title}
                            </h1>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                {metadata.publishDate && (
                                    <span>{formatTimeAgo(metadata.publishDate)}</span>
                                )}
                                <a
                                    href={`https://www.youtube.com/watch?v=${videoId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 hover:text-primary transition-colors"
                                >
                                    <ExternalLink className="h-3 w-3" />
                                    Watch on YouTube
                                </a>
                            </div>
                        </div>
                    )}

                    <Card className="overflow-hidden shadow-sm p-0">
                        <div className={`relative bg-black overflow-hidden aspect-video ${isDragging ? 'pointer-events-none' : ''}`}>
                            <div
                                id={playerId}
                                className="absolute top-0 left-0 w-full h-full"
                            />
                        </div>
                    </Card>

                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-4">
                            <Button variant="outline" size="icon" onClick={togglePlay}>
                                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            </Button>

                            <div className="flex items-center gap-2 group/volume relative">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleMute}>
                                    {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                                </Button>
                                <div className="w-0 overflow-hidden group-hover/volume:w-20 transition-all duration-300 ease-in-out">
                                    <Slider
                                        value={[isMuted ? 0 : volume]}
                                        max={100}
                                        step={1}
                                        onValueChange={handleVolumeChange}
                                        className="cursor-pointer"
                                    />
                                </div>
                                <div className="absolute bottom-full left-10 mb-2 px-1.5 py-0.5 bg-secondary text-secondary-foreground text-[10px] font-mono rounded border shadow-sm opacity-0 group-hover/volume:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                    {isMuted ? 0 : volume}%
                                </div>
                            </div>

                            <div
                                className="flex-1 relative py-2 cursor-pointer group"
                                onMouseMove={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const x = e.clientX - rect.left;
                                    const percent = Math.max(0, Math.min(1, x / rect.width));
                                    setHoverTime(percent * duration);
                                    setHoverPosition(x);
                                }}
                                onMouseLeave={() => {
                                    setHoverTime(null);
                                    setHoverPosition(null);
                                }}
                                onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const x = e.clientX - rect.left;
                                    const percent = Math.max(0, Math.min(1, x / rect.width));
                                    seekTo(percent * duration);
                                }}
                            >
                                <Slider
                                    value={[currentTime]}
                                    max={duration}
                                    step={1}
                                    onValueChange={handleSeek}
                                    className="cursor-pointer"
                                />

                                {hoverTime !== null && (
                                    <div
                                        className="absolute bottom-full mb-1 px-1.5 py-0.5 bg-secondary text-secondary-foreground text-[10px] font-mono rounded border shadow-sm pointer-events-none transform -translate-x-1/2 z-50 whitespace-nowrap"
                                        style={{ left: hoverPosition !== null ? hoverPosition : 0 }}
                                    >
                                        {formatDuration(hoverTime)}
                                    </div>
                                )}
                            </div>

                            <span className="text-xs font-mono font-medium text-primary bg-primary/10 px-2 py-1 rounded min-w-[32px] text-center">
                                {playbackRate}x
                            </span>
                            <span className="text-sm font-mono text-muted-foreground min-w-[100px] text-right">
                                {formatDuration(currentTime)} / {formatDuration(duration)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Resizer Handle (Desktop only) */}
                <div
                    className="hidden lg:flex w-4 bg-transparent hover:bg-primary/10 cursor-col-resize transition-colors items-center justify-center shrink-0 -mx-2 z-10 select-none"
                    onMouseDown={handleMouseDown}
                >
                    <div className="w-1 h-8 bg-muted-foreground/20 rounded-full" />
                </div>

                {/* Right Panel: Transcript */}
                {/* 
                   Mobile: w-full h-[500px]
                   Desktop: flexible width, viewport height
                   We use 'lg:flex-1 lg:w-0' to fill remaining space in flex row
                */}
                <div
                    className="relative w-full lg:flex-1 lg:w-auto h-[500px] lg:h-[calc(100vh-120px)] mt-4 lg:mt-0"
                >
                    <div className="h-full w-full bg-card rounded-lg overflow-hidden border shadow-sm">
                        {transcript.length > 0 ? (
                            <TranscriptView
                                transcript={transcript}
                                currentTime={currentTime}
                                onSeek={seekTo}
                                videoId={videoId}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                <p className="text-sm">Fetching transcript...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
