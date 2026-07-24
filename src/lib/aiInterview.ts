"use client";
/**
 * AI Interview Service Layer
 * Prompt construction, evaluation rubrics, and session management
 * for multi-role, multi-level AI mock interviews.
 * 
 * v2 — Proctored mode with question-type tagging, per-question timers,
 *       confidence tracking, and enhanced evaluation rubrics.
 */

import { generateAIResponse } from "./groq";

// ——— Types ———

export type InterviewRole = "frontend" | "backend" | "fullstack" | "systems" | "behavioral";
export type SeniorityLevel = "junior" | "mid" | "senior";
export type CompanyStyle = "faang" | "google" | "amazon" | "startup" | "general";
export type VoiceMode = "push-to-talk" | "continuous" | "off";
export type QuestionType = "conceptual" | "coding" | "system-design" | "behavioral" | "follow-up";

export interface InterviewConfig {
  role: InterviewRole;
  seniority: SeniorityLevel;
  companyStyle: CompanyStyle;
  questionCount: number;
  enableVoice: boolean;
  enableScratchpad: boolean;
  // Proctoring
  enableProctoring: boolean;
  enableWebcam: boolean;
  perQuestionTimeLimitSec: number; // 0 = unlimited
  voiceMode: VoiceMode;
  // New proctoring and custom parameters
  roundType: "dsa" | "system-design" | "behavioral" | "resume-fit" | "full-loop";
  resumeText: string;
  jobDescription: string;
}

export interface QuestionMeta {
  number: number;
  type: QuestionType;
  topic: string;
  startedAt: number; // Date.now()
  answeredAt?: number;
  confidenceRating?: number; // 1–5
}

export interface ProctoringViolation {
  type: "tab-switch" | "fullscreen-exit" | "copy-paste";
  timestamp: number;
}

export interface InterviewScoreBreakdown {
  technicalAccuracy: number;    // out of 25
  communication: number;        // out of 25
  problemSolving: number;       // out of 25
  depthOfKnowledge: number;     // out of 25
  totalScore: number;           // out of 100
  overallGrade: string;         // A+ through F
  strengths: string[];
  redFlags: string[];
  topicScores: { topic: string; score: number; maxScore: number; feedback: string }[];
  summary: string;
  recommendation: string;
}

export const ROLE_OPTIONS: { value: InterviewRole; label: string; emoji: string; desc: string; topics: string[] }[] = [
  {
    value: "frontend",
    label: "Frontend Engineer",
    emoji: "🎨",
    desc: "React, DOM, CSS, Performance, Browser APIs",
    topics: ["React lifecycle", "Virtual DOM", "CSS specificity", "Web performance", "Accessibility", "State management"]
  },
  {
    value: "backend",
    label: "Backend Engineer",
    emoji: "⚙️",
    desc: "APIs, Databases, Auth, Scalability, Caching",
    topics: ["REST vs GraphQL", "Database indexing", "Authentication", "Caching strategies", "Message queues", "Microservices"]
  },
  {
    value: "fullstack",
    label: "Fullstack Engineer",
    emoji: "🔗",
    desc: "End-to-end systems, SSR, DevOps, APIs",
    topics: ["SSR vs CSR", "API design", "Database modeling", "CI/CD", "Docker", "Full-stack architecture"]
  },
  {
    value: "systems",
    label: "Systems & DS/Algo",
    emoji: "🏗️",
    desc: "System Design, Algorithms, Data Structures",
    topics: ["System design", "Big-O analysis", "Trees & Graphs", "Dynamic programming", "Distributed systems", "Load balancing"]
  },
  {
    value: "behavioral",
    label: "Behavioral & Leadership",
    emoji: "🤝",
    desc: "STAR method, conflict resolution, leadership",
    topics: ["Conflict resolution", "Leadership examples", "Failure stories", "Team dynamics", "Decision making", "Communication"]
  },
];

export const SENIORITY_OPTIONS: { value: SeniorityLevel; label: string; emoji: string; desc: string }[] = [
  { value: "junior", label: "Junior (0-2 yrs)", emoji: "🌱", desc: "Fundamentals, core concepts, basic problem solving" },
  { value: "mid", label: "Mid-Level (2-5 yrs)", emoji: "🌿", desc: "Architecture trade-offs, system ownership, mentoring" },
  { value: "senior", label: "Senior / Lead (5+ yrs)", emoji: "🌳", desc: "System design, technical vision, cross-team influence" },
];

export const COMPANY_OPTIONS: { value: CompanyStyle; label: string; emoji: string; desc: string }[] = [
  { value: "faang", label: "Big Tech / FAANG", emoji: "🏢", desc: "LC-style, system design, bar raiser rigor" },
  { value: "google", label: "Google / Alphabet", emoji: "🔍", desc: "Complex algorithms, scalability, optimal space/time" },
  { value: "amazon", label: "Amazon / AWS", emoji: "📦", desc: "16 Leadership Principles, STAR method, trade-offs" },
  { value: "startup", label: "Fast-Paced Startup", emoji: "🚀", desc: "Practical coding, product sense, speed" },
  { value: "general", label: "General / Mixed", emoji: "🎯", desc: "Balanced technical and behavioral" },
];

// ——— System Prompt Builder (v2 — with question-type tagging) ———

export function buildInterviewSystemPrompt(config: InterviewConfig): string {
  const roleInfo = ROLE_OPTIONS.find(r => r.value === config.role)!;
  const seniorityInfo = SENIORITY_OPTIONS.find(s => s.value === config.seniority)!;
  const companyInfo = COMPANY_OPTIONS.find(c => c.value === config.companyStyle)!;

  let roundGuidelines = "";
  if (config.roundType === "dsa") {
    roundGuidelines = `
ROUND TYPE: Data Structures & Algorithms (DSA) / Coding
- You MUST present a clear coding problem for the candidate to solve.
- Instruct them to write their solution in the JavaScript Scratchpad and submit it for your review using the 'Submit Code for Review' button.
- Do not let them off easy. Challenge their choice of algorithms, time/space complexity (Big-O), and edge cases.
- Analyze their submitted code closely when they send it for review.`;
  } else if (config.roundType === "system-design") {
    roundGuidelines = `
ROUND TYPE: System Design
- Focus strictly on large-scale software systems, load balancing, caching, database replication, message queues, and high availability.
- Do not ask coding questions. Ask architectural questions and evaluate how they model scalability, latency, data safety, and trade-offs.`;
  } else if (config.roundType === "behavioral") {
    roundGuidelines = `
ROUND TYPE: Behavioral & Leadership
- Evaluate conflict resolution, leadership, failure recovery, and cross-team alignment.
- Use the STAR (Situation, Task, Action, Result) methodology. Probe for concrete metrics and specific actions they took.`;
  } else if (config.roundType === "resume-fit") {
    roundGuidelines = `
ROUND TYPE: Resume & Role-Fit Review
- You must review the candidate's Resume and Job Description.
- Ask questions directly related to their past experience, projects, tech stack, and achievements as documented in their resume.
- Test how their skillset aligns with the target role description.`;
  } else {
    roundGuidelines = `
ROUND TYPE: Full Loop Comprehensive Mock
- Cover a mix of conceptual questions, coding/DSA, system design (if senior), and behavioral/resume projects.
- Make the transition between rounds professional.`;
  }

  const resumeContext = config.resumeText 
    ? `\nCANDIDATE RESUME:\n${config.resumeText}\n` 
    : "";
  const jobContext = config.jobDescription 
    ? `\nTARGET JOB ROLE & DESCRIPTION:\n${config.jobDescription}\n` 
    : "";

  return `You are a strict, experienced senior technical interviewer at a ${companyInfo.label} company.
You are conducting a ${seniorityInfo.label} ${roleInfo.label} interview.

INTERVIEW CONTEXT:
- Role: ${roleInfo.label} (${roleInfo.desc})
- Seniority Target: ${seniorityInfo.label} — ${seniorityInfo.desc}
- Company Style: ${companyInfo.label} — ${companyInfo.desc}
- Key Topics to Cover: ${roleInfo.topics.join(", ")}${roundGuidelines}${resumeContext}${jobContext}
- Total Questions Target: ${config.questionCount}

QUESTION TAGGING FORMAT:
Every time you ask a NEW question (not a follow-up probe), you MUST start your message with a tag on its own line in this exact format:
[QUESTION:<number>|TYPE:<type>|TOPIC:<topic>]

Where:
- <number> is the question number (1, 2, 3, etc.)
- <type> is one of: conceptual, coding, system-design, behavioral
- <topic> is a short topic label (e.g., "React Hooks", "REST APIs", "Conflict Resolution")

Example:
[QUESTION:2|TYPE:coding|TOPIC:Array Manipulation]
Given an array of integers, how would you find the two numbers that add up to a target sum?

For follow-up probes on the SAME question, do NOT add a new tag. Just ask naturally.

INTERVIEWER RULES:
1. Start with a warm but professional greeting. Then ask your first question with the tag.
2. Ask questions appropriate for the ${config.seniority} level. ${config.seniority === "senior" || config.roundType === "system-design" ? "Include at least one system design question." : ""}
3. After each candidate answer, analyze it critically:
   - If incomplete or vague, probe deeper with "Can you elaborate on..." or "What about edge cases?"
   - If incorrect, correct them directly but professionally: "That's not quite right. The issue is..."
   - If correct, acknowledge briefly and go deeper or move to next topic.
4. Never just say "Correct!" and move on. Always dig one layer deeper.
5. Be clinical and professional. Not rude, but not overly encouraging.
6. Keep responses concise (3-5 sentences max per turn).
7. After covering ${config.questionCount} questions, say "That concludes our interview" and provide a brief verbal summary.
8. Track which topics you've covered. Try to cover at least 3 different topic areas.
9. If a resume is provided, ask at least 2 questions directly about the experiences, projects, or technologies mentioned in the resume.
${config.role === "behavioral" || config.roundType === "behavioral" ? "10. Use the STAR method to evaluate responses. Ask for specific examples." : ""}
${config.companyStyle === "google" ? "11. Emphasize algorithmic efficiency and Big-O time/space complexity analysis. Ask candidate to optimize their solution." : ""}
${config.companyStyle === "amazon" ? "11. Evaluate against Amazon Leadership Principles (Customer Obsession, Ownership, Bias for Action). Demand specific metrics and outcomes." : ""}
10. Mix question types: at least 1 conceptual, 1 practical/coding.`;
}

// ——— Question Tag Parser ———

export function parseQuestionTag(content: string): QuestionMeta | null {
  const match = content.match(/\[QUESTION:(\d+)\|TYPE:(\w[\w-]*)\|TOPIC:([^\]]+)\]/);
  if (!match) return null;
  return {
    number: parseInt(match[1], 10),
    type: match[2] as QuestionType,
    topic: match[3].trim(),
    startedAt: Date.now(),
  };
}

/** Strip question tags from display text */
export function stripQuestionTag(content: string): string {
  return content.replace(/\[QUESTION:\d+\|TYPE:\w[\w-]*\|TOPIC:[^\]]+\]\n?/g, "").trim();
}

// ——— Post-Interview Evaluation ———

export async function evaluateInterviewSession(
  transcript: { role: string; content: string }[],
  config: InterviewConfig,
  violations?: ProctoringViolation[],
  questionMetas?: QuestionMeta[]
): Promise<InterviewScoreBreakdown> {
  const roleInfo = ROLE_OPTIONS.find(r => r.value === config.role)!;

  const violationNote = violations && violations.length > 0
    ? `\n\nPROCTORING VIOLATIONS (${violations.length} total):\n${violations.map(v => `- ${v.type} at ${new Date(v.timestamp).toLocaleTimeString()}`).join("\n")}\nFactor violations into your assessment — deduct points for integrity concerns.`
    : "";

  const confidenceNote = questionMetas && questionMetas.some(q => q.confidenceRating)
    ? `\n\nCANDIDATE CONFIDENCE RATINGS:\n${questionMetas.filter(q => q.confidenceRating).map(q => `- Q${q.number} (${q.topic}): ${q.confidenceRating}/5 confidence`).join("\n")}`
    : "";

  const evalPrompt = `You are an expert interview evaluator. Analyze this ${roleInfo.label} interview transcript for a ${config.seniority}-level candidate.

TRANSCRIPT:
${transcript.map(m => `${m.role === "user" ? "CANDIDATE" : "INTERVIEWER"}: ${m.content}`).join("\n\n")}${violationNote}${confidenceNote}

Evaluate the candidate and return ONLY a JSON object with this exact structure:
{
  "technicalAccuracy": <0-25>,
  "communication": <0-25>,
  "problemSolving": <0-25>,
  "depthOfKnowledge": <0-25>,
  "totalScore": <0-100>,
  "overallGrade": "<A+/A/B+/B/C+/C/D/F>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "redFlags": ["<weakness 1>", "<weakness 2>"],
  "topicScores": [
    {"topic": "<topic name>", "score": <0-10>, "maxScore": 10, "feedback": "<1-sentence feedback>"}
  ],
  "summary": "<2-3 sentence overall assessment>",
  "recommendation": "<Hire / Lean Hire / Lean No Hire / No Hire>"
}

Return ONLY the JSON object. No markdown, no explanation.`;

  try {
    const response = await generateAIResponse(
      "You are a precise JSON evaluation engine. Return only valid JSON.",
      evalPrompt,
      0.3
    );
    const startIdx = response.indexOf('{');
    const endIdx = response.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      return JSON.parse(response.substring(startIdx, endIdx + 1));
    }
  } catch (e) {
    console.error("Evaluation parsing failed:", e);
  }

  // Fallback evaluation
  return {
    technicalAccuracy: 15,
    communication: 18,
    problemSolving: 14,
    depthOfKnowledge: 13,
    totalScore: 60,
    overallGrade: "C+",
    strengths: ["Shows foundational understanding", "Communicates clearly"],
    redFlags: ["Gaps in advanced topics", "Could elaborate more on trade-offs"],
    topicScores: roleInfo.topics.slice(0, 3).map(t => ({
      topic: t, score: 6, maxScore: 10, feedback: "Demonstrated basic understanding."
    })),
    summary: "The candidate showed promise but needs deeper preparation on advanced topics.",
    recommendation: "Lean No Hire"
  };
}

export const DEFAULT_INTERVIEW_CONFIG: InterviewConfig = {
  role: "frontend",
  seniority: "mid",
  companyStyle: "faang",
  questionCount: 5,
  enableVoice: true,
  enableScratchpad: true,
  enableProctoring: true,
  enableWebcam: true,
  perQuestionTimeLimitSec: 300, // 5 min
  voiceMode: "continuous",
  roundType: "full-loop",
  resumeText: "",
  jobDescription: "",
};
