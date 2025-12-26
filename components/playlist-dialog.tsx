"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRef } from "react";
import { History, PlayCircle, Clock, Download, Upload, Trash2 } from "lucide-react";
import { videoDB, VideoData } from "@/lib/db";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function PlaylistDialog() {
    const [open, setOpen] = useState(false);
    const [videos, setVideos] = useState<VideoData[]>([]);
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleExport = async () => {
        try {
            const allVideos = await videoDB.getAllVideos();
            const blob = new Blob([JSON.stringify(allVideos, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `vidread-history-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success("History exported successfully");
        } catch (error) {
            console.error("Export failed:", error);
            toast.error("Failed to export history");
        }
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const content = e.target?.result as string;
                const importedVideos = JSON.parse(content);

                if (!Array.isArray(importedVideos)) {
                    throw new Error("Invalid format");
                }

                let count = 0;
                for (const video of importedVideos) {
                    if (video.id) {
                        await videoDB.saveVideo(video);
                        count++;
                    }
                }

                await loadVideos();
                toast.success(`Imported ${count} videos successfully`);
            } catch (error) {
                console.error("Import failed:", error);
                toast.error("Failed to import history");
            } finally {
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
            }
        };
        reader.readAsText(file);
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

    const handleDelete = async (id: string) => {
        try {
            await videoDB.deleteVideo(id);
            setVideos((prev) => prev.filter((v) => v.id !== id));
            toast.success("Video deleted from history");
        } catch (error) {
            console.error("Delete failed:", error);
            toast.error("Failed to delete video");
        }
    };

    const [isImportOpen, setIsImportOpen] = useState(false);
    const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleMouseEnter = () => {
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }
        setIsImportOpen(true);
    };

    const handleMouseLeave = () => {
        closeTimeoutRef.current = setTimeout(() => {
            setIsImportOpen(false);
        }, 200);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/10">
                    <History className="h-6 w-6" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-neutral-900 border-neutral-800 text-white p-0 overflow-hidden text-left">
                <DialogHeader className="px-6 py-4 border-b border-neutral-800">
                    <DialogTitle>History</DialogTitle>
                </DialogHeader>
                <div className="absolute right-12 top-3 flex items-center gap-2">
                    <Popover open={isImportOpen} onOpenChange={setIsImportOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-neutral-400 hover:text-white hover:bg-white/10"
                                title="Import/Export"
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={handleMouseLeave}
                            >
                                <Upload className="h-4 w-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent
                            className="w-40 bg-neutral-900 border-neutral-800 p-1"
                            align="end"
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                        >
                            <div className="flex flex-col gap-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start h-8 text-sm font-normal text-neutral-300 hover:text-white hover:bg-white/10"
                                    onClick={() => {
                                        fileInputRef.current?.click();
                                        setIsImportOpen(false);
                                    }}
                                >
                                    <Upload className="h-3 w-3 mr-2" />
                                    Import
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start h-8 text-sm font-normal text-neutral-300 hover:text-white hover:bg-white/10"
                                    onClick={() => {
                                        handleExport();
                                        setIsImportOpen(false);
                                    }}
                                >
                                    <Download className="h-3 w-3 mr-2" />
                                    Download
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".json"
                        onChange={handleImport}
                    />
                </div>
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
                                className="flex items-start space-x-3 p-3 rounded-lg hover:bg-white/5 transition-colors group relative"
                            >
                                <div
                                    className="flex items-start space-x-3 flex-1 cursor-pointer"
                                    onClick={() => handleVideoClick(video.id)}
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
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-neutral-500 hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-2"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 bg-neutral-900 border-neutral-800 p-3">
                                        <div className="space-y-3">
                                            <p className="text-sm text-neutral-300">
                                                Delete this video? This action cannot be undone.
                                            </p>
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 text-neutral-400 hover:text-white"
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    className="h-8 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 border border-red-500/20"
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        await handleDelete(video.id);
                                                    }}
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
