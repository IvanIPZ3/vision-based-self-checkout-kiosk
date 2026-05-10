from typing import Literal

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from backend.app.core.reference_library_service import (
    ReferenceCaptureError,
    reference_library_service,
)
from backend.app.schemas.reference_library import (
    ReferenceCaptureResponse,
    ReferenceObjectItem,
    ReferenceObjectsResponse,
)

router = APIRouter(tags=["reference-library"])


@router.get("/api/reference-library/objects", response_model=ReferenceObjectsResponse)
async def list_reference_objects() -> ReferenceObjectsResponse:
    return ReferenceObjectsResponse(
        items=[
            ReferenceObjectItem(**item)
            for item in reference_library_service.list_reference_objects()
        ]
    )


@router.post("/api/reference-library/capture", response_model=ReferenceCaptureResponse)
async def capture_reference_image(
    objectLabel: str = Form(...),
    viewGroup: Literal["front", "back"] = Form(...),
    image: UploadFile = File(...),
) -> ReferenceCaptureResponse:
    if image.filename is None or not image.filename.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Назва файла зображення відсутня.",
        )

    if image.content_type and not image.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Файл еталона має бути зображенням.",
        )

    file_bytes = await image.read()
    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Файл зображення порожній.",
        )

    try:
        saved_capture = reference_library_service.save_reference_capture(
            object_label=objectLabel,
            view_group=viewGroup,
            image_bytes=file_bytes,
        )
    except ReferenceCaptureError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    return ReferenceCaptureResponse(
        objectLabel=saved_capture.object_label,
        objectName=saved_capture.object_name,
        viewGroup=saved_capture.view_group,
        savedPath=saved_capture.saved_relative_path,
        filename=saved_capture.filename,
        width=saved_capture.width,
        height=saved_capture.height,
        imageFormat=saved_capture.image_format,
        syncActive=saved_capture.sync_active,
        message="Еталонне зображення збережено і додано до активного набору.",
    )
