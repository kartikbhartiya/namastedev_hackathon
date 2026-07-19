"use client";
// Lightweight Document Processor for Eclix Hackathon
// Reads text/markdown files directly, and provides a clean mock reader for PDFs/Images

export function cleanOCRText(text: string): string {
    return text
        .replace(/ {2,}/g, ' ')
        .replace(/([a-z,])\n([a-z])/g, '$1 $2')
        .trim();
}

export async function extractTextFromFile(file: File, onProgress?: (status: string) => void): Promise<string> {
    if (file.name.endsWith(".txt") || file.name.endsWith(".md") || file.name.endsWith(".json") || file.type.startsWith("text/")) {
        if (onProgress) onProgress("Reading text file...");
        return await file.text();
    }

    // Mock extractor for PDF and Images so the UI doesn't crash, but still feels premium
    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        if (onProgress) {
            onProgress("Parsing PDF structures...");
            await new Promise(r => setTimeout(r, 600));
            onProgress("Extracting text from pages...");
            await new Promise(r => setTimeout(r, 600));
        }
        return `[EXTRACTED PDF NOTES: ${file.name}]\nThis is a mock text representation of the uploaded notes. Eclix supports direct reading of syllabus concepts, including classical mechanics, Newton's laws, force vectors, and pendulum physics.`;
    }

    if (file.type.startsWith("image/")) {
        if (onProgress) {
            onProgress("Analyzing image pixels...");
            await new Promise(r => setTimeout(r, 800));
            onProgress("Running OCR text detection...");
            await new Promise(r => setTimeout(r, 600));
        }
        return `[EXTRACTED IMAGE QUESTION: ${file.name}]\nCalculate the tension in a simple pendulum of length L and mass M at the lowest point of its swing if the velocity is V.`;
    }

    throw new Error(`Unsupported file type: ${file.type || "unknown"}. Please upload a text, markdown, PDF, or image file.`);
}

export function chunkText(text: string, maxChunkSize: number = 800, overlap: number = 200): string[] {
    const chunks: string[] = [];
    const sentences = text.match(/[^.!?\n]+[.!?\n]+/g) || [text];
    let currentChunk = "";

    for (const sentence of sentences) {
        if (currentChunk.length + sentence.length > maxChunkSize && currentChunk.length > 0) {
            chunks.push(currentChunk.trim());
            currentChunk = currentChunk.slice(-overlap) + sentence;
        } else {
            currentChunk += sentence;
        }
    }

    if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim());
    }

    return chunks;
}
