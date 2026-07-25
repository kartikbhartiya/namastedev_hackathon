"use client";

import { generateAIResponse, generateAIResponseStream } from "./groq";
import { type ChatMessage } from "./aiProvider";

export interface DeepResearchStep {
    id: string;
    title: string;
    status: "pending" | "running" | "completed" | "failed";
    detail?: string;
}

export interface DeepResearchResult {
    topic: string;
    subQuestions: string[];
    report: string;
}

const DECOMPOSE_SYSTEM_PROMPT = `You are Orbit Deep Research Engine.
Given a user query or topic, break it down into 4-5 distinct, highly focused research sub-questions or technical angles.
Return ONLY a valid JSON array of strings representing the sub-questions. Do NOT include markdown code blocks or additional text.
Example format:
["What are the core mechanisms of X?", "How does X compare to Y in terms of performance?", "What are the common edge cases and vulnerabilities in X?", "What are modern production best practices for X?"]`;

const SYNTHESIZE_SYSTEM_PROMPT = `You are Orbit Senior Research Director.
Synthesize the research findings from multiple technical sub-investigations into a comprehensive, publication-grade Deep Research Report.

Use structured Markdown with the following layout:
# 🔬 Deep Research Report: [Topic]

> **Executive Summary**: A concise 3-4 sentence high-level overview of the findings.

## 1. Key Architectural & Theoretical Foundations
(Deep technical dive)

## 2. Comparative Analysis & Trade-offs
(Tables, code comparisons, performance characteristics)

## 3. Production Edge Cases & Vulnerabilities
(Known pitfalls, common memory/concurrency/scaling bottlenecks)

## 4. Modern Best Practices & Implementation Guidelines
(Step-by-step recommendation list, code snippets if relevant)

## 5. Future Horizons & Further Reading
(Emerging trends, key papers, related concepts to explore next)

Maintain an authoritative, precise, and academic yet accessible tone. Use math LaTeX notation (e.g. $O(N \\log N)$) and fenced code blocks where applicable.`;

export async function* runDeepResearchStream(
    topic: string,
    onStepUpdate?: (steps: DeepResearchStep[]) => void,
    signal?: AbortSignal
): AsyncGenerator<string, DeepResearchResult, unknown> {
    const steps: DeepResearchStep[] = [
        { id: "decompose", title: "Decomposing query into sub-questions", status: "running" },
        { id: "research", title: "Executing parallel technical investigations", status: "pending" },
        { id: "synthesize", title: "Synthesizing full research report", status: "pending" },
    ];

    const notify = () => onStepUpdate?.([...steps]);
    notify();

    // Step 1: Decompose
    let subQuestions: string[] = [];
    try {
        const rawJson = await generateAIResponse(
            [
                { role: "system", content: DECOMPOSE_SYSTEM_PROMPT },
                { role: "user", content: topic },
            ],
            undefined,
            0.3,
            signal
        );

        const cleanJson = rawJson.replace(/```json/gi, "").replace(/```/g, "").trim();
        const start = cleanJson.indexOf("[");
        const end = cleanJson.lastIndexOf("]");
        if (start !== -1 && end !== -1) {
            subQuestions = JSON.parse(cleanJson.slice(start, end + 1));
        } else {
            subQuestions = [
                `Fundamental concepts and mechanics of ${topic}`,
                `Performance characteristics and trade-offs of ${topic}`,
                `Common pitfalls, edge cases, and debugging strategies for ${topic}`,
                `Modern industry standards and production patterns for ${topic}`,
            ];
        }

        steps[0].status = "completed";
        steps[0].detail = `Generated ${subQuestions.length} research vectors`;
        steps[1].status = "running";
        notify();
    } catch (e) {
        steps[0].status = "failed";
        notify();
        subQuestions = [
            `Core mechanics of ${topic}`,
            `Performance & trade-offs of ${topic}`,
            `Best practices for ${topic}`,
        ];
    }

    // Step 2: Research sub-questions in parallel
    const researchPrompts = subQuestions.map((q) => {
        const msgs: ChatMessage[] = [
            {
                role: "system",
                content:
                    "You are a specialized Computer Science & Engineering Researcher. Provide a deep, technical breakdown of the sub-question with concrete facts, code, and math where appropriate.",
            },
            { role: "user", content: `Investigate this technical sub-question thoroughly: "${q}" regarding main topic "${topic}".` },
        ];
        return generateAIResponse(msgs, undefined, 0.4, signal);
    });

    let findings: string[] = [];
    try {
        findings = await Promise.all(researchPrompts);
        steps[1].status = "completed";
        steps[1].detail = `Gathered insights across ${findings.length} sub-queries`;
        steps[2].status = "running";
        notify();
    } catch (e) {
        steps[1].status = "failed";
        notify();
        throw e;
    }

    // Step 3: Synthesize and Stream Final Report
    const synthesisContext = subQuestions
        .map((q, idx) => `### SUB-INVESTIGATION ${idx + 1}: ${q}\n\n${findings[idx]}`)
        .join("\n\n---\n\n");

    const synthesisMessages: ChatMessage[] = [
        { role: "system", content: SYNTHESIZE_SYSTEM_PROMPT },
        {
            role: "user",
            content: `Main Topic: "${topic}"\n\nSub-Investigation Data:\n${synthesisContext}\n\nSynthesize the complete Deep Research Report now.`,
        },
    ];

    const stream = generateAIResponseStream(synthesisMessages, 0.5, 0.5, signal);
    let fullReport = "";

    for await (const chunk of stream) {
        fullReport += chunk;
        yield chunk;
    }

    steps[2].status = "completed";
    steps[2].detail = "Report generated successfully";
    notify();

    return {
        topic,
        subQuestions,
        report: fullReport,
    };
}
