"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { History, PlayCircle, Clock } from "lucide-react";
import { videoDB, VideoData } from "@/lib/db";

export function PlaylistDialog() {
    const [open, setOpen] = useState(false);
    const [videos, setVideos] = useState<VideoData[]>([]);
    const router = useRouter();

    useEffect(() => {
        if (open) {
            loadVideos();
        }
    }, [open]);

    const loadVideos = async () => {
        const sensitive = await videoDB.getAllVideos();
        setVideos(sensitive);
    };

    const handleVideoClick = (id: string) => {
        setOpen(false);
        router.push(`/v/${id}`);
    };

    const formatTime = (ms: number) => {
        if (!ms) return "";
        const seconds = Math.floor((Date.now() - ms) / 1000);
        if (seconds < 60) return "Just now";
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/10">
                    <History className="h-6 w-6" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-neutral-900 border-neutral-800 text-white p-0 overflow-hidden">
                <DialogHeader className="px-6 py-4 border-b border-neutral-800">
                    <DialogTitle>History</DialogTitle>
                </DialogHeader>
                <div className="h-[60vh] overflow-y-auto p-4 space-y-2">
                    {videos.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-neutral-500 space-y-2">
                            <History className="h-12 w-12 opacity-50" />
                            <p>No watched videos yet</p>
                        </div>
                    ) : (
                        videos.map((video) => (
                            <div
                                key={video.id}
                                onClick={() => handleVideoClick(video.id)}
                                className="flex items-start space-x-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors group"
                            >
                                <div className="flex-shrink-0 w-24 aspect-video bg-neutral-800 rounded overflow-hidden relative">
                                    <img
                                        src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`}
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${video.id}/0.jpg`;
                                        }}
                                        alt={video.metadata?.title || "Video thumbnail"}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <PlayCircle className="w-8 h-8 text-white" />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-blue-400 transition-colors">
                                        {video.metadata?.title || `Video ${video.id}`}
                                    </h4>
                                    <div className="flex items-center text-xs text-neutral-500 mt-1 space-x-2">
                                        {video.metadata?.author && (
                                            <span>
                                                {typeof video.metadata.author === 'object'
                                                    ? (video.metadata.author as any).name || 'Unknown'
                                                    : video.metadata.author}
                                            </span>
                                        )}
                                        {video.updatedAt && (
                                            <>
                                                <span>•</span>
                                                <span className="flex items-center">
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    {formatTime(video.updatedAt)}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
