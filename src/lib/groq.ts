"use client";
// AI Response Router — Provider-Agnostic
// Provides fallback routing between Groq and OpenAI

import { trackAIRequest, isAIPaused, getAIUsageStats, getAILimits } from "./aiUsageTracker";
import {
    registerProvider,
    getProvider,
    loadProviderConfig,
    type AIProviderSettings,
    type ChatMessage,
} from "./aiProvider";
import { getGlobalMemoryContext } from "./aiMemory";

// Register available providers
import { groqProvider } from "./providers/groqProvider";
import { openaiProvider } from "./providers/openaiProvider";

registerProvider(groqProvider);
registerProvider(openaiProvider);

export interface ModelOverride {
    provider: string;
    model: string;
}

export async function generateAIResponse(
    messagesOrSystemPrompt: string | ChatMessage[],
    userPrompt?: string,
    temperature: number = 0.7,
    signal?: AbortSignal,
    modelOverride?: ModelOverride
): Promise<string> {
    if (isAIPaused()) {
        throw new Error("AI services are currently paused.");
    }

    const stats = getAIUsageStats();
    const limits = getAILimits();
    if (stats.requestsToday >= limits.requestsLimit) {
        throw new Error("Daily AI request limit reached.");
    }

    const config = await loadProviderConfig();
    const startTime = Date.now();
    const memoryContext = getGlobalMemoryContext();

    let messages: ChatMessage[] = [];
    if (Array.isArray(messagesOrSystemPrompt)) {
        messages = [...messagesOrSystemPrompt];
        if (memoryContext && messages.length > 0 && messages[0].role === "system") {
            messages[0] = {
                ...messages[0],
                content: messages[0].content + memoryContext,
            };
        }
    } else {
        const finalSystemPrompt = messagesOrSystemPrompt + memoryContext;
        messages = [
            { role: "system", content: finalSystemPrompt },
            { role: "user", content: userPrompt || "" },
        ];
    }

    const activeProvider = modelOverride?.provider || config.activeProvider;

    try {
        return await callProvider(config, activeProvider, messages, temperature, startTime, signal, modelOverride?.model);
    } catch (primaryError) {
        console.error(`Primary provider (${activeProvider}) failed:`, primaryError);

        const fallback = config.fallbackProvider || (activeProvider === "groq" ? "openai" : "groq");
        if (fallback && fallback !== activeProvider) {
            console.log(`Attempting fallback provider: ${fallback}`);
            try {
                return await callProvider(config, fallback, messages, temperature, startTime, signal);
            } catch (fallbackError) {
                console.error(`Fallback provider (${fallback}) also failed:`, fallbackError);
                throw new Error(
                    `AI generation failed. Primary: ${(primaryError as Error).message}. Fallback: ${(fallbackError as Error).message}`
                );
            }
        }

        throw primaryError;
    }
}

async function callProvider(
    config: AIProviderSettings,
    providerName: string,
    messages: ChatMessage[],
    temperature: number,
    startTime: number,
    signal?: AbortSignal,
    overrideModelName?: string
): Promise<string> {
    const provider = getProvider(providerName);
    if (!provider) {
        throw new Error(`AI provider "${providerName}" is not registered.`);
    }

    const providerConfig = config.providerConfigs[providerName];
    if (!providerConfig || !providerConfig.apiKey) {
        throw new Error(
            `No API key configured for ${provider.displayName}. Please configure your API key in your environment variables (.env).`
        );
    }

    const modelToUse = overrideModelName || providerConfig.model;

    const result = await provider.generateCompletion(
        messages,
        modelToUse,
        temperature,
        providerConfig.apiKey,
        signal
    );

    const duration = Date.now() - startTime;
    trackAIRequest(result.totalTokens, duration, `${providerName}/${result.model}`);

    return result.content;
}

export async function* generateAIResponseStream(
    messagesOrSystemPrompt: string | ChatMessage[],
    userPromptOrTemperature: string | number = 0.5,
    temperature = 0.5,
    signal?: AbortSignal,
    modelOverride?: ModelOverride
): AsyncGenerator<string, void, unknown> {
    const config = await loadProviderConfig();
    const providerName = modelOverride?.provider || config.activeProvider;
    const provider = getProvider(providerName);
    const providerConfig = config.providerConfigs[providerName];

    if (!provider || !providerConfig || !providerConfig.apiKey) {
        throw new Error("Active AI provider is not configured. Please add an API key in settings.");
    }

    const startTime = Date.now();
    const memoryContext = getGlobalMemoryContext();

    let messages: ChatMessage[] = [];
    let actualTemperature = 0.5;

    if (Array.isArray(messagesOrSystemPrompt)) {
        messages = [...messagesOrSystemPrompt];
        actualTemperature = typeof userPromptOrTemperature === "number" ? userPromptOrTemperature : temperature;
        if (memoryContext && messages.length > 0 && messages[0].role === "system") {
            messages[0] = {
                ...messages[0],
                content: messages[0].content + memoryContext,
            };
        }
    } else {
        const finalSystemPrompt = messagesOrSystemPrompt + memoryContext;
        const userPrompt = typeof userPromptOrTemperature === "string" ? userPromptOrTemperature : "";
        actualTemperature = temperature;
        messages = [
            { role: "system", content: finalSystemPrompt },
            { role: "user", content: userPrompt },
        ];
    }

    const modelToUse = modelOverride?.model || providerConfig.model;

    try {
        if (!provider.generateCompletionStream) {
            const result = await provider.generateCompletion(
                messages,
                modelToUse,
                actualTemperature,
                providerConfig.apiKey,
                signal
            );
            const duration = Date.now() - startTime;
            trackAIRequest(result.totalTokens, duration, `${providerName}/${result.model}`);
            yield result.content;
            return;
        }

        const stream = provider.generateCompletionStream(
            messages,
            modelToUse,
            actualTemperature,
            providerConfig.apiKey,
            signal
        );

        let finalResult = "";
        for await (const chunk of stream) {
            finalResult += chunk;
            yield chunk;
        }

        const duration = Date.now() - startTime;
        trackAIRequest(Math.round(finalResult.length / 4), duration, `${providerName}/${modelToUse}`);
    } catch (err) {
        if ((err as Error)?.name === "AbortError") {
            console.log("Stream generation aborted by user.");
            return;
        }
        console.error("Stream generation error:", err);
        throw err;
    }
}

/**
 * Prompt Auto-Enhancer ("Magic Wand")
 * Takes a simple user draft and rewrites it into a high-yield structured learning prompt.
 */
export async function enhanceUserPrompt(draftPrompt: string): Promise<string> {
    if (!draftPrompt.trim()) return draftPrompt;

    const systemPrompt = `You are Orbit Prompt Optimizer.
Your job is to rewrite a student's brief learning/coding question into an expanded, high-yield structured prompt.
Return ONLY the expanded prompt text. Do NOT add preamble or explanations.
Structure the expanded prompt to ask for:
1. Core intuition & mechanics
2. Visual/step-by-step breakdown
3. Concrete production code snippet or example
4. Common edge cases and time/space complexity analysis if applicable.`;

    try {
        const enhanced = await generateAIResponse(
            [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Expand this query: "${draftPrompt}"` },
            ],
            undefined,
            0.6
        );
        return enhanced.trim() || draftPrompt;
    } catch (err) {
        console.error("Prompt enhancement failed:", err);
        return draftPrompt;
    }
}
