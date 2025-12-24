const DB_NAME = 'youtube-cut-db';
const STORE_NAME = 'videos';
const DB_VERSION = 2; // Increment version for new store

export interface VideoMeta {
    title?: string;
    author?: string;
    description?: string;
    publishDate?: string;
}

export interface TranscriptSegment {
    text: string;
    start: number;
    duration: number;
}

export interface VideoData {
    id: string;
    metadata?: VideoMeta;
    transcript?: TranscriptSegment[];
    translations?: Record<string, Record<number, string>>; // lang -> index -> text
    lastPlaybackTime?: number;
    updatedAt: number;
}

class VideoDB {
    private dbPromise: Promise<IDBDatabase> | null = null;
    private saveQueue: Promise<void> = Promise.resolve();

    private getDB(): Promise<IDBDatabase> {
        if (!this.dbPromise) {
            this.dbPromise = new Promise((resolve, reject) => {
                const request = indexedDB.open(DB_NAME, DB_VERSION);

                request.onupgradeneeded = (event) => {
                    const db = (event.target as IDBOpenDBRequest).result;
                    if (!db.objectStoreNames.contains(STORE_NAME)) {
                        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    }
                    // Clean up old store if exists
                    if (db.objectStoreNames.contains('translations')) {
                        db.deleteObjectStore('translations');
                    }
                };

                request.onsuccess = (event) => {
                    resolve((event.target as IDBOpenDBRequest).result);
                };

                request.onerror = (event) => {
                    reject((event.target as IDBOpenDBRequest).error);
                };
            });
        }
        return this.dbPromise;
    }

    async getVideo(id: string): Promise<VideoData | undefined> {
        try {
            const db = await this.getDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(STORE_NAME, 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.get(id);

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('VideoDB get error:', error);
            return undefined;
        }
    }

    async saveVideo(video: VideoData): Promise<void> {
        try {
            const db = await this.getDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(STORE_NAME, 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.put(video);

                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('VideoDB save error:', error);
        }
    }

    async saveTranslation(videoId: string, language: string, index: number, text: string): Promise<void> {
        // Determine if we need to queue this
        // We attach this operation to the end of the current queue
        this.saveQueue = this.saveQueue.then(async () => {
            try {
                const video = await this.getVideo(videoId);
                if (!video) {
                    console.warn("Saving translation for non-existent video", videoId);
                    return;
                }

                if (!video.translations) video.translations = {};
                if (!video.translations[language]) video.translations[language] = {};

                // If value hasn't changed, skip write (optimization)
                if (video.translations[language][index] === text) return;

                video.translations[language][index] = text;
                video.updatedAt = Date.now();

                await this.saveVideo(video);
            } catch (error) {
                console.error('VideoDB saveTranslation error:', error);
            }
        });

        return this.saveQueue;
    }

    async savePlaybackTime(videoId: string, time: number): Promise<void> {
        // Debounce or queue? For playback time, we probably don't need strict queuing like translations 
        // because it's overwritten rapidly. But using the queue ensures we don't conflict with translation saves.
        // Actually, let's allow it to float, but we must read fresh data.
        // But if saveTranslation is writing, we might overwrite.
        // So we SHOULD use the queue to be safe against race conditions with translation saving.

        // Optimization: only save if change is significant? (e.g. > 1s). 
        // For now, let's just queue it.

        this.saveQueue = this.saveQueue.then(async () => {
            try {
                const video = await this.getVideo(videoId);
                if (!video) return; // Can't save time for unknown video

                video.lastPlaybackTime = time;
                video.updatedAt = Date.now();

                await this.saveVideo(video);
            } catch (error) {
                console.error('VideoDB savePlaybackTime error:', error);
            }
        });
        return this.saveQueue;
    }
}

export const videoDB = new VideoDB();
