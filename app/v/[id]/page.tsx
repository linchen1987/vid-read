import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { VideoPlayerWrapper } from "@/components/video-player-wrapper";

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function VideoPage({ params }: PageProps) {
    const { id } = await params;

    return (
        <div className="w-full min-h-screen bg-black dark relative flex flex-col text-foreground">
            {/* Header / Back Navigation */}
            <div className="w-full px-6 py-4 flex items-center">
                <Link
                    href="/"
                    className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <div className="p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">Home</span>
                </Link>
            </div>

            <div className="w-full px-4 pb-10 flex-1 flex flex-col items-center">
                <VideoPlayerWrapper videoId={id} />
            </div>
        </div>
    );
}
