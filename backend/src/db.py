import os
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base

# Load environment file if present (backend/.environment) so local dev values are used
try:
    from dotenv import load_dotenv

    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".environment")
    if os.path.exists(env_path):
        load_dotenv(env_path)
except Exception:
    pass

# Build DATABASE_URL from Postgres env vars if provided
PG_USER = os.getenv("POSTGRES_USER", os.getenv("DB_USER", "nextdev"))
PG_PASSWORD = os.getenv("POSTGRES_PASSWORD", os.getenv("DB_PASSWORD", "nextdev"))
PG_DB = os.getenv("POSTGRES_DB", os.getenv("DB_NAME", "nextdev"))
PG_HOST = os.getenv("POSTGRES_HOST", os.getenv("DB_HOST", "localhost"))
PG_PORT = os.getenv("POSTGRES_PORT", os.getenv("DB_PORT", "5432"))

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    DATABASE_URL = f"postgresql+asyncpg://{PG_USER}:{PG_PASSWORD}@{PG_HOST}:{PG_PORT}/{PG_DB}"

engine = create_async_engine(DATABASE_URL, future=True)
async_session = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

Base = declarative_base()


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session
