"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Youtube } from "lucide-react";
import { toast } from "sonner";
import { Settings } from "@/components/settings";

import { PlaylistDialog } from "@/components/playlist-dialog";

export default function Home() {
    const [url, setUrl] = useState("");
    const router = useRouter();

    const handleGo = () => {
        let videoId = "";
        try {
            const u = new URL(url);
            if (u.hostname === "youtu.be") {
                videoId = u.pathname.slice(1);
            } else if (u.hostname.includes("youtube.com")) {
                videoId = u.searchParams.get("v") || "";
            }
        } catch (e) {
            // assume input is video id if not a url
            if (url.length === 11) {
                videoId = url;
            }
        }

        if (videoId) {
            router.push(`/v/${videoId}`);
        } else {
            toast.error("Invalid YouTube URL or ID");
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-black text-white px-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />

            {/* Settings & Playlists Buttons */}
            <div className="absolute top-4 right-4 z-20 flex items-center space-x-2">
                <PlaylistDialog />
                <Settings />
            </div>

            <div className="z-10 flex flex-col items-center w-full max-w-2xl space-y-8 text-center">
                <div className="space-y-4">
                    <div className="flex items-center justify-center space-x-2 mb-6">
                        <img src="/logo.svg" alt="VidRead Logo" className="w-20 h-20 drop-shadow-[0_0_25px_rgba(59,130,246,0.6)]" />
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tighter bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent pb-2">
                        VidRead
                    </h1>
                    <p className="text-lg md:text-xl text-gray-400 max-w-md mx-auto">
                        Read videos like articles. Paste a YouTube link below to start.
                    </p>
                </div>

                <div className="flex w-full items-center space-x-2 relative group max-w-lg">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-500">
                        <Search className="h-5 w-5" />
                    </div>
                    <Input
                        type="text"
                        placeholder="Paste YouTube URL here..."
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleGo();
                        }}
                        className="h-14 pl-12 pr-4 rounded-2xl bg-white/5 border-white/10 text-lg placeholder:text-gray-500 focus-visible:ring-purple-500/50 focus-visible:border-purple-500/50 transition-all duration-300"
                    />
                    <Button
                        onClick={handleGo}
                        size="lg"
                        className="h-14 px-8 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium shadow-lg shadow-purple-900/20 transition-all duration-300 hover:scale-105"
                    >
                        Play
                    </Button>
                </div>
            </div>
        </main>
    );
}

