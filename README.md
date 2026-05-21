<![CDATA[<div align="center">

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
git clone https://github.com/<your-username>/ExamArchitect.git
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

### 2. Frontend Setup

```bash
# From the project root
cd frontend

# Install Node.js dependencies
npm install
```

### 3. Seed the Database

```bash
# Start the backend server (this auto-creates the DB schema and seeds topics)
cd backend
python run.py
# Server starts at http://localhost:8000

# In a separate terminal, start the frontend dev server
cd frontend
npm run dev
# Frontend starts at http://localhost:5173
```

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

## 🗺 Roadmap

### ✅ Completed (Phase 1)
- [x] Full-stack scaffolding (React + FastAPI + SQLite)
- [x] Database schema with 8 tables and relationships
- [x] PDF ingestion pipeline with text normalization
- [x] Interactive heatmap with subject → subtopic accordion
- [x] Question browser with search, filters, and answer spoilers
- [x] Admin panel wired to real API endpoints
- [x] Toast notification system
- [x] PWA manifest and service worker

### 🔧 In Progress (Phase 2)
- [ ] Heatmap aesthetic improvements (critical-red gradients, axis labels)
- [ ] MCQ options rendering in question cards
- [ ] Curated weakness chip selectors for study plan
- [ ] Study plan flexible day duration fix

### 🔮 Future (Phase 3+)
- [ ] User accounts & saved study plans
- [ ] Holdout validation backtesting visualizer
- [ ] Difficulty trajectory charts (is a topic getting harder?)
- [ ] Question style DNA (MCQ vs NAT ratio trends)
- [ ] Topic pairing correlation maps
- [ ] Cross-exam intelligence (GATE vs JEE comparison)
- [ ] Confidence calibrator (model accuracy transparency)
- [ ] Full mock exam simulator
- [ ] More exams: NEET, UPSC, JEE, Banking

---

## 🤝 Contributing

### Branch Naming
```
feature/  — new features        (e.g., feature/topic-pairing-map)
fix/      — bug fixes           (e.g., fix/unicode-search)
refactor/ — code restructuring  (e.g., refactor/split-app-jsx)
docs/     — documentation only  (e.g., docs/api-reference)
```

### Pull Request Process
1. Fork the repository
2. Create a feature branch from `main`
3. Make your changes with descriptive commits
4. Run `npm run build` in `frontend/` to verify no compilation errors
5. Run the backend server and verify your changes work
6. Submit a PR with a clear description of what changed and why

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">
<sub>Built with ❤️ for exam aspirants everywhere</sub>
</div>
]]>
