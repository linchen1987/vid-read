import { VideoPlayer } from "@/components/video-player";

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function VideoPage({ params }: PageProps) {
    const { id } = await params;

    return (
        <div className="container mx-auto p-8">
            <h1 className="text-2xl font-bold mb-4">Playing Video: {id}</h1>
            <VideoPlayer videoId={id} />
        </div>
    );
}
