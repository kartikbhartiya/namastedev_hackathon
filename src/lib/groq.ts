"use client";
// AI Response Router — Provider-Agnostic
// Provides fallback routing between Groq and OpenAI

import { trackAIRequest, isAIPaused, getAIUsageStats, getAILimits } from "./aiUsageTracker";
import {
    registerProvider,
    getProvider,
    loadProviderConfig,
    type AIProviderSettings,
} from "./aiProvider";

// Register available providers
import { groqProvider } from "./providers/groqProvider";
import { openaiProvider } from "./providers/openaiProvider";

registerProvider(groqProvider);
registerProvider(openaiProvider);

export async function generateAIResponse(
    systemPrompt: string,
    userPrompt: string,
    temperature: number = 0.7
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

    try {
        return await callProvider(config, config.activeProvider, systemPrompt, userPrompt, temperature, startTime);
    } catch (primaryError) {
        console.error(`Primary provider (${config.activeProvider}) failed:`, primaryError);

        // Try fallback
        const fallback = config.fallbackProvider || (config.activeProvider === "groq" ? "openai" : "groq");
        if (fallback && fallback !== config.activeProvider) {
            console.log(`Attempting fallback provider: ${fallback}`);
            try {
                return await callProvider(config, fallback, systemPrompt, userPrompt, temperature, startTime);
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
    systemPrompt: string,
    userPrompt: string,
    temperature: number,
    startTime: number
): Promise<string> {
    const provider = getProvider(providerName);
    if (!provider) {
        throw new Error(`AI provider "${providerName}" is not registered.`);
    }

    const providerConfig = config.providerConfigs[providerName];
    if (!providerConfig || !providerConfig.apiKey) {
        throw new Error(
            `No API key configured for ${provider.displayName}. ` +
            `Please configure it in the Demo Settings panel on the home page.`
        );
    }

    const result = await provider.generateCompletion(
        systemPrompt,
        userPrompt,
        providerConfig.model,
        temperature,
        providerConfig.apiKey
    );

    const duration = Date.now() - startTime;
    trackAIRequest(result.totalTokens, duration, `${providerName}/${result.model}`);

    return result.content;
}

export async function* generateAIResponseStream(
    systemPrompt: string,
    userPrompt: string,
    temperature = 0.5
): AsyncGenerator<string, void, unknown> {
    const config = await loadProviderConfig();
    const providerName = config.activeProvider;
    const provider = getProvider(providerName);
    const providerConfig = config.providerConfigs[providerName];

    if (!provider || !providerConfig || !providerConfig.apiKey) {
        throw new Error("Active AI provider is not configured. Please add an API key in settings.");
    }

    const startTime = Date.now();

    try {
        if (!provider.generateCompletionStream) {
            // Fallback to non-streaming if provider doesn't support it
            const result = await provider.generateCompletion(
                systemPrompt,
                userPrompt,
                providerConfig.model,
                temperature,
                providerConfig.apiKey
            );
            const duration = Date.now() - startTime;
            trackAIRequest(result.totalTokens, duration, `${providerName}/${result.model}`);
            yield result.content;
            return;
        }

        const stream = provider.generateCompletionStream(
            systemPrompt,
            userPrompt,
            providerConfig.model,
            temperature,
            providerConfig.apiKey
        );

        let finalResult = "";
        for await (const chunk of stream) {
            finalResult += chunk;
            yield chunk;
        }

        const duration = Date.now() - startTime;
        trackAIRequest(Math.round(finalResult.length / 4), duration, `${providerName}/${providerConfig.model}`);
    } catch (err) {
        console.error("Stream generation error:", err);
        throw err;
    }
}
