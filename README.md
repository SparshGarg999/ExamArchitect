<div align="center">

# 🎯 ExamArchitect

**Predictive Exam Analytics & AI-Powered Study Plan Builder**

[![Built with React](https://img.shields.io/badge/Frontend-React_19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![FastAPI Backend](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![SQLite](https://img.shields.io/badge/Database-SQLite-003B57?logo=sqlite&logoColor=white)](https://sqlite.org)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-5A0FC8?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

*Analyzes 10+ years of past exam papers to discover topic patterns, predict likely topics for upcoming exams, and generate AI-weighted study plans — all for free.*

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#1-backend-setup)
  - [Frontend Setup](#2-frontend-setup)
  - [Seed Data](#3-seed-the-database)
- [Usage Guide](#-usage-guide)
- [API Reference](#-api-reference)
- [Data Pipeline](#-data-pipeline)
- [Development Workflow](#-development-workflow)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

ExamArchitect is a full-stack web application that ingests past exam papers (starting with **GATE CS**), extracts and classifies questions by topic using AI, then provides:

1. **Interactive Heatmaps** — year-over-year topic frequency at subject and subtopic levels
2. **AI Predictions** — statistically-driven probability scores for upcoming exam topics
3. **Dynamic Study Plans** — personalized roadmaps based on your weaknesses and available days
4. **Question Browser** — searchable question bank with filters, answer spoilers, and difficulty tags
5. **Admin Panel** — human-in-the-loop review dashboard for ingested question data

> **Core Principle**: AI is a *utility* for parsing, tagging, and explaining. The core prediction engine is **statistical and mathematical**, not purely LLM-based, ensuring reliability and transparency.

---

## ✨ Features

### 📊 Dashboard & Heatmap
- **Subject-level heatmap** showing marks distribution across 10 years
- **Accordion drilldown** — click any subject row to expand subtopic-level breakdowns
- **Trend line charts** (Chart.js) — click any cell to see the year-over-year trend
- **Color-coded cells** — Low (amber), Medium (orange), Critical (red glow) based on marks weight

### 🔍 Question Browser
- **Full-text search** with 300ms debounce — searches across all papers
- **Subject filter dropdown** to narrow results
- **Rich question cards** with gradient badges, difficulty tags (Easy/Medium/Hard), marks, and question type (MCQ/NAT)
- **Answer spoilers** — collapsible reveal buttons to prevent accidental spoiling
- **Subject > Topic breadcrumbs** on each card

### 📅 Dynamic Study Plan
- **Custom duration** — enter any number of days (15, 30, 45, 90, etc.)
- **Weakness input** — type topics manually or use curated chip selectors
- **AI-generated plans** with phased breakdowns (Foundation → Core → Advanced → Revision)

### ⚙️ Admin Panel
- **Paper ingestion** — upload PDFs, trigger AI parsing pipeline
- **Staged question review** — approve, reject, or retag parsed questions
- **Re-seed button** — bulk reset and re-ingest 10 years of historical data
- **AI prediction regeneration** — trigger statistical model re-computation

### 🔧 Technical
- **PWA-ready** — installable on mobile with offline shell support
- **Unicode-safe search** — handles curly quotes, apostrophes, and OCR artifacts
- **Fallback LLM chain** — Gemini → Groq → Cerebras → OpenRouter → Ollama
- **Zero cost** — entirely built on free-tier APIs and local tools

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    Frontend (Vite + React 19)                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │Dashboard │ │Question  │ │Study Plan│ │ Admin    │ │ PWA    │ │
│  │& Heatmap │ │Browser   │ │Generator │ │ Panel    │ │ Shell  │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────────┘ │
│       └─────────────┴────────────┴─────────────┘                 │
│                           ▼  REST API calls                      │
├──────────────────────────────────────────────────────────────────┤
│                    Backend (FastAPI + Python)                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────────┐ │
│  │REST API  │ │Ingestion │ │Prediction│ │  Study Plan          │ │
│  │Endpoints │ │Pipeline  │ │Engine    │ │  Generator           │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────────────────────┘ │
│       ▼            ▼            ▼                                │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                  SQLite Database                              │ │
│  │  exam_categories → exams → topics → papers → questions        │ │
│  │  topic_year_stats │ predictions │ syllabus_versions            │ │
│  └──────────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────────┤
│                    AI Layer (Utility Only)                        │
│  Gemini (Primary) → Groq (Fast) → Cerebras (Bulk) → Ollama      │
│  Used for: PDF parsing, topic tagging, prediction narratives     │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🛠 Tech Stack

| Layer        | Technology                                          |
|-------------|-----------------------------------------------------|
| **Frontend** | React 19, Vite 8, Chart.js 4, Lucide Icons, PWA    |
| **Backend**  | Python 3.11+, FastAPI, SQLAlchemy 2, Uvicorn        |
| **Database** | SQLite (file-based, zero-config)                    |
| **PDF Parsing** | pdfplumber, PyMuPDF (fitz)                      |
| **AI/LLM**  | Google Gemini, Groq, Cerebras, OpenRouter, Ollama   |
| **Styling**  | Vanilla CSS (dark mode, glassmorphism, animations)  |

---

## 📁 Project Structure

```
ExamArchitect/
├── backend/                    # FastAPI Python backend
│   ├── app/
│   │   ├── main.py             # FastAPI app, all REST endpoints
│   │   ├── models.py           # SQLAlchemy ORM models
│   │   ├── database.py         # DB engine & session factory
│   │   ├── init_db.py          # Database seeding (categories, exams, topics)
│   │   ├── ingestion.py        # Question ingestion & text normalization
│   │   ├── pdf_parser.py       # PDF text extraction utilities
│   │   ├── ai_tagger.py        # LLM-based topic classification
│   │   ├── analytics.py        # Statistical prediction engine
│   │   └── jules_utils.py      # Utility helpers
│   ├── data/                   # Cached/intermediate data files
│   ├── parse_and_ingest_all.py # Bulk PDF → DB ingestion script
│   ├── run.py                  # Uvicorn server entry point
│   ├── requirements.txt        # Python dependencies
│   ├── .env.example            # Environment variable template
│   └── diagnose_pdf.py         # PDF debugging utility
│
├── frontend/                   # React + Vite frontend
│   ├── src/
│   │   ├── App.jsx             # Main application (all views & state)
│   │   ├── App.css             # Component styles (dark mode)
│   │   ├── index.css           # Design system tokens & global styles
│   │   ├── main.jsx            # React entry point
│   │   ├── components/
│   │   │   └── AdminPanel.jsx  # Admin review dashboard component
│   │   └── assets/             # Static assets (icons, images)
│   ├── public/                 # PWA manifest, favicon
│   ├── index.html              # HTML shell
│   ├── vite.config.js          # Vite + PWA configuration
│   ├── package.json            # Node.js dependencies
│   └── eslint.config.js        # Linting configuration
│
├── pdfs/                       # Source GATE CS exam PDFs (2005–2025)
│   ├── 2019_CS_Paper1.pdf
│   ├── GATE2010.pdf
│   ├── GATE-2022-part-1.pdf
│   └── ... (21 PDF files)
│
├── .gitignore                  # Root gitignore
└── README.md                   # This file
```

---

## 🚀 Getting Started

### Prerequisites

| Tool       | Version    | Install                                    |
|-----------|------------|---------------------------------------------|
| **Python** | 3.11+     | [python.org](https://www.python.org/downloads/) |
| **Node.js**| 18+ (LTS) | [nodejs.org](https://nodejs.org/)            |
| **Git**    | Latest     | [git-scm.com](https://git-scm.com/)         |

### 1. Backend Setup

```bash
# Clone the repository
git clone https://github.com/SparshGarg999/ExamArchitect.git
cd ExamArchitect

# Create Python virtual environment
cd backend
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create environment file from template
cp .env.example .env
# Edit .env and add your API keys (Gemini is the primary one needed)
```

### 2. Supabase Integration (Optional but Recommended for Production)

By default, ExamArchitect runs on a local, zero-config SQLite database (`backend/exam_architect.db`). To scale the application, you can connect it directly to a remote Supabase PostgreSQL instance:

1. **Get Supabase DB Connection URI**:
   - Create a project on [Supabase](https://supabase.com).
   - Go to **Project Settings** -> **Database** and copy the **URI** connection string.
2. **Configure Environment Variables**:
   - In `backend/.env`, set the `DATABASE_URL` to your copied connection string.
3. **Apply Row-Level Security (RLS) Policies**:
   - ExamArchitect enforces secure access via 27 database RLS policies. Apply them using the migration utility:
     ```bash
     python apply_rls.py
     ```
   - This automatically parses and applies `rls_migration.sql` to configure SELECT restrictions on public content and secure read/write policies on user data tables.
4. **Isolated Test Suites**:
   - Running tests locally (via `pytest`) automatically bypasses your production database and uses an in-memory SQLite sandbox. This prevents tests from truncating or corrupting your remote Supabase tables.

### 3. Frontend Setup

```bash
# From the project root
cd frontend

# Install Node.js dependencies
npm install
```

### 4. Seed the Database & Run

```bash
# Start the backend server (this auto-creates the DB schema and seeds categories/topics)
cd backend
python run.py
# Server starts at http://localhost:8000

# In a separate terminal, start the frontend dev server
cd frontend
npm run dev
# Frontend starts at http://localhost:5173
```

**Default Admin Credentials:**
- **Email**: `admin@examarchitect.com`
- **Password**: `AdminPassword123!`
*(You will be prompted to change this upon your first login to the Admin Panel)*

**First-time data seeding:**
1. Open the app at `http://localhost:5173`
2. Navigate to the **Dashboard** tab
3. Click the **"Reset & Re-seed 10-Yr Data"** button in the heatmap section
4. Wait for the toast notification confirming successful ingestion

> **Note:** The re-seed process runs `parse_and_ingest_all.py` which extracts questions from all PDFs in the `pdfs/` folder, classifies them, and inserts them into the database. This may take a few minutes.

### Quick Start (Both Servers)

**Terminal 1 — Backend:**
```bash
cd backend
venv\Scripts\activate   # Windows
python run.py
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Then open **http://localhost:5173** in your browser.

---

## 📘 Usage Guide

### Dashboard & Heatmap
1. Select an exam category and exam (e.g., GATE CS)
2. The heatmap shows subjects as rows, years as columns, marks as cell values
3. **Click a subject row** to expand and see subtopic breakdowns
4. **Click any cell** to see the trend chart for that topic

### Question Browser
1. Switch to the **"Question Browser"** tab
2. Select a paper year from the dropdown (or "All Papers" for global search)
3. Use the **search bar** to find questions by text content
4. Click **"Show Answer"** to reveal the correct answer

### Study Plan Generator
1. Switch to the **"Study Plan"** tab
2. Enter the number of days until your exam
3. Add your weak topics (type manually or click curated chips)
4. Click **"Generate Plan"** to get a phased study schedule

### Admin Panel
1. Switch to the **"Admin"** tab
2. Select an exam and paper to review staged questions
3. **Approve** to insert into the database, **Reject** to skip, **Retag** to re-run AI classification

---

## 📡 API Reference

Base URL: `http://localhost:8000`

### Health Check
| Method | Endpoint     | Description            |
|--------|-------------|------------------------|
| GET    | `/health`   | Server health status    |

### Categories & Exams
| Method | Endpoint                    | Description                     |
|--------|-----------------------------|---------------------------------|
| GET    | `/api/categories`           | List all exam categories         |
| GET    | `/api/exams/{exam_id}`      | Get exam details with topics     |

### Heatmap & Analytics
| Method | Endpoint                                           | Description                          |
|--------|---------------------------------------------------|--------------------------------------|
| GET    | `/api/exams/{exam_id}/heatmap`                    | Subject-level heatmap matrix         |
| GET    | `/api/exams/{exam_id}/topics/{topic_id}/heatmap`  | Subtopic-level heatmap (drilldown)   |

### Questions
| Method | Endpoint                                   | Description                                         |
|--------|--------------------------------------------|-----------------------------------------------------|
| GET    | `/api/papers/{paper_id}/questions`         | Questions for a paper (`?search=...&subject_id=...`) |
| GET    | `/api/questions`                           | Global question search across all papers              |

### Papers
| Method | Endpoint           | Description               |
|--------|-------------------|---------------------------|
| GET    | `/api/papers`      | List all ingested papers   |

### Predictions
| Method | Endpoint                                          | Description                          |
|--------|--------------------------------------------------|--------------------------------------|
| GET    | `/api/exams/{exam_id}/predictions`               | Get AI predictions for an exam        |
| POST   | `/api/exams/{exam_id}/predictions/generate`      | Regenerate predictions                |

### Study Plan
| Method | Endpoint                           | Description                     |
|--------|------------------------------------|---------------------------------|
| POST   | `/api/exams/{exam_id}/study-plan`  | Generate a personalized plan     |

### Ingestion (Admin)
| Method | Endpoint                                  | Description                          |
|--------|------------------------------------------|--------------------------------------|
| POST   | `/api/ingest/bulk`                       | Bulk re-seed from all PDFs            |
| POST   | `/api/papers/{paper_id}/parse`           | Re-parse/retag a specific paper       |
| POST   | `/api/papers/{paper_id}/staged/approve`  | Approve staged questions              |

---

## 🔄 Data Pipeline

The ingestion pipeline transforms raw exam PDFs into structured, searchable question data:

```
┌─────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────┐
│  PDFs   │────▶│ PDF Extractor│────▶│ Text Cleaner│────▶│  Regex   │
│ (pdfs/) │     │ (pdfplumber/ │     │ (normalize  │     │ Question │
│         │     │  PyMuPDF)    │     │  unicode)   │     │ Splitter │
└─────────┘     └──────────────┘     └─────────────┘     └────┬─────┘
                                                              │
┌──────────┐     ┌──────────────┐     ┌─────────────┐        │
│ SQLite   │◀────│ Ingestion    │◀────│ AI Topic    │◀───────┘
│ Database │     │ Pipeline     │     │ Tagger      │
│          │     │ (ingestion.py│     │ (Gemini API)│
└──────────┘     └──────────────┘     └─────────────┘
```

### Pipeline Steps

1. **PDF Extraction** — `pdfplumber` or `PyMuPDF` extracts raw text from each page
2. **Text Normalization** — Curly quotes (`'`, `'`), em-dashes (`—`), and `\ufffd` replacement characters are cleaned to ASCII equivalents
3. **Question Splitting** — Regex patterns identify question boundaries (`Q.1`, `Q.2`, etc.) and extract question number, text, options, and marks
4. **Question Classification** — Each question is classified as MCQ, MSQ, or NAT based on option patterns
5. **AI Topic Tagging** — Gemini Vision (or fallback LLMs) assigns each question to a subject → topic from the fixed taxonomy
6. **Database Insertion** — Clean, tagged questions are inserted into the `questions` table with foreign key links to `papers` and `topics`
7. **Statistics Aggregation** — `topic_year_stats` are computed (question count, total marks, avg difficulty per topic per year)

---

## 🧑‍💻 Development Workflow

### Running in Development

```bash
# Terminal 1 — Backend (auto-reload on save)
cd backend
venv\Scripts\activate
python run.py
# → http://localhost:8000 (API docs at /docs)

# Terminal 2 — Frontend (HMR via Vite)
cd frontend
npm run dev
# → http://localhost:5173
```

### Building for Production

```bash
cd frontend
npm run build
# Output → frontend/dist/
```

### Linting

```bash
cd frontend
npm run lint
```

### Database Reset

Delete `backend/exam_architect.db` and restart the backend server. The schema will be re-created automatically. Then click "Reset & Re-seed" in the UI.

### Adding New Exam PDFs

1. Place PDF files in the `pdfs/` directory
2. Update the filename-to-year mapping in `backend/parse_and_ingest_all.py`
3. Click "Reset & Re-seed" in the dashboard, or run:
   ```bash
   cd backend
   python parse_and_ingest_all.py
   ```

---

## 🌐 Hosting & Deployment Guide

This project consists of a FastAPI backend and a Vite + React frontend. They are hosted independently on modern cloud platforms.

### 📁 Root Configuration Files
* **`render.yaml` (Infrastructure as Code):** Having `render.yaml` in the root is standard practice for Render deployments. It is a Blueprint specification file that Render reads to automatically spin up your backend web service, Postgres database, and static sites.
* **`vercel.json`:** Defines custom routing rules and Single Page Application (SPA) rewrite rules to route all traffic to `index.html` on Vercel.

### 1. Backend Deployment (FastAPI + Supabase)
You can host the Python backend on services like **Render**, **Railway**, or **Fly.io**:
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `python run.py` (binds Uvicorn to port `8000` or the `$PORT` environment variable)
- **Environment Variables:**
  - `DATABASE_URL`: Your production PostgreSQL/Supabase connection URI.
  - `GEMINI_API_KEY`: Your Google Gemini API key.
  - `TESTING`: Set to `""` or unset in production to ensure the DB seeds properly.
- **Health Check Endpoint:** `/health` (used for Render deployment checks and uptime monitoring).

### 2. Frontend Deployment (Vite + React)
The frontend build generates static HTML/JS/CSS assets that can be hosted on **Vercel** or **Netlify**:
- **Build Command:** `npm run build`
- **Output/Publish Directory:** `dist`
- **API Base URL Config:** Set the `VITE_API_BASE` environment variable to your deployed backend URL.

---

## 🗺 Roadmap & Project Phases

### ✅ Completed (Phase 1 — Core Architecture)
- [x] Full-stack Vite + React 19 and FastAPI + SQLite skeleton.
- [x] Pre-seeded exam categories and full GATE CS topics taxonomy.
- [x] Core database schema (8 tables) with fully mapped ORM relationships.
- [x] Ingestion pipeline with visual OCR question splitting, text normalization, and diagram slicing.
- [x] Interactive subject → subtopic accordion heatmap with Chart.js trend charts.

### ✅ Completed (Phase 2 — UI/UX & Dynamic Styling)
- [x] **Dynamic Theme Accent Propagation:** Selecting a theme color (indigo, emerald, amber, rose) dynamically customizes year-by-year cells, sparklines, loading states, planner routes, and modals.
- [x] **Premium Bento Grid Alignment:** Redesigned bento layouts to fit in a balanced grid with unified card heights.
- [x] **Three.js Globe Visualizer:** Floating latitude/longitude lines to radius `100.8` to fix bottom hemisphere clipping.
- [x] **Private Network Access (PNA) Isolation:** Removed hardcoded localhost URLs in Question Card images to prevent Chrome local network warnings.

### ✅ Completed (Phase 3 — Database Port & Security)
- [x] **Supabase PostgreSQL Migrations:** Fully ported database layer to remote PostgreSQL.
- [x] **Row-Level Security (RLS) Policies:** Enabled and enforced 27 fine-grained security policies on Supabase.
- [x] **Isolated Unit Testing:** Created a sandbox environment where tests run on local in-memory SQLite, keeping production database tables safe.

### 🔮 Future (Phase 4 — Gamification & Advanced Analytics)
- [ ] **Interactive XP Balance System:** Maintain a local storage XP balance where using the AI Mentor costs XP (-50 XP) and verifying correct answers gains XP (+10 XP).
- [ ] **Collaborative Learning Hub:** Sharing custom-curated question sets and flashcards with other aspirants.
- [ ] **Holdout Validation Backtesting Visualizer:** Visual scorecard evaluating prediction algorithms against actual historical exams.

---

## 🤝 Contributing & Workflows

### Branch Naming Convention
* `feature/` — new features (e.g. `feature/xp-balance-engine`)
* `fix/` — bug fixes (e.g. `fix/globe-line-clipping`)
* `refactor/` — code cleaning (e.g. `refactor/api-endpoints`)
* `ci/` — pipeline changes (e.g. `ci/github-actions`)

### Pull Request & Review Workflow
1. Fork the repository and create your feature branch.
2. Ensure you run `npm run build` locally in `frontend/` to confirm Vite compiles cleanly.
3. Verify backend tests pass with `pytest`.
4. Submit a PR. The **GitHub Actions CI Pipeline** will automatically lint code, run backend tests, and test the frontend build.
5. If the PR checks pass and review looks good, it can be merged after final approval.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">
Built with ❤️ for exam aspirants everywhere
</div>

