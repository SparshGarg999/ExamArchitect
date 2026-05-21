from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
from . import models
from .database import SessionLocal

def get_topic_by_name(db: Session, topic_name: str, exam_id: int) -> Optional[models.Topic]:
    """Finds a topic by its exact name or close match for a given exam."""
    return db.query(models.Topic).filter(
        models.Topic.name.ilike(f"%{topic_name}%"),
        models.Topic.exam_id == exam_id
    ).first()

def clean_question_text(text: str) -> str:
    if not text:
        return ""
    # Standardize curly quotes and apostrophes to standard straight ones
    text = text.replace('\u2019', "'").replace('\u2018', "'").replace('\ufffd', "'")
    text = text.replace('\u201d', '"').replace('\u201c', '"')
    # Standardize dashes/minus signs
    text = text.replace('\u2013', '-').replace('\u2014', '-').replace('\u2212', '-')
    # Clean up non-breaking spaces or double spaces
    text = text.replace('\u00a0', ' ').replace('\u200b', '')
    return text

def ingest_question(db: Session, paper_id: int, parsed_data: Dict[str, Any], image_path: str = None) -> models.Question:
    """
    Ingests a single parsed question into the database.
    """
    paper = db.query(models.Paper).filter(models.Paper.id == paper_id).first()
    if not paper:
        raise ValueError(f"Paper with ID {paper_id} not found.")

    # Try to find the suggested chapter in topics
    topic_id = None
    if parsed_data.get("suggested_chapter"):
        topic = get_topic_by_name(db, parsed_data["suggested_chapter"], paper.exam_id)
        if topic:
            topic_id = topic.id
    
    # If chapter not found, fallback to subject
    if not topic_id and parsed_data.get("suggested_subject"):
        topic = get_topic_by_name(db, parsed_data["suggested_subject"], paper.exam_id)
        if topic:
            topic_id = topic.id

    q_text = clean_question_text(parsed_data.get("question_text", ""))

    question = models.Question(
        paper_id=paper_id,
        topic_id=topic_id,
        question_number=parsed_data.get("question_number", 0),
        question_text=q_text,
        question_style=parsed_data.get("question_style", "MCQ"),
        difficulty=parsed_data.get("difficulty", "M"),
        marks=float(parsed_data.get("marks", 1.0)),
        correct_answer=parsed_data.get("correct_answer"),
        has_diagram=parsed_data.get("has_diagram", False) or bool(image_path),
        diagram_path=image_path
    )
    
    db.add(question)
    db.commit()
    db.refresh(question)
    
    return question

def recompute_topic_stats(db: Session, exam_id: int, year: int):
    """
    Recomputes TopicYearStat for all topics in an exam for a specific year.
    """
    paper = db.query(models.Paper).filter(models.Paper.exam_id == exam_id, models.Paper.year == year).first()
    if not paper:
        return
        
    topics = db.query(models.Topic).filter(models.Topic.exam_id == exam_id).all()
    
    for topic in topics:
        # Get all questions for this topic in this paper
        questions = db.query(models.Question).filter(
            models.Question.paper_id == paper.id,
            models.Question.topic_id == topic.id
        ).all()
        
        if not questions:
            continue
            
        q_count = len(questions)
        total_marks = sum(q.marks for q in questions)
        
        # Calculate avg difficulty (E=1, M=2, H=3)
        diff_map = {"E": 1, "M": 2, "H": 3}
        avg_diff = sum(diff_map.get(q.difficulty, 2) for q in questions) / q_count
        
        # Count styles
        style_counts = {}
        for q in questions:
            style_counts[q.question_style] = style_counts.get(q.question_style, 0) + 1
            
        # Update or create stat
        stat = db.query(models.TopicYearStat).filter(
            models.TopicYearStat.topic_id == topic.id,
            models.TopicYearStat.year == year
        ).first()
        
        if not stat:
            stat = models.TopicYearStat(
                exam_id=exam_id,
                topic_id=topic.id,
                year=year
            )
            db.add(stat)
            
        stat.question_count = q_count
        stat.total_marks = total_marks
        stat.avg_difficulty_trend = avg_diff
        stat.question_style_breakdown = style_counts
        
        if paper.total_marks and paper.total_marks > 0:
            stat.pct_of_paper = (total_marks / paper.total_marks) * 100
            
    db.commit()

if __name__ == "__main__":
    db = SessionLocal()
    # Test DB interaction logic (ensure valid paper exists first)
    db.close()
