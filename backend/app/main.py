from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.core.settings import get_allowed_origins
from backend.app.db.database import init_database
from backend.app.db.sync_reference_images import sync_reference_images
from backend.app.routers.predict import router as prediction_router
from backend.app.routers.reference_library import router as reference_library_router


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_database()
    sync_reference_images()
    yield


app = FastAPI(
    title="Self-Checkout Inference API",
    version="0.1.0",
    description="Backend API for image/frame reception and OpenCV-based object recognition.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(prediction_router)
app.include_router(reference_library_router)
