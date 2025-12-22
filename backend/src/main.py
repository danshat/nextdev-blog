from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

try:
    from .db import engine
    from .models import Base
    from .routes import auth, users, posts, messages
    from .utils import load_session_token
except Exception:
    from db import engine
    from models import Base
    from routes import auth, users, posts, messages
    from utils import load_session_token


app = FastAPI()

# Allow local frontend to talk to backend (adjust origins for deployment)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files directory for profile photos
if not os.path.exists("uploads"):
    os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(posts.router)
app.include_router(messages.router)


@app.get("/")
async def root():
    return {"message": "NextDev backend"}


@app.on_event("startup")
async def on_startup():
    # Ensure models are available; Alembic should manage migrations in production.
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
