from sqlalchemy import create_engine, text
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
    # Connection pool tuning for production throughput.
    # IMPORTANT: With 2 replicas × 4 workers, total DB connections =
    #   replicas × workers × (pool_size + max_overflow) = 2 × 4 × 10 = 80
    # This stays within PostgreSQL default max_connections=100.
    # For higher concurrency, deploy PgBouncer in transaction mode.
    pool_size=5,
    max_overflow=5,
    pool_timeout=30,
    pool_recycle=1800,
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


def check_db_health() -> bool:
    """Run a lightweight SELECT 1 to verify the database is reachable."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False
