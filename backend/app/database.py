import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import NullPool
from dotenv import load_dotenv

load_dotenv()

# Centralized config picking SQLite by default, overridden by env var
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./exam_architect.db")

# SQLAlchemy 1.4+ deprecated "postgres://" in favor of "postgresql://"
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

is_sqlite = SQLALCHEMY_DATABASE_URL.startswith("sqlite")
is_pooler = "pooler.supabase.com" in SQLALCHEMY_DATABASE_URL or ":6543" in SQLALCHEMY_DATABASE_URL

if is_sqlite:
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, 
        connect_args={"check_same_thread": False}
    )
elif is_pooler:
    # Disable prepared statements for PgBouncer / Supabase Pooler Transaction Mode
    if "prepare_threshold" not in SQLALCHEMY_DATABASE_URL:
        separator = "&" if "?" in SQLALCHEMY_DATABASE_URL else "?"
        SQLALCHEMY_DATABASE_URL += f"{separator}prepare_threshold=0"
    
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        poolclass=NullPool
    )
else:
    # PostgreSQL optimizations (Supabase/Render direct connection)
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        pool_pre_ping=True,  # Check health of connections before returning
        pool_size=10,        # Minimum pool size
        max_overflow=20      # Maximum overflow connections
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency to get db session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
