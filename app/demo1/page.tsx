"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DemoEntryPage() {
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
            router.push(`/demo1/v/${videoId}`);
        } else {
            alert("Invalid YouTube URL or ID");
        }
    };

    return (
        <div className="container mx-auto p-8 max-w-md">
            <Card>
                <CardHeader>
                    <CardTitle>YouTube Player Demo</CardTitle>
                    <CardDescription>Enter a YouTube URL to play</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex w-full items-center space-x-2">
                        <Input
                            type="text"
                            placeholder="https://www.youtube.com/watch?v=..."
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleGo();
                            }}
                        />
                        <Button onClick={handleGo}>Go</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
