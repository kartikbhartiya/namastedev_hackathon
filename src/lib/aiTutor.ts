"use client";
/**
 * ECLIX Hackathon AI Tutor Service Layer
 * Supports real LLM generations via Groq/OpenAI, and features a
 * beautiful pre-baked offline mock fallback to ensure the app works out of the box.
 */

import { generateAIResponse } from "./groq";

// ——— Types ———

export interface TutorProfile {
    id?: string;
    user_id?: string;
    tutor_name: string;
    tone: string;
    motivation_style: string;
    learning_pace: string;
    explanation_style: string;
    interests: string[];
    learning_challenges: string[];
    education_domain?: string;
    target_exam?: string;
}

export interface StudentContext {
    name: string;
    streak?: number;
    completedGoals?: number;
    totalGoals?: number;
    overdueGoals?: number;
    weeklyStudyHours?: string;
    recentTopics?: string[];
    testScores?: { topic: string; score: number; total: number }[];
    weakAreas?: string[];
}

export interface MindMapNode {
    id: string;
    label: string;
    description?: string;
    children: MindMapNode[];
}

export interface StudyPlanDay {
    day: number;
    title: string;
    tasks: string[];
    type: 'concept' | 'practice' | 'simulation' | 'test' | 'revision';
}

export interface QuizQuestion {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    incorrectReasoning: string[];
}

export interface VideoScene {
    scene: number;
    title: string;
    narration: string;
    visual: string;
}

export interface VideoScript {
    title: string;
    duration: string;
    scenes: VideoScene[];
    takeaways: string[];
}

// ——— Dynamic Simulation Types ———

export type DynamicSimDomain = "physics" | "math" | "algorithm" | "chemistry";
export type DynamicRenderType = "svg";

export interface DynamicSimParameter {
    key: string;
    label: string;
    min: number;
    max: number;
    step: number;
    default: number;
    unit?: string;
}

export interface DynamicSimEquation {
    label: string;
    formula: string;
}

export interface SimCircle {
    type: "circle";
    cx: string;
    cy: string;
    r: string;
    fill: string;
    stroke?: string;
    label?: string;
}

export interface SimLine {
    type: "line";
    x1: string; y1: string;
    x2: string; y2: string;
    stroke: string;
    strokeWidth?: number;
    dashed?: boolean;
}

export interface SimArrow {
    type: "arrow";
    x1: string; y1: string;
    x2: string; y2: string;
    stroke: string;
    label?: string;
}

export interface SimCurve {
    type: "curve";
    expression: string;
    xMin: number;
    xMax: number;
    stroke: string;
    strokeWidth?: number;
}

export interface SimBar {
    type: "bar";
    values: string;
    fill: string;
    highlightIndex?: string;
    highlightFill?: string;
}

export interface SimFieldLines {
    type: "fieldLines";
    cx: string; cy: string;
    count: number;
    length: string;
    stroke: string;
    direction: "outward" | "inward";
}

export interface SimSpring {
    type: "spring";
    x1: string; y1: string;
    x2: string; y2: string;
    coils: number;
    width: number;
    stroke: string;
}

export interface SimWall {
    type: "wall";
    x: string; y: string;
    width: string; height: string;
    orientation: "horizontal" | "vertical";
    fill?: string;
}

export interface SimParticle {
    type: "particle";
    cx: string; cy: string;
    count: number;
    radius: number;
    fill: string;
    spread: string;
}

export interface SimText {
    type: "text";
    x: string; y: string;
    content: string;
    fill: string;
    fontSize?: number;
}

export interface SimRect {
    type: "rect";
    x: string; y: string;
    width: string; height: string;
    fill: string;
    stroke?: string;
    rx?: number;
}

export type SimElement =
    | SimCircle | SimLine | SimArrow | SimCurve | SimBar
    | SimFieldLines | SimParticle | SimText | SimRect
    | SimSpring | SimWall;

export interface DynamicSimAnimation {
    property: string;
    from: number;
    to: number;
    duration: number;
    loop: boolean;
    label?: string;
}

export interface DynamicSimConfig {
    simulationType: DynamicSimDomain;
    title: string;
    description: string;
    emoji: string;
    renderType: DynamicRenderType;
    canvasWidth: number;
    canvasHeight: number;
    parameters: DynamicSimParameter[];
    equations: DynamicSimEquation[];
    elements: SimElement[];
    animation?: DynamicSimAnimation;
}

// ——— Prompt Mapping Helpers ———

const TONE_INSTRUCTIONS: Record<string, string> = {
    "Encouraging": "Be warm, supportive, and encouraging. Celebrate small wins.",
    "Professional": "Be clear, precise, and professional. Maintain a structured, academic tone.",
    "Strict & Focused": "Be direct and focused. Push the student to think critically.",
    "Funny & Casual": "Be witty, fun, and casual. Use humor to make concepts memorable."
};

const MOTIVATION_INSTRUCTIONS: Record<string, string> = {
    "Goal oriented": "Tie explanations back to the student's goals. Track progress and remind them of targets.",
    "Curiosity driven": "Spark wonder and intellectual curiosity. Ask thought-provoking questions.",
    "Reward based": "Celebrate achievements with enthusiasm! Use milestone tracking.",
    "Nurturing": "Be patient and caring. Create a safe space for learning."
};

const PACE_INSTRUCTIONS: Record<string, string> = {
    "Steady & Patient": "Go slow, explain thoroughly, and check understanding frequently.",
    "Fast paced": "Be concise and efficient. Dive deep into complex parts quickly.",
    "Adaptive": "Read the student's signals. Adjust speed based on user response."
};

const STYLE_INSTRUCTIONS: Record<string, string> = {
    "Visual": "Use diagrams, charts, mental images, and spatial analogies.",
    "Storytelling": "Explain concepts through stories, narratives, and historical context.",
    "Step by step": "Break everything into numbered steps. Use clear sequential logic.",
    "First principles": "Start from fundamental truths and build up. Ask 'Why?' at every level."
};

export function buildTutorSystemPrompt(tutor: TutorProfile, student: StudentContext): string {
    const toneInstr = TONE_INSTRUCTIONS[tutor.tone] || TONE_INSTRUCTIONS["Encouraging"];
    const motivInstr = MOTIVATION_INSTRUCTIONS[tutor.motivation_style] || MOTIVATION_INSTRUCTIONS["Goal oriented"];
    const paceInstr = PACE_INSTRUCTIONS[tutor.learning_pace] || PACE_INSTRUCTIONS["Adaptive"];
    const styleInstr = STYLE_INSTRUCTIONS[tutor.explanation_style] || STYLE_INSTRUCTIONS["Step by step"];

    const interestThemes = tutor.interests.length > 0
        ? `Analogies from: ${tutor.interests.join(', ')}.`
        : '';

    const challengeAdaptations = tutor.learning_challenges.length > 0
        ? `Challenges: ${tutor.learning_challenges.join(', ')}.`
        : '';

    return `You are ${tutor.tutor_name}, an AI tutor on Eclix. You are a personal study mentor.
Tone: ${toneInstr}
Motivation: ${motivInstr}
Pace: ${paceInstr}
Style: ${styleInstr}
${interestThemes}
${challengeAdaptations}

Always respond in clean Markdown. You can trigger interactive UI cards by appending one of these exact tags:
- [ACTION:simulation:topic_name] (e.g. [ACTION:simulation:Pendulum Motion])
- [ACTION:mindmap:topic_name]
- [ACTION:studyplan:topic_name]
- [ACTION:quiz:topic_name]`;
}

// ——— Offline Mock Responses ———

const MOCK_SIMULATIONS: Record<string, DynamicSimConfig> = {
    "pendulum": {
        simulationType: "physics",
        title: "Simple Pendulum Mechanics",
        description: "Explore the relationship between pendulum length, gravity, and oscillation period.",
        emoji: "⏳",
        renderType: "svg",
        canvasWidth: 700,
        canvasHeight: 400,
        parameters: [
            { key: "time", label: "Time", min: 0, max: 10, step: 0.05, default: 0, unit: "s" },
            { key: "length", label: "Length (L)", min: 100, max: 250, step: 10, default: 180, unit: "px" },
            { key: "gravity", label: "Gravity (g)", min: 5, max: 20, step: 1, default: 9.8, unit: "m/s²" }
        ],
        animation: {
            property: "time",
            from: 0,
            to: 10,
            duration: 10,
            loop: true,
            label: "Oscillate"
        },
        equations: [
            { label: "Period (T)", formula: "T = 2π · √(L / g)" },
            { label: "Angular Position (θ)", formula: "θ(t) = θ₀ · cos(√(g/L) · t)" }
        ],
        elements: [
            { type: "wall", x: "300", y: "40", width: "100", height: "15", orientation: "horizontal" },
            { type: "circle", cx: "350", cy: "48", r: "5", fill: "#737373" },
            { type: "line", x1: "350", y1: "48", x2: "350 + Math.sin(Math.sin(time * Math.sqrt(gravity / (length / 50))) * 0.5) * length", y2: "48 + Math.cos(Math.sin(time * Math.sqrt(gravity / (length / 50))) * 0.5) * length", stroke: "#a3a3a3", strokeWidth: 2 },
            { type: "circle", cx: "350 + Math.sin(Math.sin(time * Math.sqrt(gravity / (length / 50))) * 0.5) * length", cy: "48 + Math.cos(Math.sin(time * Math.sqrt(gravity / (length / 50))) * 0.5) * length", r: "20", fill: "#3b82f6", stroke: "#2563eb", label: "m" },
            { type: "arrow", x1: "350 + Math.sin(Math.sin(time * Math.sqrt(gravity / (length / 50))) * 0.5) * length", y1: "48 + Math.cos(Math.sin(time * Math.sqrt(gravity / (length / 50))) * 0.5) * length", x2: "350 + Math.sin(Math.sin(time * Math.sqrt(gravity / (length / 50))) * 0.5) * length", y2: "48 + Math.cos(Math.sin(time * Math.sqrt(gravity / (length / 50))) * 0.5) * length + 50", stroke: "#ef4444", label: "F_g" }
        ]
    },
    "projectile": {
        simulationType: "physics",
        title: "Projectile Dynamics",
        description: "Visualize flight trajectories by adjusting launching velocity and angles.",
        emoji: "☄️",
        renderType: "svg",
        canvasWidth: 700,
        canvasHeight: 400,
        parameters: [
            { key: "time", label: "Time of Flight", min: 0, max: 6, step: 0.05, default: 0, unit: "s" },
            { key: "velocity", label: "Initial Velocity (v₀)", min: 20, max: 70, step: 5, default: 50, unit: "m/s" },
            { key: "angle", label: "Launch Angle (θ)", min: 15, max: 80, step: 5, default: 45, unit: "°" }
        ],
        animation: {
            property: "time",
            from: 0,
            to: 6,
            duration: 6,
            loop: true,
            label: "Fire"
        },
        equations: [
            { label: "Horizontal Position", formula: "x(t) = v₀·cos(θ)·t" },
            { label: "Vertical Position", formula: "y(t) = v₀·sin(θ)·t - 0.5·g·t²" }
        ],
        elements: [
            { type: "wall", x: "20", y: "370", width: "660", height: "10", orientation: "horizontal" },
            { type: "curve", expression: "x * Math.tan(angle * Math.PI / 180) - (9.8 * x * x) / (2 * velocity * velocity * Math.cos(angle * Math.PI / 180) * Math.cos(angle * Math.PI / 180))", xMin: 0, xMax: 600, stroke: "#10b981", strokeWidth: 2 },
            { type: "circle", cx: "50 + (velocity * Math.cos(angle * Math.PI / 180) * time * 2)", cy: "370 - ((velocity * Math.sin(angle * Math.PI / 180) * time * 2) - 0.5 * 9.8 * time * time * 2)", r: "12", fill: "#ef4444", stroke: "#dc2626", label: "p" }
        ]
    }
};

const MOCK_MINDMAPS: Record<string, MindMapNode> = {
    "physics": {
        id: "root",
        label: "Classical Mechanics",
        description: "The study of the motion of macroscopic bodies under the action of forces.",
        children: [
            {
                id: "1",
                label: "Newton's Laws",
                description: "Fundamental laws relating body motion and applied forces.",
                children: [
                    { id: "1-1", label: "First Law", description: "Inertia: Bodies stay at rest or in uniform motion unless acted upon by a net force.", children: [] },
                    { id: "1-2", label: "Second Law", description: "$F = ma$: Net force equals mass times acceleration.", children: [] },
                    { id: "1-3", label: "Third Law", description: "Action-Reaction: Every action has an equal and opposite reaction.", children: [] }
                ]
            },
            {
                id: "2",
                label: "Energy & Work",
                description: "Mechanisms of transfer and conservation of mechanical energy.",
                children: [
                    { id: "2-1", label: "Kinetic Energy", description: "$KE = 1/2 · m·v²$: Energy due to velocity.", children: [] },
                    { id: "2-2", label: "Potential Energy", description: "$PE = m·g·h$: Stored energy due to position.", children: [] }
                ]
            }
        ]
    }
};

const MOCK_STUDYPLANS: Record<string, StudyPlanDay[]> = {
    "physics": [
        { day: 1, title: "Newtonian Dynamics", tasks: ["Review Newton's three laws", "Derive kinematic formulas", "Complete 5 basic word problems"], type: "concept" },
        { day: 2, title: "Energy Conservation", tasks: ["Work-Energy Theorem study", "Explore Potential vs Kinetic models", "Interact with Projectile simulation"], type: "simulation" },
        { day: 3, title: "Mock Assessment", tasks: ["Solve full practice problem set", "Review incorrect explanations", "Take Classical Mechanics Quiz"], type: "test" }
    ]
};

const MOCK_QUIZZES: Record<string, QuizQuestion[]> = {
    "physics": [
        {
            question: "Which of Newton's laws describes the principle of conservation of momentum?",
            options: [
                "A) First Law",
                "B) Second Law",
                "C) Third Law",
                "D) Universal Gravitation"
            ],
            correctIndex: 2,
            explanation: "Newton's Third Law states that forces are equal and opposite, which directly leads to the conservation of momentum in closed systems.",
            incorrectReasoning: [
                "The First Law describes inertia, not force interaction.",
                "The Second Law defines the relationship between force, mass, and acceleration ($F=ma$).",
                "Universal Gravitation describes gravitational force, not general conservation principles."
            ]
        },
        {
            question: "What is the unit of work in SI system?",
            options: [
                "A) Newton",
                "B) Watt",
                "C) Joule",
                "D) Pascal"
            ],
            correctIndex: 2,
            explanation: "Work is force times distance. In SI, it is Newtons times meters, defined as Joule ($J$).",
            incorrectReasoning: [
                "Newton is the SI unit of force.",
                "Watt is the SI unit of power (work per unit time).",
                "Pascal is the SI unit of pressure."
            ]
        }
    ]
};

// ——— Core Generator Wrapper Functions ———

export async function generateStudyPlan(
    topic: string,
    days: number,
    tutor: TutorProfile,
    student: StudentContext
): Promise<StudyPlanDay[]> {
    try {
        const systemPrompt = buildTutorSystemPrompt(tutor, student);
        const userPrompt = `Generate a ${days}-day study plan for: "${topic}". Return JSON array.`;
        const response = await generateAIResponse(systemPrompt, userPrompt, 0.5);
        const startIdx = response.indexOf('[');
        const endIdx = response.lastIndexOf(']');
        if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
            return JSON.parse(response.substring(startIdx, endIdx + 1));
        }
    } catch (e) {
        console.warn("Real generation failed or keys missing. Using mock study plan fallback.");
    }
    
    // Fallback
    const key = topic.toLowerCase().includes("math") ? "math" : "physics";
    return MOCK_STUDYPLANS[key] || MOCK_STUDYPLANS["physics"];
}

export async function generateMindMapData(
    topic: string,
    tutor: TutorProfile,
    student: StudentContext
): Promise<MindMapNode | null> {
    try {
        const systemPrompt = buildTutorSystemPrompt(tutor, student);
        const userPrompt = `Create concept mind map for: "${topic}". Return JSON.`;
        const response = await generateAIResponse(systemPrompt, userPrompt, 0.4);
        const startIdx = response.indexOf('{');
        const endIdx = response.lastIndexOf('}');
        if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
            return JSON.parse(response.substring(startIdx, endIdx + 1));
        }
    } catch (e) {
        console.warn("Real generation failed or keys missing. Using mock mind map fallback.");
    }

    // Fallback
    return MOCK_MINDMAPS["physics"];
}

export async function generateQuiz(
    topic: string,
    difficulty: 'easy' | 'medium' | 'hard',
    count: number,
    tutor: TutorProfile,
    student: StudentContext,
    sourceText?: string
): Promise<QuizQuestion[]> {
    try {
        const systemPrompt = buildTutorSystemPrompt(tutor, student);
        const userPrompt = `Generate ${count} ${difficulty} MCQs about: "${topic}". Return JSON array.`;
        const response = await generateAIResponse(systemPrompt, userPrompt, 0.6);
        const startIdx = response.indexOf('[');
        const endIdx = response.lastIndexOf(']');
        if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
            return JSON.parse(response.substring(startIdx, endIdx + 1));
        }
    } catch (e) {
        console.warn("Real generation failed or keys missing. Using mock quiz fallback.");
    }

    // Fallback
    return MOCK_QUIZZES["physics"];
}

export async function generateDynamicSimulation(
    topic: string,
    tutor: TutorProfile,
    student: StudentContext
): Promise<DynamicSimConfig | null> {
    try {
        const systemPrompt = `You are a simulation config generator. Return ONLY JSON.`;
        const userPrompt = `Generate SVG simulation config for: "${topic}".`;
        const response = await generateAIResponse(systemPrompt, userPrompt, 0.4);
        const startIdx = response.indexOf('{');
        const endIdx = response.lastIndexOf('}');
        if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
            return JSON.parse(response.substring(startIdx, endIdx + 1));
        }
    } catch (e) {
        console.warn("Real generation failed or keys missing. Using mock simulation fallback.");
    }

    // Fallback search
    const lowered = topic.toLowerCase();
    if (lowered.includes("projectile") || lowered.includes("motion") || lowered.includes("gravity")) {
        return MOCK_SIMULATIONS["projectile"];
    }
    return MOCK_SIMULATIONS["pendulum"];
}

export async function generateVideoScript(
    topic: string,
    tutor: TutorProfile,
    student: StudentContext
): Promise<VideoScript | null> {
    return {
        title: `Visualizing ${topic}`,
        duration: "5 minutes",
        scenes: [
            { scene: 1, title: "Hook", narration: `Welcome! Today we are studying the foundational concepts of ${topic}.`, visual: "Title card fades in with soft glowing grid." },
            { scene: 2, title: "Core Theory", narration: "Let's break down the essential equations that govern this system.", visual: "Formulas pop onto screen one by one with glowing strokes." }
        ],
        takeaways: ["Understand simple dynamics", "Apply conservation laws"]
    };
}

export async function analyzePerformance(
    tutor: TutorProfile,
    student: StudentContext
): Promise<string> {
    return `### 🌟 Great progress!
You are study streak is at **${student.streak || 5} days**. You have demonstrated great conceptual understanding in classical physics.

### 🔍 Focus Areas
Consider reviewing **Newton's Third Law** calculations since they showed up in recent incorrect attempts.

### 📅 Next Steps
1. Practice a medium-difficulty quiz on mechanics.
2. Verify visual relationships in the Simple Pendulum simulation.`;
}

export async function detectWeaknesses(
    topic: string,
    incorrectQuestions: { question: string, userAnswer: string }[],
    tutor: TutorProfile,
    student: StudentContext
): Promise<{ weakChapters: string[], plan: string }> {
    return {
        weakChapters: ["Action-Reaction forces", "Rotational Inertia"],
        plan: "Review Newton's Third Law dynamics. Practice calculating opposing forces in equilibrium states."
    };
}

export async function generateFollowUpQuestions(
    concept: string,
    tutor: TutorProfile,
    student: StudentContext
): Promise<QuizQuestion[]> {
    return [
        {
            question: `Which of the following describes action-reaction pairs?`,
            options: ["A) Action force is larger", "B) Force acts on different bodies", "C) Forces act on the same body", "D) Action precedes reaction"],
            correctIndex: 1,
            explanation: "Action-reaction force pairs always act on different bodies, preventing them from canceling each other out directly.",
            incorrectReasoning: ["Forces are always equal in magnitude.", "If they acted on the same body, motion would be impossible.", "They occur simultaneously."]
        }
    ];
}

export const DEFAULT_TUTOR_PROFILE: TutorProfile = {
    tutor_name: 'Aria',
    tone: 'Encouraging',
    motivation_style: 'Goal oriented',
    learning_pace: 'Adaptive',
    explanation_style: 'Step by step',
    interests: [],
    learning_challenges: []
};

export const TONE_OPTIONS = [
    { value: 'Encouraging', label: 'Encouraging', emoji: '🌟', desc: 'Warm, supportive, celebrates progress' },
    { value: 'Professional', label: 'Professional', emoji: '📋', desc: 'Clear, precise, academic' },
    { value: 'Strict & Focused', label: 'Strict & Focused', emoji: '🎯', desc: 'Direct, no-nonsense, high standards' },
    { value: 'Funny & Casual', label: 'Funny & Casual', emoji: '😄', desc: 'Witty, fun, relatable' },
];

export const MOTIVATION_OPTIONS = [
    { value: 'Goal oriented', label: 'Goal Oriented', emoji: '🏆', desc: 'Track progress, hit targets' },
    { value: 'Curiosity driven', label: 'Curiosity Driven', emoji: '🔬', desc: 'Spark wonder, explore deeply' },
    { value: 'Reward based', label: 'Reward Based', emoji: '🎁', desc: 'Milestones, achievements, celebrations' },
    { value: 'Nurturing', label: 'Nurturing', emoji: '💚', desc: 'Patient, safe, supportive' },
];

export const PACE_OPTIONS = [
    { value: 'Steady & Patient', label: 'Steady & Patient', emoji: '🐢', desc: 'Thorough, no rushing' },
    { value: 'Fast paced', label: 'Fast Paced', emoji: '⚡', desc: 'Efficient, concise, quick' },
    { value: 'Adaptive', label: 'Adaptive', emoji: '🔄', desc: 'Adjusts to your needs' },
];

export const STYLE_OPTIONS = [
    { value: 'Visual', label: 'Visual', emoji: '🎨', desc: 'Diagrams, charts, mental images' },
    { value: 'Storytelling', label: 'Storytelling', emoji: '📖', desc: 'Narratives, stories, history' },
    { value: 'Step by step', label: 'Step by Step', emoji: '📝', desc: 'Numbered steps, clear logic' },
    { value: 'First principles', label: 'First Principles', emoji: '🧬', desc: 'Build from fundamentals' },
];

export const INTEREST_OPTIONS = [
    { value: 'Gaming & Tech', emoji: '🎮' },
    { value: 'Sports', emoji: '⚽' },
    { value: 'Space & Astronomy', emoji: '🚀' },
    { value: 'Music', emoji: '🎵' },
    { value: 'Programming', emoji: '💻' },
    { value: 'Art & Design', emoji: '🎨' },
    { value: 'Environment', emoji: '🌿' },
    { value: 'Literature', emoji: '📚' },
];

export const CHALLENGE_OPTIONS = [
    { value: 'Hard to focus', emoji: '🧠', desc: 'Difficulty maintaining concentration' },
    { value: 'Difficulty reading long text', emoji: '📄', desc: 'Prefers shorter, visual content' },
    { value: 'Math anxiety', emoji: '🔢', desc: 'Gets stressed by math problems' },
    { value: 'Needs visual explanations', emoji: '👁️', desc: 'Learns best with diagrams & visuals' },
];

export const DOMAIN_OPTIONS = [
    {
        value: 'School Education',
        label: 'School Education',
        emoji: '🏫',
        exams: ['CBSE Class 10', 'CBSE Class 12']
    },
    {
        value: 'Engineering Entrance',
        label: 'Engineering Entrance',
        emoji: '📐',
        exams: ['JEE Main', 'JEE Advanced']
    },
    {
        value: 'Engineering Courses',
        label: 'Engineering Courses',
        emoji: '💻',
        exams: ['BTech - CS/IT', 'BTech - Core']
    }
];
