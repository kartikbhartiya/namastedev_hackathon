"use client";
import { type AIProvider } from "../aiProvider";

export const groqProvider: AIProvider = {
    name: "groq",
    displayName: "Groq",

    async generateCompletion(systemPrompt, userPrompt, model, temperature, apiKey) {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt },
                ],
                temperature,
                max_tokens: 4096,
            }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(`Groq API Error: ${(error as any).error?.message || response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "";
        const inputTokens = (systemPrompt.length + userPrompt.length) / 4;
        const outputTokens = data.usage?.completion_tokens || content.length / 4;
        const totalTokens = data.usage?.total_tokens || Math.round(inputTokens + outputTokens);

        return { content, totalTokens, model };
    },

    async *generateCompletionStream(systemPrompt, userPrompt, model, temperature, apiKey) {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "text/event-stream",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt },
                ],
                temperature,
                max_tokens: 4096,
                stream: true,
            }),
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
        let totalTokens = Math.round((systemPrompt.length + userPrompt.length) / 4);

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
                "You are a test bot.",
                "Reply with exactly: OK",
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
