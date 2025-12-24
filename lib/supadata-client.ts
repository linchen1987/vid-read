import { fetchProxy } from "./proxy";
import { VideoMetadata } from "@/actions/metadata";

// Re-export type since we might delete the action later, 
// but for now we can just redefine it or import it if we keep the file for types.
// Let's redefine for safety if we delete the file.
export interface ClientVideoMetadata {
    title: string;
    author_name?: string;
    author_url?: string;
    thumbnail_url?: string;
    description?: string;
    publish_date?: string; // ISO string
}

export async function fetchTranscript(videoId: string, apiKey: string) {
    if (!apiKey) {
        throw new Error("Missing Supadata API Key");
    }

    const targetUrl = `https://api.supadata.ai/v1/transcript?url=https://www.youtube.com/watch?v=${videoId}&lang=en`;

    const response = await fetchProxy(targetUrl, {
        headers: {
            "x-api-key": apiKey,
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`Supadata transcript error: ${response.status} ${errorText}`);
        throw new Error(`Failed to fetch transcript (${response.status}): ${errorText || response.statusText}`);
    }

    const data = await response.json();
    const content = data.content || [];

    return content.map((item: any) => ({
        text: item.text,
        start: item.offset / 1000,
        duration: item.duration / 1000,
    }));
}

export async function fetchVideoMetadata(videoId: string, apiKey?: string): Promise<ClientVideoMetadata | null> {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // 1. Try Supadata
    if (apiKey) {
        try {
            const targetUrl = `https://api.supadata.ai/v1/youtube/video?id=${videoId}`;
            const response = await fetchProxy(targetUrl, {
                headers: {
                    "x-api-key": apiKey,
                },
            });

            if (response.ok) {
                const data = await response.json();
                return {
                    title: data.title,
                    author_name: data.channel || data.author,
                    description: data.description,
                    publish_date: data.uploadDate,
                    thumbnail_url: data.thumbnail
                };
            } else {
                const errorText = await response.text();
                console.warn(`Supadata metadata fetch failed: ${response.status} ${errorText}`);
            }
        } catch (e) {
            console.error("Supadata metadata fetch error:", e);
        }
    }

    // 2. Fallback to YouTube oEmbed (No proxy needed usually, but CORS might block client-side)
    // YouTube oEmbed supports CORS, so direct fetch should work.
    try {
        const oembedUrl = `https://www.youtube.com/oembed?url=${videoUrl}&format=json`;
        const response = await fetch(oembedUrl);

        if (response.ok) {
            const data = await response.json();
            return {
                title: data.title,
                author_name: data.author_name,
                author_url: data.author_url,
                thumbnail_url: data.thumbnail_url,
            };
        } else {
            console.warn(`YouTube oEmbed fetch failed: ${response.status}`);
        }
    } catch (e) {
        console.error("YouTube oEmbed fetch error:", e);
    }

    return null;
}
