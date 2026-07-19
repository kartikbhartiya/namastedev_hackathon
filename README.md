<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-Database-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/Groq-LLM-FF6C37?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
</p>

<h1 align="center">🪐 Orbit Study OS</h1>

<p align="center">
  <strong>An AI-powered, desktop-class operating workspace for computer science students</strong>
</p>

<p align="center">
  <em>Real-time algorithm tracing · Visual concept mapping · AI tutoring · Mock interviews · Proctored exams</em>
</p>

---

## 📖 Project Description

**Orbit Study OS** is a next-generation, intelligent study platform designed to transform how computer science students learn, practice, and prepare for technical careers. Unlike traditional learning management systems that rely on static content, Orbit creates an **interactive operating system experience** — a unified workspace where every learning activity happens within a cohesive, visually stunning desktop environment.

The platform combines **real-time AI tutoring** with **visual algorithm execution tracing**, allowing students to not just read about data structures and algorithms but *watch them execute step-by-step* with dynamic pointer shifts, node animations, and stack frame visualizations. Orbit also features a full **assessment suite** including AI-powered mock interviews, proctored exam simulations, and adaptive quizzes — making it a complete end-to-end preparation tool for academic exams and technical interviews alike.

### 🎯 Problem Statement

Computer science students face fragmented tooling — one app for notes, another for coding practice, another for flashcards, another for interview prep. There's no unified, intelligent workspace that adapts to their learning style and provides real-time feedback. Orbit solves this by consolidating **learning**, **practice**, and **assessment** into a single, AI-augmented desktop-class experience.

### 💡 What Makes Orbit Different

| Traditional Platforms | Orbit Study OS |
|---|---|
| Static video lectures | Interactive AI tutor with streaming responses |
| Text-based algorithm explanations | Visual code execution tracer with animated data structures |
| Disconnected quiz tools | Syllabus-linked DSA challenges with spaced repetition |
| No interview preparation | AI-powered mock behavioral & technical interviews |
| Generic UI | Premium dark-themed desktop OS aesthetic |

---

## ✨ Key Features

### 1. 🔬 Code Execution Tracer
- **Visual Data Structure Canvas** — Traces code stack executions, rendering physical nodes, child connections, and layout indexes for **Singly/Doubly Linked Lists**, **Binary Trees**, **Arrays**, and **Graphs**
- **Algorithmically Accurate Pointer Shifts** — When an algorithm modifies links (e.g., reversing a linked list, rotating BST branches), connection arrows dynamically redraw their directions on screen
- **Slideshow Controls** — Step back/forward manually or play automatic loop simulations
- **Syntax Keyword Highlighter** — Displays JavaScript/TypeScript code with clean syntax highlighting and line numbers

### 2. 🧠 AI Study Tutor
- **Multi-Modal Chat Interface** — Work through DSA and systems concepts with a contextual AI coach that supports markdown, KaTeX math rendering, and code blocks
- **6 Specialized Modes** — General chat, Study Plan generation, Mind Map visualization, Video Script creation, Document Q&A, and Simulation mode
- **Session Management** — Persistent chat history with session sidebar for revisiting past conversations
- **Document Processing** — Upload PDFs, code files, and documents for AI-powered Q&A with local vector store retrieval (TF-IDF scoring)

### 3. 🗺️ AI Concept Graph
- **Hierarchical Syllabus Maps** — Breaks down any curriculum topic into a structured, interactive node hierarchy
- **Smart Node Explanations** — Click any node to stream detailed concept definitions and analogies in real-time

### 4. 🧪 Interactive Simulations
- **Physics Engine** — Gauss's Law, Pendulum Motion, Projectile Motion, and Wave Interference simulations
- **Algorithm Visualizer** — Sorting algorithm step-by-step animations (Bubble, Merge, Quick, etc.)
- **Graph Plotter** — Interactive mathematical function plotting with real-time parameter controls
- **Simulation Registry** — Extensible registry pattern for adding new simulation scenes

### 5. 📝 Practice & Assessment Suite
- **DSA Challenges & Flashcards** — Syllabi-linked data structure quizzes using spaced repetition principles
- **AI Mock Interviewer** — Timed behavioral and technical interview grading simulations
- **Exam Hall** — Proctored examination environment customized for logic assessment
- **Adaptive Mock Tests** — Speed-based assessment wrappers that adapt to student performance

### 6. ⚔️ Debate Arena
- **AI Argumentation Module** — Challenge AI-generated logical fallacies in timed argument sessions
- **Critical Thinking Training** — Structured debate framework for developing analytical reasoning

---

## 🏗️ Architecture & Tech Stack

```
┌─────────────────────────────────────────────────────────────┐
│                     Orbit Study OS                          │
├──────────────┬──────────────┬───────────────┬───────────────┤
│   Frontend   │   AI Layer   │   Data Layer  │  Deployment   │
├──────────────┼──────────────┼───────────────┼───────────────┤
│ Next.js 15   │ Groq API     │ Supabase      │ Docker        │
│ React 19     │ OpenAI API   │ LocalStorage  │ Node 18       │
│ TypeScript   │ NVIDIA NIM   │ Vector Store  │ Multi-stage   │
│ Tailwind CSS │ Together AI  │ (TF-IDF)      │ Build         │
│ Framer Motion│ Ollama       │               │               │
│ Radix UI     │ (Local LLMs) │               │               │
│ Lucide Icons │              │               │               │
│ KaTeX        │              │               │               │
└──────────────┴──────────────┴───────────────┴───────────────┘
```

### Frontend
| Technology | Purpose |
|---|---|
| **Next.js 15** (App Router) | Server-side rendering, file-based routing |
| **React 19** | UI component architecture with latest features |
| **TypeScript 5.7** | Type-safe development across the entire codebase |
| **Tailwind CSS 3.4** | Utility-first styling with custom dark theme tokens |
| **Framer Motion** | Smooth micro-animations and page transitions |
| **Radix UI** | Accessible, unstyled primitives (Dialog, Tabs, Select, Tooltip, etc.) |
| **KaTeX** | Mathematical equation rendering in chat and quizzes |
| **react-markdown** | Rich markdown rendering with GFM and math plugin support |

### AI & Backend
| Technology | Purpose |
|---|---|
| **Groq** (default) | Ultra-fast inference with `llama-3.3-70b-versatile` |
| **OpenAI** (fallback) | GPT-4o-mini for high-quality completions |
| **NVIDIA NIM** | Enterprise-grade `meta/llama-3.3-70b-instruct` |
| **Together AI** | `Llama-3.3-70B-Instruct-Turbo` for cost-effective scaling |
| **Ollama** | Local LLM support for offline usage |
| **Supabase** | PostgreSQL database for user profiles, sessions, and progress |
| **Local Vector Store** | TF-IDF keyword-matching for document Q&A (zero-latency, offline) |
| **AI Usage Tracker** | Token counting, daily limits (100K tokens/day), and analytics |

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- API key from [Groq](https://console.groq.com/) or [OpenAI](https://platform.openai.com/)

### 1. Clone & Install
```bash
git clone https://github.com/YOUR_USERNAME/orbit-study-os.git
cd orbit-study-os
npm install
```

### 2. Configure Environment
Create a `.env` file in the root directory:
```env
# AI API Keys (at least one required)
NEXT_PUBLIC_GROQ_API_KEY=gsk_your_groq_key_here
NEXT_PUBLIC_OPENAI_API_KEY=sk-proj-your_openai_key_here

# Optional: Additional providers
NEXT_PUBLIC_NVIDIA_API_KEY=your_nvidia_nim_key
NEXT_PUBLIC_TOGETHER_API_KEY=your_together_key

# Supabase (for persistent user data)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Open & Explore
Navigate to [http://localhost:3000](http://localhost:3000) and click **Judge Demo Sign-In** to launch with a preconfigured BTech student profile (12.4h Focus Hours, 8-day Streak, 3 active achievements).

> **💡 Judge Mode:** Judges can override API keys directly from the Settings panel inside the app — no `.env` restart required.

---

## 🐳 Docker Deployment

### Build & Run
```bash
# Build the multi-stage Docker image
docker build -t orbit-study-os:latest .

# Run with environment variables
docker run -d -p 3000:3000 --name orbit-app --env-file .env orbit-study-os:latest
```

### Push to Registry
```bash
# Login to GitHub Container Registry
echo $CR_PAT | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

# Tag and push
docker tag orbit-study-os:latest ghcr.io/YOUR_GITHUB_USERNAME/orbit-study-os:latest
docker push ghcr.io/YOUR_GITHUB_USERNAME/orbit-study-os:latest
```

---

## 📁 Project Structure

```
orbit-study-os/
├── src/
│   ├── app/                          # Next.js App Router pages
│   │   ├── page.tsx                  # Dashboard (main hub)
│   │   ├── layout.tsx                # Root layout with providers
│   │   ├── ai-tutor/                 # AI Tutor chat interface
│   │   ├── code/                     # Code execution tracer
│   │   ├── concept-graph/            # Visual concept mapping
│   │   ├── debate/                   # AI debate arena
│   │   ├── exam/                     # Proctored exam hall
│   │   ├── interview/                # AI mock interviews
│   │   ├── quizzes/                  # DSA challenges & flashcards
│   │   ├── profile/                  # User profile & settings
│   │   └── auth/                     # Authentication pages
│   ├── components/
│   │   ├── ai-tutor/                 # Chat, MindMap, StudyPlan, ModeSelector
│   │   ├── chat/                     # Markdown renderer for chat
│   │   ├── dashboard/                # PillNavbar navigation
│   │   ├── simulations/              # Physics & algorithm simulations
│   │   │   └── scenes/               # Individual simulation components
│   │   └── ui/                       # Radix-based design system
│   ├── contexts/                     # Auth & Theme React contexts
│   ├── hooks/                        # Custom hooks (toast)
│   └── lib/
│       ├── aiProvider.ts             # Multi-provider AI registry
│       ├── aiTutor.ts                # AI tutor conversation engine
│       ├── aiUsageTracker.ts         # Token & request tracking
│       ├── documentProcessor.ts      # File upload & chunking
│       ├── groq.ts                   # Groq SDK integration
│       ├── supabase.ts               # Database client & queries
│       ├── vectorStore.ts            # Local TF-IDF vector search
│       └── providers/                # AI provider implementations
├── Dockerfile                        # Multi-stage production build
├── tailwind.config.ts                # Custom dark theme tokens
├── next.config.mjs                   # Next.js configuration
└── package.json
```

---

## 🧩 AI Provider Configuration

Orbit supports **5 AI providers** with a unified interface and hot-swappable configuration:

| Provider | Default Model | Speed | Notes |
|---|---|---|---|
| **Groq** ⭐ | `llama-3.3-70b-versatile` | ⚡ Ultra-fast | Default provider, best for real-time chat |
| **OpenAI** | `gpt-4o-mini` | Fast | Highest quality completions |
| **NVIDIA NIM** | `meta/llama-3.3-70b-instruct` | Fast | Enterprise-grade inference |
| **Together AI** | `Llama-3.3-70B-Instruct-Turbo` | Fast | Cost-effective at scale |
| **Ollama** | `llama3` | Varies | Fully offline, local LLM |

Providers can be switched live from the **Settings** panel — no restart required. The system includes automatic fallback support and real-time connection testing.

---

## 🔥 Challenges Faced

### 1. Real-Time Algorithm Visualization with Dynamic Pointer Rewriting
Building the Code Execution Tracer was the most technically demanding feature. Unlike simple step-through debuggers, Orbit needed to **visually redraw connection arrows in real-time** when algorithms mutate data structure links (e.g., reversing a linked list, rotating BST nodes). We built a custom canvas rendering system that tracks pointer state changes at each execution step and animates arrow direction transitions smoothly — this required careful state management between the simulation engine and the React rendering layer.

### 2. Streaming AI Responses with Multi-Provider Abstraction
Supporting **5 different AI providers** (Groq, OpenAI, NVIDIA, Together, Ollama) each with different API contracts, streaming protocols, and error handling patterns was a significant architectural challenge. We designed a `Provider Registry` pattern with a common `AIProvider` interface that normalizes both blocking and `AsyncGenerator`-based streaming completions. Hot-swapping providers at runtime without restarting the app required careful cache invalidation and event-driven config propagation.

### 3. Offline-First Vector Search Without Heavy Dependencies
For the Document Q&A feature, we needed semantic search capabilities but couldn't afford to ship large embedding models in a hackathon context. We engineered a **lightweight TF-IDF keyword-matching vector store** that runs 100% client-side with zero latency and zero network overhead. It approximates cosine similarity scoring using term-frequency analysis, enabling document retrieval without any external embedding API calls.

### 4. Physics Simulations in React Without a Game Engine
The interactive physics simulations (Gauss's Law field lines, pendulum motion, projectile trajectories, wave interference patterns) were built **entirely in React with Canvas API** — no Unity, no Three.js, no game engine. Achieving smooth 60fps animations while keeping React's reconciliation loop stable required requestAnimationFrame orchestration, careful ref management, and decoupling simulation state from React state.

### 5. Desktop-Class UI in a Browser
Achieving the "operating system" aesthetic — with a pill-shaped dock navbar, monochromatic metric widgets, editorial card layouts, and terminal-style system logs — required extensive custom CSS engineering. Every component was hand-crafted for a dark, premium feel without relying on pre-built component libraries for visual design. Maintaining visual consistency across 10+ distinct module pages while keeping the codebase maintainable was an ongoing design systems challenge.

### 6. Authentication with Instant Judge Mode
Implementing **instant demo access** for hackathon judges (bypassing Supabase auth lookup delays) while still supporting full persistent auth for real users required a dual-path authentication context. The `demo-judge` profile loads with preconfigured stats and achievements instantly, while real users go through the standard Supabase flow with session persistence.

---

## 👥 Team

Built for the **NamasteDev Hackathon** 🚀

---

## 📄 License

This project is built for hackathon submission and educational purposes.

---

<p align="center">
  <strong>Built with ❤️ and a lot of ☕ during the hackathon</strong>
</p>
