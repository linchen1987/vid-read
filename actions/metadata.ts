"use server";

export interface VideoMetadata {
    title: string;
    author_name?: string;
    author_url?: string;
    thumbnail_url?: string;
    description?: string;
    publish_date?: string; // ISO string
}

export async function fetchVideoMetadata(videoId: string): Promise<VideoMetadata | null> {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // 1. Try Supadata
    const apiKey = process.env.SUPADATA_API_KEY;
    if (apiKey) {
        try {
            // Reference uses 'id' param, changing to match strict pattern
            const response = await fetch(
                `https://api.supadata.ai/v1/youtube/video?id=${videoId}`,
                {
                    headers: {
                        "x-api-key": apiKey,
                    },
                }
            );

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
                console.warn(`Supadata metadata fetch failed: ${response.status} ${response.statusText}`);
            }
        } catch (e) {
            console.error("Supadata metadata fetch error:", e);
        }
    }

    // 2. Fallback to YouTube oEmbed
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
                // oEmbed doesn't provide description or publish date usually, but it's a fallback
            };
        } else {
            console.warn(`YouTube oEmbed fetch failed: ${response.status}`);
        }
    } catch (e) {
        console.error("YouTube oEmbed fetch error:", e);
    }

    return null;
}
