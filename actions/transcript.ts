"use server";

export async function fetchTranscript(videoId: string) {
    const apiKey = process.env.SUPADATA_API_KEY;
    if (!apiKey) {
        throw new Error("Missing SUPADATA_API_KEY");
    }

    const response = await fetch(
        `https://api.supadata.ai/v1/transcript?url=https://www.youtube.com/watch?v=${videoId}&lang=en`,
        {
            headers: {
                "x-api-key": apiKey,
            },
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to fetch transcript: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.content || [];

    return content.map((item: any) => ({
        text: item.text,
        start: item.offset / 1000,
        duration: item.duration / 1000,
    }));
}
