"use client";
import { type AIProvider } from "../aiProvider";

export const openaiProvider: AIProvider = {
    name: "openai",
    displayName: "OpenAI",

    async generateCompletion(systemPrompt, userPrompt, model, temperature, apiKey) {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
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
            throw new Error(`OpenAI API Error: ${(error as any).error?.message || response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "";
        const totalTokens = data.usage?.total_tokens || Math.round((systemPrompt.length + userPrompt.length + content.length) / 4);

        return { content, totalTokens, model };
    },

    async *generateCompletionStream(systemPrompt, userPrompt, model, temperature, apiKey) {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
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
                stream_options: { include_usage: true },
            }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(`OpenAI Stream Error: ${(error as any).error?.message || response.statusText}`);
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

                    if (trimmedLine === "data: [DONE]") break;

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
            { value: "gpt-4o", label: "GPT-4o" },
            { value: "gpt-4o-mini", label: "GPT-4o Mini" },
            { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
            { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
        ];
    },
};
