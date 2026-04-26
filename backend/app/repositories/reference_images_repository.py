from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from backend.app.db.database import BACKEND_DIR, get_connection


@dataclass(frozen=True)
class ReferenceImageRecord:
    id: int
    object_id: int
    label: str
    name: str
    price_minor: int
    relative_path: str
    original_filename: str | None

    @property
    def price(self) -> float:
        return self.price_minor / 100

    @property
    def absolute_path(self) -> Path:
        return BACKEND_DIR / Path(self.relative_path)

    @property
    def view_group(self) -> str | None:
        path_parts = Path(self.relative_path).parts
        if len(path_parts) >= 4:
            return path_parts[2]

        return None


class ReferenceImagesRepository:
    def list_active(self) -> list[ReferenceImageRecord]:
        query = """
            SELECT
                reference_images.id,
                reference_images.object_id,
                reference_images.relative_path,
                reference_images.original_filename,
                objects.label,
                objects.name,
                objects.price_minor
            FROM reference_images
            INNER JOIN objects ON objects.id = reference_images.object_id
            WHERE reference_images.is_active = 1 AND objects.is_active = 1
            ORDER BY objects.label, reference_images.id
        """

        with get_connection() as connection:
            rows = connection.execute(query).fetchall()

        return [
            ReferenceImageRecord(
                id=row["id"],
                object_id=row["object_id"],
                label=row["label"],
                name=row["name"],
                price_minor=row["price_minor"],
                relative_path=row["relative_path"],
                original_filename=row["original_filename"],
            )
            for row in rows
        ]


reference_images_repository = ReferenceImagesRepository()
