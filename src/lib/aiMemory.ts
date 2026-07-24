"use client";

const MEMORY_KEY = "orbit_global_memory";
const MAX_MEMORIES = 15;

export interface MemoryEntry {
    timestamp: number;
    source: string; // e.g., 'AITutor', 'Interview', 'Debate', 'Code'
    summary: string;
}

/**
 * Adds a new memory to the global context.
 */
export function addGlobalMemory(source: string, summary: string) {
    if (typeof window === "undefined") return;

    try {
        const stored = localStorage.getItem(MEMORY_KEY);
        let memories: MemoryEntry[] = stored ? JSON.parse(stored) : [];

        // Add new memory
        memories.push({
            timestamp: Date.now(),
            source,
            summary
        });

        // Keep only the most recent MAX_MEMORIES
        if (memories.length > MAX_MEMORIES) {
            memories = memories.slice(memories.length - MAX_MEMORIES);
        }

        localStorage.setItem(MEMORY_KEY, JSON.stringify(memories));
    } catch (err) {
        console.error("Failed to save global memory", err);
    }
}

/**
 * Retrieves the formatted global memory context for AI prompts.
 */
export function getGlobalMemoryContext(): string {
    if (typeof window === "undefined") return "";

    try {
        const stored = localStorage.getItem(MEMORY_KEY);
        if (!stored) return "";

        const memories: MemoryEntry[] = JSON.parse(stored);
        if (memories.length === 0) return "";

        let context = "\n\n[GLOBAL USER CONTEXT & MEMORY]\n";
        context += "The following are recent interactions and facts about the user across the app:\n";
        
        memories.forEach((mem, index) => {
            const date = new Date(mem.timestamp).toLocaleTimeString();
            context += `- [${mem.source} at ${date}]: ${mem.summary}\n`;
        });

        context += "Use this context to personalize your responses, remember their strengths/weaknesses, and reference past interactions if highly relevant.\n";

        return context;
    } catch (err) {
        console.error("Failed to read global memory", err);
        return "";
    }
}

/**
 * Clears the global memory.
 */
export function clearGlobalMemory() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(MEMORY_KEY);
}
