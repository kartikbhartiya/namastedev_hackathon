"use client";
// AI Provider Interface & Registry
// Provides a common interface for all AI providers and manages provider configuration

import { supabase } from "./supabase";

// ——— Types ———

export interface AIProviderConfig {
    apiKey: string;
    model: string;
}

export interface AIProviderSettings {
    activeProvider: string;
    fallbackProvider: string | null;
    providerConfigs: Record<string, AIProviderConfig>;
}

export interface AIProvider {
    name: string;
    displayName: string;
    generateCompletion(
        systemPrompt: string,
        userPrompt: string,
        model: string,
        temperature: number,
        apiKey: string
    ): Promise<{ content: string; totalTokens: number; model: string }>;

    // Non-blocking streaming request
    generateCompletionStream?(
        systemPrompt: string,
        userPrompt: string,
        model: string,
        temperature: number,
        apiKey: string
    ): AsyncGenerator<string, { totalTokens: number, model: string }, unknown>;
    testConnection(model: string, apiKey: string): Promise<boolean>;
    getModels(): { value: string; label: string }[];
}

// ——— Provider Registry ———

const providers = new Map<string, AIProvider>();

export function registerProvider(provider: AIProvider) {
    providers.set(provider.name, provider);
}

export function getProvider(name: string): AIProvider | undefined {
    return providers.get(name);
}

export function getAllProviders(): AIProvider[] {
    return Array.from(providers.values());
}

// ——— Config Management ———

const CONFIG_CACHE_KEY = "ai_provider_config";
let configCache: AIProviderSettings | null = null;

export function getDefaultConfig(): AIProviderSettings {
    return {
        activeProvider: "groq",
        fallbackProvider: null,
        providerConfigs: {
            groq: {
                apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY || "",
                model: "llama-3.3-70b-versatile",
            },
            openai: {
                apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || "",
                model: "gpt-4o-mini",
            },
            nvidia: {
                apiKey: process.env.NEXT_PUBLIC_NVIDIA_API_KEY || "",
                model: "meta/llama-3.3-70b-instruct",
            },
            together: {
                apiKey: process.env.NEXT_PUBLIC_TOGETHER_API_KEY || "",
                model: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
            },
            ollama: {
                apiKey: "",
                model: "llama3",
            },
        },
    };
}

export async function loadProviderConfig(): Promise<AIProviderSettings> {
    // Check cache first
    if (configCache) return configCache;

    configCache = getDefaultConfig();
    return configCache;
}

export function saveProviderConfig(config: AIProviderSettings) {
    configCache = config;
    localStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent("ai-config-updated", { detail: config }));
}
