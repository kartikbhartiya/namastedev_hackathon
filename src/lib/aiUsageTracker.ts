"use client";
// AI Usage Tracking Utility
// Tracks real usage of AI features across the application
import { supabase } from "./supabase";

export interface AIUsageStats {
  tokensUsed: number;
  requestsToday: number;
  avgResponseTime: number;
  lastRequest: string | null;
  dailyReset: string; // ISO date string of when counters were last reset
}

export interface AIUsageHistoryEntry {
  time: string;
  tokens: number;
  requests: number;
  timestamp: number;
}

const USAGE_STATS_KEY = "ai_usage_stats";
const USAGE_HISTORY_KEY = "ai_usage_history";
const DAILY_TOKEN_LIMIT = 500000;
const DAILY_REQUEST_LIMIT = 500;

// Initialize or get current stats
export const getAIUsageStats = (): AIUsageStats => {
  const stored = localStorage.getItem(USAGE_STATS_KEY);
  const today = new Date().toISOString().split('T')[0];

  if (stored) {
    try {
      const stats = JSON.parse(stored) as AIUsageStats;
      // Reset daily counters if it's a new day
      if (stats.dailyReset !== today) {
        const resetStats: AIUsageStats = {
          tokensUsed: 0,
          requestsToday: 0,
          avgResponseTime: stats.avgResponseTime, // Keep avg
          lastRequest: stats.lastRequest,
          dailyReset: today
        };
        localStorage.setItem(USAGE_STATS_KEY, JSON.stringify(resetStats));
        return resetStats;
      }
      return stats;
    } catch (e) {
      console.error("Error parsing AI usage stats:", e);
    }
  }

  // Default stats
  const defaultStats: AIUsageStats = {
    tokensUsed: 0,
    requestsToday: 0,
    avgResponseTime: 0,
    lastRequest: null,
    dailyReset: today
  };
  localStorage.setItem(USAGE_STATS_KEY, JSON.stringify(defaultStats));
  return defaultStats;
};

// Get usage history
export const getAIUsageHistory = (): AIUsageHistoryEntry[] => {
  const stored = localStorage.getItem(USAGE_HISTORY_KEY);
  if (stored) {
    try {
      const history = JSON.parse(stored) as AIUsageHistoryEntry[];
      // Keep only last 24 hours of data
      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      return history.filter(h => h.timestamp > cutoff);
    } catch (e) {
      console.error("Error parsing AI usage history:", e);
    }
  }
  return [];
};

// Track a new AI request
export const trackAIRequest = (
  tokensUsed: number,
  responseTimeMs: number,
  model: string = "llama-3.3-70b-versatile"
): void => {
  const stats = getAIUsageStats();
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  // Reset if new day
  const isNewDay = stats.dailyReset !== today;

  const newStats: AIUsageStats = {
    tokensUsed: isNewDay ? tokensUsed : stats.tokensUsed + tokensUsed,
    requestsToday: isNewDay ? 1 : stats.requestsToday + 1,
    avgResponseTime: stats.requestsToday === 0
      ? responseTimeMs
      : Math.round((stats.avgResponseTime * stats.requestsToday + responseTimeMs) / (stats.requestsToday + 1)),
    lastRequest: now.toISOString(),
    dailyReset: today
  };

  localStorage.setItem(USAGE_STATS_KEY, JSON.stringify(newStats));

  // Update history (aggregate by hour)
  const history = getAIUsageHistory();
  const hourKey = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const existingIndex = history.findIndex(h =>
    h.time === hourKey &&
    now.getTime() - h.timestamp < 60 * 60 * 1000 // Same hour
  );

  if (existingIndex >= 0) {
    history[existingIndex].tokens += tokensUsed;
    history[existingIndex].requests += 1;
  } else {
    history.push({
      time: hourKey,
      tokens: tokensUsed,
      requests: 1,
      timestamp: now.getTime()
    });

    // Keep only last 24 entries
    if (history.length > 24) {
      history.shift();
    }
  }

  localStorage.setItem(USAGE_HISTORY_KEY, JSON.stringify(history));

  // Dispatch a custom event so other components can react
  window.dispatchEvent(new CustomEvent('ai-usage-updated', {
    detail: { stats: newStats, history }
  }));
};

// Estimate tokens from text
export const estimateTokens = (text: string): number => {
  return Math.ceil(text.length / 4);
};

// Get limits
export const getAILimits = () => ({
  tokensLimit: DAILY_TOKEN_LIMIT,
  requestsLimit: DAILY_REQUEST_LIMIT
});

// Check if AI is paused
export const isAIPaused = (): boolean => {
  return localStorage.getItem("ai_paused") === "true";
};

export const pauseAI = (): void => {
  localStorage.setItem("ai_paused", "true");
  window.dispatchEvent(new CustomEvent('ai-status-changed', { detail: { paused: true } }));
};

export const resumeAI = (): void => {
  localStorage.removeItem("ai_paused");
  window.dispatchEvent(new CustomEvent('ai-status-changed', { detail: { paused: false } }));
};

export const checkGlobalAIPaused = async (): Promise<boolean> => {
  return Promise.resolve(isAIPaused());
};

