"use client";
// SIH PPT AI Content Generator
// Uses the existing AI provider system to generate structured slide content
// Trained on the official SIH 2025 PPT template structure

import { ChatMessage } from "./aiProvider";

// ——— Types ———

export interface SIHTitleSlide {
  problemStatementId: string;
  problemStatementTitle: string;
  theme: string;
  psCategory: "Software" | "Hardware";
  teamId: string;
  teamName: string;
  speakerNotes: string;
}

export interface SIHIdeaSlide {
  title: string;
  solutionPoints: string[];
  howItAddresses: string[];
  innovationPoints: string[];
  competitorMatrix: { competitor: string; cost: string; speed: string; features: string }[];
  prototypeImagePrompt: string;
  speakerNotes: string;
}

export interface SIHTechnicalSlide {
  technologies: string[];
  methodology: string[];
  architectureDescription: string;
  mermaidArchitectureDiagram: string;
  speakerNotes: string;
}

export interface SIHFeasibilitySlide {
  feasibilityPoints: string[];
  challenges: string[];
  strategies: string[];
  costBreakdown: { item: string; estimatedCost: string; justification: string }[];
  speakerNotes: string;
}

export interface SIHImpactSlide {
  targetAudienceImpact: string[];
  benefits: string[];
  speakerNotes: string;
}

export interface SIHReferencesSlide {
  references: { title: string; authors: string; year: string; link: string }[];
  speakerNotes: string;
}

export interface SIHSlideContent {
  titleSlide: SIHTitleSlide;
  ideaSlide: SIHIdeaSlide;
  technicalSlide: SIHTechnicalSlide;
  feasibilitySlide: SIHFeasibilitySlide;
  impactSlide: SIHImpactSlide;
  referencesSlide: SIHReferencesSlide;
}

// ——— Rubric Grading Types ———

export interface SIHRubricGrade {
  innovationScore: number;       // 0-10
  feasibilityScore: number;      // 0-10
  impactScore: number;           // 0-10
  overallScore: number;          // 0-10
  feedback: string;
  enhancementSuggestions: string[];
}

export interface SIHEnhancedInput {
  solutionDescription: string;
  howItAddressesProblem: string;
  whatMakesItInnovative: string;
  techStack: string[];
  architectureDescription: string;
  challenges: string;
  strategies: string;
  targetAudience: string;
  benefits: string;
}

// ——— User Input Types ———

export interface SIHUserInput {
  // Basic Details (Step 1)
  problemStatementId: string;
  problemStatementTitle: string;
  theme: string;
  psCategory: "Software" | "Hardware";
  teamId: string;
  teamName: string;

  // Solution Description (Step 2)
  solutionDescription: string;
  howItAddressesProblem: string;
  whatMakesItInnovative: string;

  // Technical Details (Step 3)
  techStack: string[];
  architectureDescription: string;
  hardwareComponents: string;

  // Feasibility & Impact (Step 4)
  challenges: string;
  strategies: string;
  targetAudience: string;
  benefits: string;

  // References (Step 5)
  references: string;
}

// ——— SIH Themes List ———

export const SIH_THEMES = [
  "Smart Automation",
  "Fitness & Sports",
  "Heritage & Culture",
  "MedTech / BioTech / HealthTech",
  "Agriculture, FoodTech & Rural Development",
  "Smart Vehicles",
  "Transportation & Logistics",
  "Robotics and Drones",
  "Clean & Green Technology",
  "Tourism",
  "Renewable / Sustainable Energy",
  "Blockchain & Cybersecurity",
  "Smart Education",
  "Disaster Management",
  "Toys and Games",
  "Miscellaneous",
];

// ——— AI System Prompts ———

const SIH_SYSTEM_PROMPT = `You are an expert SIH (Smart India Hackathon) presentation content writer. You help students create professional, winning SIH presentation content.

You MUST generate content following the EXACT official SIH PPT template structure. The SIH PPT has exactly 6 slides:

SLIDE 1 - TITLE PAGE:
- "SMART INDIA HACKATHON 2026" as main heading
- Problem Statement ID, Title, Theme, PS Category, Team ID, Team Name as bullet points

SLIDE 2 - IDEA TITLE (Proposed Solution):
- Bold heading with the idea/solution title
- "Proposed Solution (Describe your Idea/Solution/Prototype)" as section header
- Detailed explanation bullet points (3-5 concise points)
- How it addresses the problem (2-3 points)
- Innovation and uniqueness of the solution (2-3 points)
- competitorMatrix: Analyze 3 existing real-world solutions (or traditional methods) and compare them with this idea based on cost, speed, and features.
- prototypeImagePrompt: Write a highly detailed AI image generation prompt (e.g., for DALL-E) to create a beautiful wireframe/mockup UI of the solution.

SLIDE 3 - TECHNICAL APPROACH:
- Technologies to be used (programming languages, frameworks, hardware) — list 4-6 items
- Methodology and process for implementation — describe 3-5 process steps
- Generate a valid Mermaid.js flowchart (graph TD) representing the architecture.

SLIDE 4 - FEASIBILITY AND VIABILITY:
- Analysis of the feasibility of the idea (3-4 points)
- Potential challenges and risks (2-3 points)
- Strategies for overcoming these challenges (2-3 points)
- costBreakdown: Generate a realistic 12-month budget/cost breakdown for cloud, hardware, and operations (3-4 items).

SLIDE 5 - IMPACT AND BENEFITS:
- Potential impact on the target audience (3-4 points)
- Benefits of the solution - social, economic, environmental, etc. (3-5 points)

SLIDE 6 - RESEARCH AND REFERENCES:
- Generate 3-5 realistic academic-style references (like IEEE/Arxiv papers or reputable journals) related to the problem statement. Include title, authors, year, and a plausible link.

IMPORTANT RULES:
1. Use BULLET POINTS, never paragraphs for slide content.
2. Keep each bullet point to 1-2 lines maximum.
3. Be specific and technical — judges appreciate depth.
4. For EACH slide, write a ~30-second "speakerNotes" script that the presenter should say out loud. Write it in a persuasive, confident tone.
5. In the technical slide, the "mermaidArchitectureDiagram" MUST be a valid, unescaped mermaid code (e.g. "graph TD\\n A[User] --> B[API]"). Do NOT include markdown backticks around the mermaid string inside the JSON.
6. You must respond with ONLY valid JSON matching the schema — no markdown, no explanation.`;

const SIH_GRADER_PROMPT = `You are a tough, critical judge for the Smart India Hackathon.
You will evaluate the user's raw input for their hackathon pitch and grade it across 3 criteria (0-10 each):
1. Innovation Score (Is it unique, novel, and better than existing solutions?)
2. Feasibility Score (Is it technically and financially realistic?)
3. Impact Score (Does it solve a massive problem with clear benefits?)

Provide actionable feedback and 2-3 specific enhancement suggestions to improve their pitch.
Respond with ONLY valid JSON:
{
  "innovationScore": number,
  "feasibilityScore": number,
  "impactScore": number,
  "overallScore": number,
  "feedback": "string",
  "enhancementSuggestions": ["string"]
}`;

const SIH_ENHANCER_PROMPT = `You are an expert technical writer and startup founder. The user's hackathon idea is good, but needs to sound more professional, technically deep, and impressive.
Take their raw input and enhance it. Expand on their architecture, add realistic challenges, frame their innovation strongly, and add clear, quantifiable benefits.
Respond with ONLY valid JSON matching this structure:
{
  "solutionDescription": "Enhanced solution description",
  "howItAddressesProblem": "Enhanced addressing of problem",
  "whatMakesItInnovative": "Enhanced innovation points",
  "techStack": ["Added", "More", "Modern", "Techs", "If", "Needed"],
  "architectureDescription": "A robust architecture overview",
  "challenges": "More realistic technical/market challenges",
  "strategies": "Stronger mitigation strategies",
  "targetAudience": "More specific target audience",
  "benefits": "Quantifiable and broader impact benefits"
}`;

const SIH_COPILOT_PROMPT = `You are a surgical AI editor for a Smart India Hackathon presentation slide.
You will be given the current JSON state of ONE specific slide, and a user request to modify it.
You MUST modify the JSON to reflect the user's request, but DO NOT alter the core structure or type of the schema.
Only return the updated JSON for that slide, matching its original interface.
Respond with ONLY valid JSON — no markdown, no explanations.`;

// ——— Generate Content Function ———

export function buildSIHPromptMessages(input: SIHUserInput): ChatMessage[] {
  const userPrompt = `Generate professional SIH PPT content based on this information:

BASIC DETAILS:
- Problem Statement ID: ${input.problemStatementId}
- Problem Statement Title: ${input.problemStatementTitle}
- Theme: ${input.theme}
- Category: ${input.psCategory}
- Team ID: ${input.teamId}
- Team Name: ${input.teamName}

SOLUTION DESCRIPTION:
${input.solutionDescription}

HOW IT ADDRESSES THE PROBLEM:
${input.howItAddressesProblem}

WHAT MAKES IT INNOVATIVE:
${input.whatMakesItInnovative}

TECH STACK: ${input.techStack.join(", ")}

ARCHITECTURE/METHODOLOGY:
${input.architectureDescription}

${input.hardwareComponents ? `HARDWARE COMPONENTS:\n${input.hardwareComponents}` : ""}

KEY CHALLENGES:
${input.challenges}

STRATEGIES TO OVERCOME:
${input.strategies}

TARGET AUDIENCE & IMPACT:
${input.targetAudience}

BENEFITS:
${input.benefits}

REFERENCES:
${input.references}

Generate the complete slide content as JSON with this exact structure:
{
  "titleSlide": {
    "problemStatementId": "string",
    "problemStatementTitle": "string",
    "theme": "string",
    "psCategory": "Software or Hardware",
    "teamId": "string",
    "teamName": "string",
    "speakerNotes": "Good morning judges! We are..."
  },
  "ideaSlide": {
    "title": "A concise, catchy title for the idea",
    "solutionPoints": ["point1"],
    "howItAddresses": ["point1"],
    "innovationPoints": ["point1"],
    "competitorMatrix": [{"competitor": "X", "cost": "High", "speed": "Slow", "features": "Basic"}],
    "prototypeImagePrompt": "A highly detailed wireframe of...",
    "speakerNotes": "To solve this massive problem, our proposed solution is..."
  },
  "technicalSlide": {
    "technologies": ["tech1"],
    "methodology": ["step1"],
    "architectureDescription": "Brief architecture overview",
    "mermaidArchitectureDiagram": "graph TD\\n A[User] --> B[API]",
    "speakerNotes": "Let's dive into the technical architecture..."
  },
  "feasibilitySlide": {
    "feasibilityPoints": ["point1"],
    "challenges": ["challenge1"],
    "strategies": ["strategy1"],
    "costBreakdown": [{"item": "AWS EC2", "estimatedCost": "$50/mo", "justification": "Hosting"}],
    "speakerNotes": "From a feasibility standpoint..."
  },
  "impactSlide": {
    "targetAudienceImpact": ["impact1"],
    "benefits": ["benefit1"],
    "speakerNotes": "The impact of our solution will be..."
  },
  "referencesSlide": {
    "references": [{"title": "Paper 1", "authors": "Smith et al.", "year": "2023", "link": "https://..."}],
    "speakerNotes": "Thank you. We used the following references..."
  }
}

Respond with ONLY the JSON object, nothing else.`;

  return [
    { role: "system", content: SIH_SYSTEM_PROMPT },
    { role: "user", content: userPrompt },
  ];
}

export function buildGraderMessages(input: SIHUserInput): ChatMessage[] {
  const userPrompt = `Grade this hackathon proposal:
Solution: ${input.solutionDescription}
Innovation: ${input.whatMakesItInnovative}
Tech Stack: ${input.techStack.join(", ")}
Architecture: ${input.architectureDescription}
Challenges & Strategies: ${input.challenges} | ${input.strategies}
Impact & Benefits: ${input.targetAudience} | ${input.benefits}
  `;
  return [
    { role: "system", content: SIH_GRADER_PROMPT },
    { role: "user", content: userPrompt },
  ];
}

export function buildEnhancerMessages(input: SIHUserInput): ChatMessage[] {
  const userPrompt = `Enhance this hackathon proposal:
Solution: ${input.solutionDescription}
Innovation: ${input.whatMakesItInnovative}
Tech Stack: ${input.techStack.join(", ")}
Architecture: ${input.architectureDescription}
Challenges & Strategies: ${input.challenges} | ${input.strategies}
Impact & Benefits: ${input.targetAudience} | ${input.benefits}
  `;
  return [
    { role: "system", content: SIH_ENHANCER_PROMPT },
    { role: "user", content: userPrompt },
  ];
}

export function buildCopilotMessages(currentSlideJson: any, userRequest: string): ChatMessage[] {
  return [
    { role: "system", content: SIH_COPILOT_PROMPT },
    { role: "user", content: `CURRENT SLIDE JSON:\n${JSON.stringify(currentSlideJson, null, 2)}\n\nUSER REQUEST: ${userRequest}` }
  ];
}

// ——— Parse AI Responses ———

export function parseSIHResponse(response: string): SIHSlideContent | null {
  try {
    let jsonStr = response.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
    }
    const firstBrace = jsonStr.indexOf("{");
    const lastBrace = jsonStr.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
    }
    const parsed = JSON.parse(jsonStr);
    if (!parsed.titleSlide || !parsed.ideaSlide || !parsed.technicalSlide) return null;
    return parsed as SIHSlideContent;
  } catch (err) {
    console.error("Failed to parse SIH AI response:", err);
    return null;
  }
}

export function parseGraderResponse(response: string): SIHRubricGrade | null {
  try {
    let jsonStr = response.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
    }
    const firstBrace = jsonStr.indexOf("{");
    const lastBrace = jsonStr.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
    }
    const parsed = JSON.parse(jsonStr);
    if (parsed.overallScore === undefined) return null;
    return parsed as SIHRubricGrade;
  } catch (err) {
    console.error("Failed to parse Grader response:", err);
    return null;
  }
}

export function parseEnhancerResponse(response: string): SIHEnhancedInput | null {
  try {
    let jsonStr = response.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
    }
    const firstBrace = jsonStr.indexOf("{");
    const lastBrace = jsonStr.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
    }
    const parsed = JSON.parse(jsonStr);
    if (!parsed.solutionDescription) return null;
    return parsed as SIHEnhancedInput;
  } catch (err) {
    console.error("Failed to parse Enhancer response:", err);
    return null;
  }
}

export function parseCopilotResponse(response: string): any | null {
  try {
    let jsonStr = response.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
    }
    const firstBrace = jsonStr.indexOf("{");
    const lastBrace = jsonStr.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
    }
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error("Failed to parse Copilot response:", err);
    return null;
  }
}

// ——— Color Themes ———

export interface SIHColorTheme {
  name: string;
  label: string;
  primary: string;      // Footer bar, accent
  primaryDark: string;   // Title text
  accent: string;        // Highlights
  headerBg: string;      // Slide header background
  bodyText: string;      // Body text color
  preview: string;       // Preview color for UI
}

export const SIH_COLOR_THEMES: SIHColorTheme[] = [
  {
    name: "sih-blue",
    label: "SIH Official Blue",
    primary: "0070C0",
    primaryDark: "1F497D",
    accent: "4F81BD",
    headerBg: "FFFFFF",
    bodyText: "000000",
    preview: "#0070C0",
  },
  {
    name: "dark-pro",
    label: "Dark Professional",
    primary: "2D2D2D",
    primaryDark: "1A1A2E",
    accent: "E94560",
    headerBg: "FFFFFF",
    bodyText: "000000",
    preview: "#1A1A2E",
  },
  {
    name: "orange-energy",
    label: "Orange Energy",
    primary: "FF6C37",
    primaryDark: "E55A2B",
    accent: "FF8C5A",
    headerBg: "FFFFFF",
    bodyText: "000000",
    preview: "#FF6C37",
  },
  {
    name: "green-eco",
    label: "Green Eco",
    primary: "27AE60",
    primaryDark: "1E8449",
    accent: "2ECC71",
    headerBg: "FFFFFF",
    bodyText: "000000",
    preview: "#27AE60",
  },
];

// ——— Tech Stack Options ———

export const TECH_STACK_OPTIONS = [
  // Frontend
  "React", "Next.js", "Vue.js", "Angular", "HTML/CSS", "Tailwind CSS", "Flutter", "React Native",
  // Backend
  "Node.js", "Express.js", "Django", "Flask", "FastAPI", "Spring Boot", "Go", "Rust",
  // AI/ML
  "TensorFlow", "PyTorch", "Scikit-learn", "OpenCV", "Hugging Face", "LangChain", "GPT API",
  // Database
  "MongoDB", "PostgreSQL", "MySQL", "Firebase", "Supabase", "Redis", "Neo4j",
  // Cloud
  "AWS", "Google Cloud", "Azure", "Docker", "Kubernetes", "Vercel",
  // Blockchain
  "Ethereum", "Solidity", "Web3.js", "Polygon",
  // IoT/Hardware
  "Arduino", "Raspberry Pi", "ESP32", "Sensors", "RFID",
  // Mobile
  "Android (Kotlin)", "iOS (Swift)", "Dart",
  // Other
  "Python", "Java", "C++", "JavaScript", "TypeScript", "Kotlin", "GraphQL", "REST API",
];
