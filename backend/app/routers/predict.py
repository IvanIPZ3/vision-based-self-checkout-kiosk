from fastapi import APIRouter, File, HTTPException, UploadFile, status

from backend.app.core.recognition_service import (
    ImageValidationError,
    recognition_service,
)
from backend.app.schemas.prediction import HealthResponse, PredictionResponse

router = APIRouter(tags=["inference"])


@router.get("/health", response_model=HealthResponse)
@router.get("/api/inference/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    return HealthResponse(status="ok")


@router.post("/predict", response_model=PredictionResponse)
@router.post("/api/inference/predict", response_model=PredictionResponse)
async def predict(image: UploadFile = File(...)) -> PredictionResponse:
    if image.filename is None or not image.filename.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Назва файла зображення відсутня.",
        )

    if image.content_type and not image.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Файл повинен бути зображенням.",
        )

    file_bytes = await image.read()
    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Файл зображення порожній.",
        )

    try:
        return recognition_service.predict(
            image_bytes=file_bytes,
            filename=image.filename,
            content_type=image.content_type,
        )
    except ImageValidationError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error
