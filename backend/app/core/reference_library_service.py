from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from io import BytesIO
from pathlib import Path
from typing import Literal

from PIL import Image, ImageOps

from backend.app.db.database import REFERENCE_IMAGES_DIR
from backend.app.db.sync_reference_images import sync_reference_images
from backend.app.repositories.objects_repository import objects_repository

ReferenceViewGroup = Literal["front", "back"]


class ReferenceCaptureError(Exception):
    """Raised when a reference capture request cannot be completed."""


@dataclass(frozen=True)
class SavedReferenceCapture:
    object_label: str
    object_name: str
    view_group: ReferenceViewGroup
    saved_relative_path: str
    filename: str
    width: int
    height: int
    image_format: str
    sync_active: int


class ReferenceLibraryService:
    def list_reference_objects(self) -> list[dict[str, object]]:
        return [
            {
                "id": item.id,
                "label": item.label,
                "name": item.name,
            }
            for item in objects_repository.list_active()
        ]

    def save_reference_capture(
        self,
        *,
        object_label: str,
        view_group: ReferenceViewGroup,
        image_bytes: bytes,
    ) -> SavedReferenceCapture:
        object_record = objects_repository.get_active_by_label(object_label)
        if object_record is None:
            raise ReferenceCaptureError("Обраний товар не знайдено в каталозі.")

        if view_group not in {"front", "back"}:
            raise ReferenceCaptureError("Сторона еталона має бути front або back.")

        try:
            with Image.open(BytesIO(image_bytes)) as raw_image:
                normalized_image = ImageOps.exif_transpose(raw_image).convert("RGB")
                width, height = normalized_image.size
                image_format = (raw_image.format or "JPEG").upper()
        except Exception as error:  # noqa: BLE001
            raise ReferenceCaptureError("Не вдалося прочитати зображення для еталона.") from error

        if width < 120 or height < 120:
            raise ReferenceCaptureError("Зображення еталона занадто мале для стабільного розпізнавання.")

        target_directory = REFERENCE_IMAGES_DIR / object_record.label / view_group
        target_directory.mkdir(parents=True, exist_ok=True)

        timestamp = datetime.now(UTC).strftime("%Y%m%d_%H%M%S_%f")
        filename = f"{timestamp}.jpg"
        absolute_path = target_directory / filename

        normalized_image.save(absolute_path, format="JPEG", quality=95, optimize=True)

        sync_result = sync_reference_images()
        saved_relative_path = absolute_path.relative_to(REFERENCE_IMAGES_DIR.parent).as_posix()

        return SavedReferenceCapture(
            object_label=object_record.label,
            object_name=object_record.name,
            view_group=view_group,
            saved_relative_path=saved_relative_path,
            filename=filename,
            width=width,
            height=height,
            image_format=image_format,
            sync_active=sync_result["active"],
        )


reference_library_service = ReferenceLibraryService()
