from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

# Normalize postgresql URL if needed for SQLAlchemy with psycopg2
db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+psycopg2://", 1)
elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+psycopg2://"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

engine = create_engine(
    db_url,
    pool_pre_ping=True,
    echo=(settings.ENVIRONMENT == "development_debug"),
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
