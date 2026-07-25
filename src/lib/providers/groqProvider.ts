"use client";
import { type AIProvider, type ChatMessage } from "../aiProvider";

export const groqProvider: AIProvider = {
    name: "groq",
    displayName: "Groq",

    async generateCompletion(messages, model, temperature, apiKey, signal) {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model,
                messages,
                temperature,
                max_tokens: 8192,
            }),
            signal,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(`Groq API Error: ${(error as any).error?.message || response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "";
        const totalTokens = data.usage?.total_tokens || Math.round(content.length / 4);

        return { content, totalTokens, model };
    },

    async *generateCompletionStream(messages, model, temperature, apiKey, signal) {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "text/event-stream",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model,
                messages,
                temperature,
                max_tokens: 8192,
                stream: true,
            }),
            signal,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(`Groq Stream Error: ${(error as any).error?.message || response.statusText}`);
        }

        if (!response.body) {
            throw new Error("No response body returned from stream.");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";
        let totalTokens = 0;

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");

                buffer = lines.pop() || "";

                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (!trimmedLine || trimmedLine.startsWith(":")) continue;

                    if (trimmedLine === "data: [DONE]") return { totalTokens, model };

                    if (trimmedLine.startsWith("data: ")) {
                        try {
                            const data = JSON.parse(trimmedLine.slice(6));
                            const content = data.choices?.[0]?.delta?.content;
                            if (content) {
                                totalTokens += Math.round(content.length / 4) || 1;
                                yield content;
                            }
                            if (data.usage?.total_tokens) {
                                totalTokens = data.usage.total_tokens;
                            }
                        } catch (e) {
                            console.warn("Error parsing stream chunk", trimmedLine, e);
                        }
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }

        return { totalTokens, model };
    },

    async testConnection(model, apiKey) {
        try {
            const result = await this.generateCompletion(
                [
                    { role: "system", content: "You are a test bot." },
                    { role: "user", content: "Reply with exactly: OK" },
                ],
                model,
                0,
                apiKey
            );
            return result.content.includes("OK");
        } catch {
            return false;
        }
    },

    getModels() {
        return [
            { value: "llama-3.3-70b-versatile", label: "LLaMA 3.3 70B Versatile" },
            { value: "llama-3.1-8b-instant", label: "LLaMA 3.1 8B Instant" },
            { value: "mixtral-8x7b-32768", label: "Mixtral 8x7B" },
            { value: "gemma2-9b-it", label: "Gemma 2 9B" },
        ];
    },
};
