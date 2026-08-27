from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import get_settings

settings = get_settings()

# pool_pre_ping avoids "stale connection" errors after periods of
# inactivity, which matters since Supabase's pooler can recycle
# idle connections.
engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Every ORM model created in Phase 6 will inherit from this Base.
Base = declarative_base()


def get_db():
    """FastAPI dependency: yields a DB session and always closes it,
    even if the request raises an exception."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()