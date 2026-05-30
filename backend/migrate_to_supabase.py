import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, make_transient
from dotenv import load_dotenv

# Ensure we can import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import Base
from app.models import (
    User, ExamCategory, Exam, Topic, Paper, Question,
    SyllabusVersion, SyllabusVersionTopic, TopicYearStat,
    Prediction, UserGeneratedExam, ActivityLog, QuestionFeedback
)

def run_migration():
    load_dotenv()
    
    # Connection URL strings
    sqlite_url = "sqlite:///./exam_architect.db"
    postgres_url = os.getenv("DATABASE_URL")
    
    if not postgres_url:
        print("[ERROR] DATABASE_URL environment variable is not defined in backend/.env!")
        sys.exit(1)
        
    if postgres_url.startswith("postgres://"):
        postgres_url = postgres_url.replace("postgres://", "postgresql://", 1)
        
    if postgres_url.startswith("sqlite"):
        print("[WARNING] DATABASE_URL is set to a SQLite database. Migration requires a PostgreSQL target.")
        sys.exit(1)
        
    print("[INFO] Initializing databases...")
    
    # Engines & Sessions
    sqlite_engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})
    postgres_engine = create_engine(postgres_url, pool_pre_ping=True)
    
    SqliteSession = sessionmaker(bind=sqlite_engine)
    PostgresSession = sessionmaker(bind=postgres_engine)
    
    sqlite_db = SqliteSession()
    postgres_db = PostgresSession()
    
    try:
        print("[INFO] Recreating schemas on target database...")
        # Create all tables on PostgreSQL if they don't exist
        Base.metadata.create_all(bind=postgres_engine)
        
        # Ingestion list ordered strictly by dependency hierarchy
        migration_sequence = [
            (User, "Users"),
            (ExamCategory, "Exam Categories"),
            (Exam, "Exams"),
            # Note: Topics will be migrated in parent/child batches below
            (Paper, "Papers"),
            (Question, "Questions"),
            (SyllabusVersion, "Syllabus Versions"),
            (SyllabusVersionTopic, "Syllabus Version Topics"),
            (TopicYearStat, "Topic Year Stats"),
            (Prediction, "AI Predictions"),
            (UserGeneratedExam, "User Generated Exams"),
            (ActivityLog, "Activity Logs"),
            (QuestionFeedback, "Question Feedbacks")
        ]
        
        # Clean existing PostgreSQL target tables before copy to prevent duplicates
        print("[INFO] Clearing target database tables...")
        for model, name in reversed(migration_sequence):
            postgres_db.query(model).delete()
        # Clear topics
        postgres_db.query(Topic).delete()
        postgres_db.commit()
        
        # 1. Copy Users & Category
        for model, name in migration_sequence[:3]:
            rows = sqlite_db.query(model).all()
            print(f"[INFO] Migrating {name} ({len(rows)} rows)...")
            for row in rows:
                sqlite_db.expunge(row)
                make_transient(row)
                postgres_db.add(row)
            postgres_db.commit()
            
        # 2. Copy Topics (Hierarchical: parents first, then children to satisfy FK constraint)
        print("[INFO] Migrating Topics...")
        # Parents (parent_topic_id IS NULL)
        parents = sqlite_db.query(Topic).filter(Topic.parent_topic_id.is_(None)).all()
        print(f"   -> Copying parent subjects ({len(parents)} rows)...")
        for row in parents:
            sqlite_db.expunge(row)
            make_transient(row)
            postgres_db.add(row)
        postgres_db.commit()
        
        # Children (parent_topic_id IS NOT NULL)
        children = sqlite_db.query(Topic).filter(Topic.parent_topic_id.isnot(None)).all()
        print(f"   -> Copying child subtopics ({len(children)} rows)...")
        for row in children:
            sqlite_db.expunge(row)
            make_transient(row)
            postgres_db.add(row)
        postgres_db.commit()
        
        # 3. Copy remaining relational dependency tables
        for model, name in migration_sequence[3:]:
            rows = sqlite_db.query(model).all()
            print(f"[INFO] Migrating {name} ({len(rows)} rows)...")
            # Batch inserts for heavy tables (e.g. Questions)
            for i, row in enumerate(rows):
                sqlite_db.expunge(row)
                make_transient(row)
                postgres_db.add(row)
                if (i + 1) % 500 == 0:
                    postgres_db.commit()
            postgres_db.commit()
            
        print("[SUCCESS] Data copy successfully completed!")
        
        # 4. Synchronize auto-incrementing primary key ID sequences in PostgreSQL
        print("[INFO] Synchronizing auto-incrementing ID sequences...")
        tables_to_sync = [
            "users", "exam_categories", "exams", "topics", "papers", "questions",
            "syllabus_versions", "syllabus_version_topics", "topic_year_stats",
            "predictions", "user_generated_exams", "activity_logs", "question_feedbacks"
        ]
        
        for table in tables_to_sync:
            # PostgreSQL command to set the table serial sequence to the current MAX(id)
            sync_sql = f"SELECT setval(pg_get_serial_sequence('{table}', 'id'), coalesce(max(id), 1)) FROM {table};"
            postgres_db.execute(text(sync_sql))
            
        postgres_db.commit()
        print("[SUCCESS] Auto-increment sequences successfully synchronized!")
        print("\n[SUCCESS] Database migration to Supabase completed flawlessly!")
        
    except Exception as e:
        postgres_db.rollback()
        print(f"[ERROR] Error during migration: {e}")
        sys.exit(1)
    finally:
        sqlite_db.close()
        postgres_db.close()

if __name__ == "__main__":
    run_migration()
