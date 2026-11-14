from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes.resources import router

app = FastAPI(
    title=settings.APP_NAME,
    description="BinFlow Inventory and Purchase Management API",
    version="1.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)
app.include_router(router, prefix="/api/v1")


@app.get("/")
def root():
    return {"application": "BinFlow", "status": "running"}


@app.get("/health")
def health():
    return {"status": "healthy"}
