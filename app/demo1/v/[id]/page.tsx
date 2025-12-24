import { VideoPlayerWrapper } from "@/components/video-player-wrapper";

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function VideoPage({ params }: PageProps) {
    const { id } = await params;

    return (
        <div className="w-full px-4 py-6">
            <h1 className="text-2xl font-bold mb-4">Playing Video: {id}</h1>
            <VideoPlayerWrapper videoId={id} />
        </div>
    );
}
