# ExamArchitect — Master Implementation Plan & Progress Report

**Predictive Exam Analytics & AI-Powered Study Plan Builder**

This document tracks the core design choices, system architecture, database migrations, and development roadmap of the ExamArchitect platform.

---

## 📋 Technology & Infrastructure Stack

| Layer | Component | Status |
|---|---|---|
| **Frontend** | React 19, Vite 8, Tailwind CSS v4, Chart.js 4, Three.js Globe, PWA | **Production Ready** (Hosted on Vercel) |
| **Backend** | Python 3.11, FastAPI, SQLAlchemy 2, Uvicorn | **Production Ready** (Hosted on Render) |
| **Database** | SQLite (Local Dev) / Supabase PostgreSQL (Production DB) | **Live & Connected** |
| **Security** | Supabase Row-Level Security (RLS) with 27 Fine-Grained Policies | **Enforced** |
| **CI/CD** | GitHub Actions Pipeline (Automated checks on pull requests) | **Active** |
| **AI Stack** | Google Gemini (Primary) + Groq (Fast) + Cerebras (Bulk Ingestion) | **Fully Operational** |

---

## 🕰️ Core Architectural Features & Design Choices

### 1. Hybrid Analytical Model
* **Statistical Logic:** Unlike traditional AI tools that guess topics using prompt heuristics, ExamArchitect uses statistical regression models built on 12+ years of historical exam data (e.g. topic frequency, recency weight, difficulty indices, co-occurrence correlation).
* **AI Utilities:** LLMs (Gemini) are used strictly as a **utility** for visual PDF question extraction, semantic taxonomy tagging, generating predictions markdown narratives, and serving as the interactive AI Syllabus Mentor.

### 2. Syllabus Versioning (Topic Continuity)
* When a syllabus changes (e.g. GATE CS adding topics in 2021 and removing legacy ones), historical questions on defunct topics shouldn't skew current predictions.
* **Syllabus Tables:** `syllabus_versions` and `syllabus_version_topics` dynamically filter out deprecated topics based on active years, keeping predictions statistically relevant to the current exam.

### 3. Private Network Access (PNA) Isolation
* The production frontend is served via HTTPS (`vercel.app`), while the secure backend runs on Render.
* To prevent browsers from triggering network security prompts (Chrome's "Access other apps and services on this device"), we route all requests, including diagram images, through the dynamic `API_BASE` domain rather than fallback localhost addresses.

---

## 🗺️ Completed Milestones

### Phase 1: Core Scaffolding
- [x] Full-stack architecture (FastAPI + React 19 + Vite 8 + SQLite).
- [x] Pre-seeded exam categories and full GATE CS topics taxonomy.
- [x] Sleek premium dark design system using HSL variables, glassmorphism, and animations.

### Phase 2: AI-Vision Ingestion Pipeline
- [x] Standalone OCR ingestion scripts parsing scanned image PDFs (e.g. GATE 2011).
- [x] Paraphrasing engine prompts using Gemini to avoid copyright recitation filters while keeping mathematical formulas pristine.
- [x] Image-slicing logic using coordinate bounding boxes to crop diagrams and host them.
- [x] Admin Review Dashboard for human-in-the-loop validation of staged questions.

### Phase 3: DB Port & Advanced Security
- [x] Migrated database layer from SQLite to remote Supabase PostgreSQL.
- [x] Wrote and applied `rls_migration.sql` to configure 27 Row-Level Security (RLS) policies.
- [x] Sandbox testing: Unit tests use a mock in-memory SQLite sandbox to prevent accidental deletion/modification of production Supabase data.

### Phase 4: UI/UX & Premium Alignment
- [x] Bento Grid card alignment: Fixed unbalanced layouts on the landing page and unified card heights.
- [x] Dynamic color picker propagation: The selected theme color (indigo, emerald, amber, rose) dynamically themes sparklines, loading states, planner routes, and year-by-year cells.
- [x] Three.js Globe: Floated coordinate lines to radius `100.8` to fix bottom hemisphere clipping.
- [x] Compact pagination: Paginated AI predictions to 6 items to eliminate vertical clutter.
- [x] Clean question indexing: Implemented list sequential numbering starting at 1 while displaying original exam indices only when mismatched (avoiding duplicate labels).

---

## 🔮 Upcoming Phases

### Phase 5: Interactive Gamification (Gamified XP Engine)
* **Status:** In Design.
* **Goals:** Create a client-side XP balance tracker stored in local storage:
  - Users start with a base balance (e.g. 500 XP).
  - Using the AI Syllabus Mentor costs (decreases) XP (e.g. -50 XP per prompt).
  - Verifying correct answers on the Question Browser gains XP (e.g. +10 XP for Easy, +20 XP for Medium, +30 XP for Hard).
  - Completing mock exams or study plans awards high-tier bonuses (+100 XP / +1000 XP).
  - Add a dynamic XP counter badge in the navbar next to user profile details.

### Phase 6: Collaborative & Real-Time Prep
* Create group study challenges where aspirants studying for the same exam can share custom-curated question sets and flashcards.
* Interactive holdout backtesting visualizer showing how the prediction model would have scored against real papers.
