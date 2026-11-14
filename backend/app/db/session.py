
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings


class Base(DeclarativeBase):
    pass


DATABASE_URL = settings.DATABASE_URL

engine_options = {
    "pool_pre_ping": True,
    "pool_recycle": 1800,
}

# Configure connection pooling only for PostgreSQL.
if DATABASE_URL.startswith(("postgresql://", "postgresql+psycopg://")):
    engine_options.update({
        "pool_size": 5,
        "max_overflow": 5,
    })

# SQLite requires different connection settings.
elif DATABASE_URL.startswith("sqlite"):
    engine_options.update({
        "connect_args": {
            "check_same_thread": False,
        }
    })


engine = create_engine(
    DATABASE_URL,
    **engine_options,
)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    expire_on_commit=False,
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
