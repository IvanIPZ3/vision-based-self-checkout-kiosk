from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.routers.predict import router as prediction_router

app = FastAPI(
    title="Self-Checkout Inference API",
    version="0.1.0",
    description="Backend API for image/frame reception and mock object recognition.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(prediction_router)
