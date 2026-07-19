"use client";
// High-performance, lightweight keyword-matching vector store emulator for Eclix Hackathon
// Avoids downloading heavy LLM models, running 100% offline with zero latency.

export interface VectorDocument {
    id: string;
    text: string;
    metadata: {
        fileName: string;
        fileType: string;
        chunkIndex: number;
        [key: string]: any;
    };
    embedding: number[];
}

class LocalVectorStore {
    private documents: VectorDocument[] = [];
    public isReady = true;

    async init() {
        return Promise.resolve();
    }

    async generateEmbedding(text: string): Promise<number[]> {
        // Return dummy embedding values
        return Array.from({ length: 384 }, () => Math.random());
    }

    async addDocuments(
        texts: string[],
        metadataList: Partial<VectorDocument['metadata']>[]
    ): Promise<void> {
        for (let i = 0; i < texts.length; i++) {
            const text = texts[i];
            const meta = metadataList[i] || {};
            this.documents.push({
                id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
                text,
                metadata: meta as VectorDocument['metadata'],
                embedding: []
            });
        }
        return Promise.resolve();
    }

    /**
     * Term-matching scoring (TF-IDF approximation)
     */
    async search(query: string, limit: number = 3): Promise<(VectorDocument & { score: number })[]> {
        if (this.documents.length === 0) return [];

        const queryTerms = query.toLowerCase().split(/\W+/).filter(t => t.length > 2);
        if (queryTerms.length === 0) {
            return this.documents.slice(0, limit).map(d => ({ ...d, score: 0.5 }));
        }

        const scoredDocs = this.documents.map(doc => {
            const docText = doc.text.toLowerCase();
            let matches = 0;

            for (const term of queryTerms) {
                if (docText.includes(term)) {
                    matches++;
                }
            }

            // Calculate similarity score between 0 and 1
            const score = matches / queryTerms.length;

            return {
                ...doc,
                score
            };
        });

        // Sort descending by score, filtering out completely non-matching documents where possible
        scoredDocs.sort((a, b) => b.score - a.score);
        return scoredDocs.slice(0, limit);
    }

    getAllDocuments() {
        return this.documents;
    }

    getFiles() {
        const files = new Set<string>();
        for (const doc of this.documents) {
            files.add(doc.metadata.fileName);
        }
        return Array.from(files);
    }

    clearSessionDocuments(fileName: string) {
        this.documents = this.documents.filter(doc => doc.metadata.fileName !== fileName);
    }

    clear() {
        this.documents = [];
    }
}

export const vectorStore = new LocalVectorStore();
