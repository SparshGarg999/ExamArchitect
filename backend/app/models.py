from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, Text, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class ExamCategory(Base):
    __tablename__ = "exam_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    icon = Column(String, nullable=True) # Lucide icon name or emoji
    description = Column(Text, nullable=True)
    color = Column(String, nullable=True) # Tailwind color name or hex code

    exams = relationship("Exam", back_populates="category", cascade="all, delete-orphan")


class Exam(Base):
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("exam_categories.id"), nullable=False)
    name = Column(String, unique=True, index=True, nullable=False) # e.g., "GATE-CS"
    full_name = Column(String, nullable=False) # e.g., "Graduate Aptitude Test in Engineering - Computer Science"
    conducting_body = Column(String, nullable=True) # e.g., "IISc / IITs"
    frequency = Column(String, nullable=True) # e.g., "Annual"

    category = relationship("ExamCategory", back_populates="exams")
    topics = relationship("Topic", back_populates="exam", cascade="all, delete-orphan")
    papers = relationship("Paper", back_populates="exam", cascade="all, delete-orphan")
    syllabus_versions = relationship("SyllabusVersion", back_populates="exam", cascade="all, delete-orphan")
    topic_year_stats = relationship("TopicYearStat", back_populates="exam", cascade="all, delete-orphan")
    predictions = relationship("Prediction", back_populates="exam", cascade="all, delete-orphan")


class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False)
    name = Column(String, index=True, nullable=False) # e.g., "Theory of Computation"
    parent_topic_id = Column(Integer, ForeignKey("topics.id"), nullable=True) # For subtopics
    syllabus_weight_pct = Column(Float, default=0.0)

    exam = relationship("Exam", back_populates="topics")
    parent_topic = relationship("Topic", remote_side=[id], backref="subtopics")
    
    # Primary questions in this topic
    questions = relationship("Question", foreign_keys="[Question.topic_id]", back_populates="topic")
    # Questions where this is secondary topic
    secondary_questions = relationship("Question", foreign_keys="[Question.secondary_topic_id]", back_populates="secondary_topic")
    
    year_stats = relationship("TopicYearStat", back_populates="topic", cascade="all, delete-orphan")
    predictions = relationship("Prediction", back_populates="topic", cascade="all, delete-orphan")


class Paper(Base):
    __tablename__ = "papers"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False)
    year = Column(Integer, index=True, nullable=False)
    session = Column(String, default="1") # e.g., "1", "2", "Forenoon", "Afternoon"
    total_marks = Column(Float, default=100.0)
    total_questions = Column(Integer, default=65)
    pdf_path = Column(String, nullable=True)
    is_processed = Column(Boolean, default=False)

    exam = relationship("Exam", back_populates="papers")
    questions = relationship("Question", back_populates="paper", cascade="all, delete-orphan")


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    paper_id = Column(Integer, ForeignKey("papers.id"), nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=True)
    secondary_topic_id = Column(Integer, ForeignKey("topics.id"), nullable=True)
    question_number = Column(Integer, nullable=False)
    question_text = Column(Text, nullable=False)
    question_style = Column(String, nullable=False) # MCQ, NAT (Numerical Answer Type), MSQ (Multiple Select)
    difficulty = Column(String, nullable=False) # E (Easy), M (Medium), H (Hard)
    marks = Column(Float, nullable=False) # e.g., 1.0 or 2.0
    correct_answer = Column(String, nullable=True)
    has_diagram = Column(Boolean, default=False)
    diagram_path = Column(String, nullable=True) # if we save visual slices

    paper = relationship("Paper", back_populates="questions")
    topic = relationship("Topic", foreign_keys=[topic_id], back_populates="questions")
    secondary_topic = relationship("Topic", foreign_keys=[secondary_topic_id], back_populates="secondary_questions")


class SyllabusVersion(Base):
    __tablename__ = "syllabus_versions"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False)
    version_name = Column(String, nullable=False) # e.g., "2021 Revision"
    from_year = Column(Integer, nullable=False)
    to_year = Column(Integer, nullable=True) # Null if current active version

    exam = relationship("Exam", back_populates="syllabus_versions")
    version_topics = relationship("SyllabusVersionTopic", back_populates="version", cascade="all, delete-orphan")


class SyllabusVersionTopic(Base):
    __tablename__ = "syllabus_version_topics"

    id = Column(Integer, primary_key=True, index=True)
    version_id = Column(Integer, ForeignKey("syllabus_versions.id"), nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=False)
    is_active = Column(Boolean, default=True)

    version = relationship("SyllabusVersion", back_populates="version_topics")
    topic = relationship("Topic")


class TopicYearStat(Base):
    __tablename__ = "topic_year_stats"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=False)
    year = Column(Integer, index=True, nullable=False)
    question_count = Column(Integer, default=0)
    total_marks = Column(Float, default=0.0)
    avg_difficulty_trend = Column(Float, default=0.0) # Numeric score representation of difficulty
    question_style_breakdown = Column(JSON, nullable=True) # Dict of style counts: {"MCQ": 5, "NAT": 2}
    pct_of_paper = Column(Float, default=0.0)

    exam = relationship("Exam", back_populates="topic_year_stats")
    topic = relationship("Topic", back_populates="year_stats")


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=False)
    target_year = Column(Integer, index=True, nullable=False)
    predicted_probability = Column(Float, nullable=False) # e.g., 0.85
    confidence_interval_low = Column(Float, nullable=False)
    confidence_interval_high = Column(Float, nullable=False)
    backtest_accuracy_pct = Column(Float, nullable=True)
    reasoning = Column(Text, nullable=True) # AI-generated markdown narrative
    generated_at = Column(DateTime(timezone=True), server_default=func.now())

    exam = relationship("Exam", back_populates="predictions")
    topic = relationship("Topic", back_populates="predictions")
