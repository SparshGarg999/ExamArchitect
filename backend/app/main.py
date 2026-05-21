import os
import json
import random
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from .database import get_db, engine, Base
from .models import ExamCategory, Exam, Topic, Paper, Question, TopicYearStat, Prediction
from .init_db import seed_database

app = FastAPI(
    title="ExamArchitect API",
    description="Backend API for exam analytics, prediction, and study plans.",
    version="1.0.0"
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, specify the exact frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    # Make sure DB schema is created and seeded on start
    seed_database()

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "ExamArchitect API"}

def make_search_pattern(search_query: str) -> str:
    if not search_query:
        return "%"
    # Normalize query first
    query = search_query.replace('\u2019', "'").replace('\u2018', "'").replace('\ufffd', "'")
    query = query.replace('\u201d', '"').replace('\u201c', '"')
    # Replace quotes/apostrophes with % wildcard
    for char in ["'", '"', '’', '‘', '”', '“']:
        query = query.replace(char, "%")
    return f"%{query}%"

# --- Category & Exam Endpoints ---

@app.get("/api/categories", response_model=List[Dict[str, Any]])
def get_categories(db: Session = Depends(get_db)):
    categories = db.query(ExamCategory).all()
    result = []
    for cat in categories:
        result.append({
            "id": cat.id,
            "name": cat.name,
            "icon": cat.icon,
            "description": cat.description,
            "color": cat.color,
            "exam_count": len(cat.exams)
        })
    return result

@app.get("/api/exams/{exam_id}", response_model=Dict[str, Any])
def get_exam(exam_id: int, db: Session = Depends(get_db)):
    exam = db.query(Exam).filter_by(id=exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    topics = db.query(Topic).filter_by(exam_id=exam.id, parent_topic_id=None).all()
    topic_data = []
    for topic in topics:
        subtopics = db.query(Topic).filter_by(parent_topic_id=topic.id).all()
        topic_data.append({
            "id": topic.id,
            "name": topic.name,
            "subtopics": [{"id": st.id, "name": st.name} for st in subtopics]
        })

    return {
        "id": exam.id,
        "category_id": exam.category_id,
        "name": exam.name,
        "full_name": exam.full_name,
        "topics": topic_data
    }

@app.get("/api/exams", response_model=List[Dict[str, Any]])
def get_exams(category_id: int = None, db: Session = Depends(get_db)):
    query = db.query(Exam)
    if category_id:
        query = query.filter_by(category_id=category_id)
    exams = query.all()
    result = []
    for exam in exams:
        result.append({
            "id": exam.id,
            "category_id": exam.category_id,
            "name": exam.name,
            "full_name": exam.full_name,
            "conducting_body": exam.conducting_body,
            "frequency": exam.frequency,
            "paper_count": len(exam.papers)
        })
    return result

# --- Topic Taxonomy Endpoints ---

@app.get("/api/exams/{exam_id}/topics", response_model=List[Dict[str, Any]])
def get_exam_topics(exam_id: int, db: Session = Depends(get_db)):
    topics = db.query(Topic).filter_by(exam_id=exam_id, parent_topic_id=None).all()
    result = []
    for topic in topics:
        subtopics = db.query(Topic).filter_by(parent_topic_id=topic.id).all()
        result.append({
            "id": topic.id,
            "name": topic.name,
            "syllabus_weight_pct": topic.syllabus_weight_pct,
            "subtopics": [
                {
                    "id": sub.id,
                    "name": sub.name,
                    "syllabus_weight_pct": sub.syllabus_weight_pct
                } for sub in subtopics
            ]
        })
    return result

# --- Analytics Endpoints (Heatmap) ---

@app.get("/api/exams/{exam_id}/heatmap", response_model=Dict[str, Any])
def get_heatmap_stats(exam_id: int, db: Session = Depends(get_db)):
    # 1. Fetch all subjects/topics
    topics = db.query(Topic).filter_by(exam_id=exam_id).all()
    topic_map = {t.id: t for t in topics}
    
    # 2. Fetch all stats
    stats = db.query(TopicYearStat).filter_by(exam_id=exam_id).all()
    
    # 3. Compile a pivot table structured for the frontend
    heatmap_data = {}
    years_present = set()
    
    # Initialize all topics to ensure parent topics are present in the response
    for topic in topics:
        heatmap_data[topic.id] = {
            "id": topic.id,
            "name": topic.name,
            "parent_id": topic.parent_topic_id,
            "years": {}
        }
    
    for stat in stats:
        years_present.add(stat.year)
        t_id = stat.topic_id
        if t_id in heatmap_data:
            heatmap_data[t_id]["years"][stat.year] = {
                "question_count": stat.question_count,
                "total_marks": stat.total_marks,
                "pct_of_paper": stat.pct_of_paper,
                "avg_difficulty": stat.avg_difficulty_trend
            }
        
    return {
        "years": sorted(list(years_present)),
        "data": list(heatmap_data.values())
    }

# --- Topic Drilldown Heatmap ---

@app.get("/api/exams/{exam_id}/topics/{topic_id}/heatmap", response_model=Dict[str, Any])
def get_topic_drilldown_heatmap(exam_id: int, topic_id: int, db: Session = Depends(get_db)):
    """Returns subtopic-level heatmap data for a given parent subject."""
    parent_topic = db.query(Topic).filter_by(id=topic_id, exam_id=exam_id).first()
    if not parent_topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    subtopics = db.query(Topic).filter_by(parent_topic_id=topic_id).all()
    if not subtopics:
        # If no subtopics, treat the parent itself as the only entry
        subtopics = [parent_topic]
    
    # Collect all years present in the exam
    stat_years = db.query(TopicYearStat.year).filter_by(exam_id=exam_id).distinct().all()
    years = sorted([r[0] for r in stat_years])
    
    subtopic_data = []
    for sub in subtopics:
        stats = db.query(TopicYearStat).filter_by(topic_id=sub.id).all()
        years_dict = {}
        for s in stats:
            years_dict[str(s.year)] = {
                "question_count": s.question_count,
                "total_marks": s.total_marks,
                "pct_of_paper": s.pct_of_paper,
                "avg_difficulty": s.avg_difficulty_trend
            }
        subtopic_data.append({
            "id": sub.id,
            "name": sub.name,
            "years": years_dict
        })
    
    return {
        "parent_topic": parent_topic.name,
        "parent_topic_id": parent_topic.id,
        "years": years,
        "subtopics": subtopic_data
    }

# --- Prediction & Reasoning Endpoints ---

@app.get("/api/exams/{exam_id}/predictions", response_model=List[Dict[str, Any]])
def get_predictions(exam_id: int, db: Session = Depends(get_db)):
    predictions = db.query(Prediction).filter_by(exam_id=exam_id).order_by(Prediction.predicted_probability.desc()).all()
    result = []
    for pred in predictions:
        result.append({
            "id": pred.id,
            "topic_id": pred.topic_id,
            "topic_name": pred.topic.name,
            "parent_topic_name": pred.topic.parent_topic.name if pred.topic.parent_topic else None,
            "predicted_probability": pred.predicted_probability,
            "confidence_low": pred.confidence_interval_low,
            "confidence_high": pred.confidence_interval_high,
            "reasoning": pred.reasoning,
            "generated_at": pred.generated_at
        })
    return result

# --- Paper & Question browser ---

@app.get("/api/exams/{exam_id}/papers", response_model=List[Dict[str, Any]])
def get_papers(exam_id: int, db: Session = Depends(get_db)):
    papers = db.query(Paper).filter_by(exam_id=exam_id).order_by(Paper.year.desc()).all()
    result = []
    for paper in papers:
        result.append({
            "id": paper.id,
            "year": paper.year,
            "session": paper.session,
            "total_marks": paper.total_marks,
            "total_questions": paper.total_questions,
            "is_processed": paper.is_processed
        })
    return result

@app.get("/api/papers/{paper_id}/questions", response_model=List[Dict[str, Any]])
def get_paper_questions(paper_id: int, topic_id: int = None, subject_id: int = None, search: str = None, db: Session = Depends(get_db)):
    query = db.query(Question).filter_by(paper_id=paper_id)
    if topic_id:
        query = query.filter((Question.topic_id == topic_id) | (Question.secondary_topic_id == topic_id))
    if subject_id:
        # Filter by parent subject: find all child topic IDs under this subject
        child_topic_ids = [t.id for t in db.query(Topic).filter_by(parent_topic_id=subject_id).all()]
        child_topic_ids.append(subject_id)  # include the parent itself
        query = query.filter(Question.topic_id.in_(child_topic_ids))
    if search:
        query = query.filter(Question.question_text.ilike(make_search_pattern(search)))
    questions = query.order_by(Question.question_number).all()
    result = []
    for q in questions:
        # Resolve parent subject name
        parent_subject_name = None
        if q.topic:
            if q.topic.parent_topic:
                parent_subject_name = q.topic.parent_topic.name
            else:
                parent_subject_name = q.topic.name
        result.append({
            "id": q.id,
            "question_number": q.question_number,
            "question_text": q.question_text,
            "question_style": q.question_style,
            "difficulty": q.difficulty,
            "marks": q.marks,
            "correct_answer": q.correct_answer,
            "has_diagram": q.has_diagram,
            "diagram_path": q.diagram_path,
            "topic_name": q.topic.name if q.topic else None,
            "parent_subject_name": parent_subject_name
        })
    return result

@app.get("/api/questions", response_model=List[Dict[str, Any]])
def get_global_questions(topic_id: int = None, subject_id: int = None, exam_id: int = None, search: str = None, limit: int = 50, offset: int = 0, db: Session = Depends(get_db)):
    query = db.query(Question)
    if exam_id:
        query = query.join(Paper).filter(Paper.exam_id == exam_id)
    else:
        query = query.join(Paper)

    if topic_id:
        query = query.filter((Question.topic_id == topic_id) | (Question.secondary_topic_id == topic_id))
    if subject_id:
        child_topic_ids = [t.id for t in db.query(Topic).filter_by(parent_topic_id=subject_id).all()]
        child_topic_ids.append(subject_id)
        query = query.filter(Question.topic_id.in_(child_topic_ids))
    if search:
        query = query.filter(Question.question_text.ilike(make_search_pattern(search)))
    
    # Order by paper year desc, then question number
    query = query.order_by(Paper.year.desc(), Question.question_number)
    
    # Pagination
    query = query.offset(offset).limit(limit)

    questions = query.all()
    result = []
    for q in questions:
        parent_subject_name = None
        if q.topic:
            if q.topic.parent_topic:
                parent_subject_name = q.topic.parent_topic.name
            else:
                parent_subject_name = q.topic.name
        result.append({
            "id": q.id,
            "paper_id": q.paper_id,
            "paper_year": q.paper.year if q.paper else None,
            "paper_name": f"{q.paper.year} {q.paper.session}" if q.paper else None,
            "question_number": q.question_number,
            "question_text": q.question_text,
            "question_style": q.question_style,
            "difficulty": q.difficulty,
            "marks": q.marks,
            "correct_answer": q.correct_answer,
            "has_diagram": q.has_diagram,
            "diagram_path": q.diagram_path,
            "topic_name": q.topic.name if q.topic else None,
            "parent_subject_name": parent_subject_name
        })
    return result


# --- Phase 2 Ingestion & Staging Endpoints ---

from pydantic import BaseModel
from pathlib import Path
from .pdf_parser import PDFParser, IngestSimulator
from .ai_tagger import AITagger
from .ingestion import ingest_question, recompute_topic_stats

STAGED_DIR = Path(os.path.dirname(os.path.dirname(__file__))) / "data" / "staged"
STAGED_DIR.mkdir(parents=True, exist_ok=True)

class PaperCreate(BaseModel):
    exam_id: int
    year: int
    session: str
    total_marks: float = 100.0
    total_questions: int = 65

class QuestionApproval(BaseModel):
    question_number: int
    question_text: str
    marks: float
    question_style: str
    difficulty: str
    correct_answer: str = None
    suggested_subject: str = None
    suggested_chapter: str = None
    image_path: str = None

class ApprovalList(BaseModel):
    questions: List[QuestionApproval]

@app.post("/api/papers", response_model=Dict[str, Any])
def create_paper(paper_data: PaperCreate, db: Session = Depends(get_db)):
    # Check if paper already exists
    existing = db.query(Paper).filter_by(
        exam_id=paper_data.exam_id,
        year=paper_data.year,
        session=paper_data.session
    ).first()
    if existing:
        return {"status": "exists", "paper_id": existing.id}

    paper = Paper(
        exam_id=paper_data.exam_id,
        year=paper_data.year,
        session=paper_data.session,
        total_marks=paper_data.total_marks,
        total_questions=paper_data.total_questions,
        is_processed=False
    )
    db.add(paper)
    db.commit()
    db.refresh(paper)
    return {"status": "created", "paper_id": paper.id}

@app.post("/api/papers/{paper_id}/parse", response_model=Dict[str, Any])
def parse_and_stage_paper(paper_id: int, db: Session = Depends(get_db)):
    paper = db.query(Paper).filter_by(id=paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    # If PDF file path exists on paper object, try to parse it, else run simulator
    parser = PDFParser()
    tagger = AITagger()

    if paper.pdf_path and os.path.exists(paper.pdf_path):
        slices = parser.parse_pdf(paper.pdf_path, paper.id)
    else:
        # Generate simulator mock slices
        slices = IngestSimulator.generate_mock_questions(paper.id, count=5)

    staged_questions = []
    for slice_info in slices:
        # Call AI tagger to analyze visual crop or simulated fallback
        tagged_metadata = tagger.tag_question_image(slice_info["image_path"])
        tagged_metadata["image_path"] = slice_info["image_path"]
        staged_questions.append(tagged_metadata)

    # Save to staging JSON
    staged_file = STAGED_DIR / f"{paper.id}.json"
    with open(staged_file, "w") as f:
        json.dump(staged_questions, f, indent=2)

    return {"status": "staged", "question_count": len(staged_questions)}

@app.get("/api/papers/{paper_id}/staged", response_model=List[Dict[str, Any]])
def get_staged_questions(paper_id: int):
    staged_file = STAGED_DIR / f"{paper_id}.json"
    if not staged_file.exists():
        # Return empty list or generate on-the-fly simulator questions for convenience
        return []
    with open(staged_file, "r") as f:
        return json.load(f)

@app.post("/api/papers/{paper_id}/staged/approve", response_model=Dict[str, Any])
def approve_staged_questions(paper_id: int, approval_data: ApprovalList, db: Session = Depends(get_db)):
    paper = db.query(Paper).filter_by(id=paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    # Ingest each approved question into SQLite
    for q_data in approval_data.questions:
        ingest_question(
            db=db,
            paper_id=paper_id,
            parsed_data=q_data.dict(),
            image_path=q_data.image_path
        )

    # Recalculate heatmap stats
    recompute_topic_stats(db, paper.exam_id, paper.year)

    # Mark paper as processed
    paper.is_processed = True
    db.commit()

    return {"status": "approved", "ingested_count": len(approval_data.questions)}

@app.post("/api/ingest/bulk", response_model=Dict[str, Any])
def bulk_ingest_historical_data(db: Session = Depends(get_db)):
    """
    Triggers the real parser and ingest pipeline script (parse_and_ingest_all.py) in a subprocess,
    which clears the database and performs actual PDF parsing and extraction.
    """
    import subprocess
    import sys
    
    current_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.dirname(current_dir)
    script_path = os.path.join(backend_dir, "parse_and_ingest_all.py")
    
    try:
        # Run parse_and_ingest_all.py with a 120-second timeout
        result = subprocess.run(
            [sys.executable, script_path],
            capture_output=True, text=True, encoding="utf-8", timeout=120,
            creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
        )
        if result.returncode != 0:
            raise HTTPException(
                status_code=500,
                detail=f"Ingestion script failed with exit code {result.returncode}. Error: {result.stderr}"
            )
        
        # Clear session cache to see updates from subprocess
        db.expire_all()
        q_count = db.query(Question).count()
        p_count = db.query(Paper).count()
        
        return {
            "status": "success",
            "message": "Bulk ingestion complete.",
            "questions_ingested": q_count,
            "papers_added_or_verified": p_count,
            "stdout": result.stdout[:2000],
            "stderr": result.stderr[:2000]
        }
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=500, detail="Ingestion script timed out.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to run ingestion script: {str(e)}")

# --- Phase 3 & 4 Analytics & Study Plan Endpoints ---

from .analytics import AnalyticsEngine

class StudyPlanRequest(BaseModel):
    total_days: int = 30
    weakness_topics: List[str] = None

@app.post("/api/exams/{exam_id}/predictions/generate", response_model=Dict[str, Any])
def generate_exam_predictions(exam_id: int, db: Session = Depends(get_db)):
    engine = AnalyticsEngine(db)
    try:
        preds = engine.generate_predictions(exam_id)
        return {"status": "success", "predictions_count": len(preds)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/exams/{exam_id}/study-plan", response_model=List[Dict[str, Any]])
def get_custom_study_plan(exam_id: int, request_data: StudyPlanRequest, db: Session = Depends(get_db)):
    engine = AnalyticsEngine(db)
    try:
        plan = engine.generate_dynamic_study_plan(
            exam_id=exam_id,
            total_days=request_data.total_days,
            weakness_topics=request_data.weakness_topics
        )
        return plan
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/exams/{exam_id}/study-plan", response_model=List[Dict[str, Any]])
def get_default_study_plan(exam_id: int, total_days: int = 30, db: Session = Depends(get_db)):
    engine = AnalyticsEngine(db)
    try:
        plan = engine.generate_dynamic_study_plan(
            exam_id=exam_id,
            total_days=total_days
        )
        return plan
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


