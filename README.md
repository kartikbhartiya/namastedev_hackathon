# Orbit Study OS (v3.0)

Orbit is an intelligent, high-end operating workspace for computer science. Designed around the aesthetics of professional desktop apps, Orbit provides students and educators with real-time algorithm stack tracing, visual concept pathfinding, mock behavioral/technical interviews, and proctored exam simulations.

---

## Key Features

### 1. Code Execution Tracer
* **Visual Data Structure Canvas**: Traces code stack executions, drawing physical nodes, child connections, and layout indexes for **Singly/Doubly Linked Lists**, **Binary Trees**, **Arrays**, and **Graphs**.
* **Algorithmically Accurate Pointer Shifts**: When an algorithm modifies links (e.g. reversing a singly linked list, rotating BST branches), **the connection arrows dynamically redraw their directions** on screen.
* **Slideshow Controls**: Step back or forward manually (slide show controls) or play automatic loop simulations.
* **Syntax Keyword Highlighter**: Displays JavaScript/TypeScript code with clean syntax highlighting and line numbers.

### 2. AI Concept Graph
* **Hierarchical Syllabus Maps**: Breaks down any curriculum topic into a structured node hierarchy.
* **Smart Node Explanations**: Click any node to stream detailed concept definitions and analogies.

### 3. AI Study Tutor
* **Interactive Chat**: Work through DSA and systems concepts with a supportive, contextual AI coach.
* **Instant Load (Judge Mode)**: Integrated database query bypass for the `demo-judge` user profile, enabling instantaneous loading without Supabase lookup timeouts.

### 4. Practice & Assessment Suite
* **DSA Challenges & Flashcards**: Syllabi-linked data structure quizzes using spaced repetition principles.
* **AI Interviewer & Exam Hall**: Simulated mock interviews and proctored assessments.

---

## AI Provider Configuration (OpenAI & Groq Compatibility)

Orbit is fully compatible with both **Groq** and **OpenAI**. 

### 1. File Configuration (`.env`)
Create a `.env` file in the root directory (whitespace-sensitive):
```env
# AI API Key configurations
NEXT_PUBLIC_GROQ_API_KEY=gsk_your_groq_key_here
NEXT_PUBLIC_OPENAI_API_KEY=sk-proj-your_openai_key_here

# Supabase database details
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 2. Custom Keys via UI (Judge Config override)
Judges can easily input their own active API key directly inside the app:
1. Navigate to **Settings** (profile avatar on the command dock).
2. Orbit will automatically read default keys from `.env`, but judges can override configurations instantly in the console settings panel if required.
3. The default model settings are `llama-3.3-70b-versatile` for Groq, and `gpt-4o-mini` for OpenAI.

---

## Quick Start (Local Setup)

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Run the local development server**:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your browser.
4. Click **Judge Demo Sign-In** to launch with preconfigured BTech student profile stats (12.4h Focus Hours, 8 Streak days, and 3 active achievements).

---

## Containerized Setup (Docker)

To run the application inside a containerized environment:

1. **Build the Docker Image**:
   ```bash
   docker build -t orbit-study-os:latest .
   ```
2. **Run the Docker Container**:
   ```bash
   docker run -d -p 3000:3000 --name orbit-app --env-file .env orbit-study-os:latest
   ```
3. Access the containerized application at [http://localhost:3000](http://localhost:3000).

---

## Submission & Push Commands

To push this codebase along with its docker container:

### Git Code Submission
```bash
git add .
git commit -m "feat: complete Orbit V3 desktop redesign & dynamic code tracers"
git push origin main
```

### Docker Image Registry Push (GitHub Packages)
```bash
# Login to GitHub Packages
echo $CR_PAT | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

# Tag and push
docker tag orbit-study-os:latest ghcr.io/YOUR_GITHUB_USERNAME/orbit-study-os:latest
docker push ghcr.io/YOUR_GITHUB_USERNAME/orbit-study-os:latest
```
