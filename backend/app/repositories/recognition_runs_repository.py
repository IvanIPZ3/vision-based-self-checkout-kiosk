from __future__ import annotations

from dataclasses import dataclass

from backend.app.db.database import get_connection, utc_now_iso


@dataclass(frozen=True)
class RecognitionRunPayload:
    request_filename: str | None
    request_content_type: str | None
    image_width: int | None
    image_height: int | None
    image_format: str | None
    detected_any: bool
    unresolved_count: int
    message: str
    algorithm_name: str
    algorithm_version: str


@dataclass(frozen=True)
class RecognitionRunItemPayload:
    object_id: int | None
    predicted_label: str
    quantity: int
    confidence: float
    good_matches: int | None = None
    inliers: int | None = None


class RecognitionRunsRepository:
    def create_run(
        self,
        *,
        run: RecognitionRunPayload,
        items: list[RecognitionRunItemPayload],
    ) -> int:
        timestamp = utc_now_iso()

        with get_connection() as connection:
            cursor = connection.execute(
                """
                INSERT INTO recognition_runs (
                    request_filename,
                    request_content_type,
                    image_width,
                    image_height,
                    image_format,
                    detected_any,
                    unresolved_count,
                    message,
                    algorithm_name,
                    algorithm_version,
                    created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    run.request_filename,
                    run.request_content_type,
                    run.image_width,
                    run.image_height,
                    run.image_format,
                    int(run.detected_any),
                    run.unresolved_count,
                    run.message,
                    run.algorithm_name,
                    run.algorithm_version,
                    timestamp,
                ),
            )
            run_id = int(cursor.lastrowid)

            if items:
                connection.executemany(
                    """
                    INSERT INTO recognition_run_items (
                        run_id,
                        object_id,
                        predicted_label,
                        quantity,
                        confidence,
                        good_matches,
                        inliers,
                        created_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    [
                        (
                            run_id,
                            item.object_id,
                            item.predicted_label,
                            item.quantity,
                            item.confidence,
                            item.good_matches,
                            item.inliers,
                            timestamp,
                        )
                        for item in items
                    ],
                )

            connection.commit()

        return run_id


recognition_runs_repository = RecognitionRunsRepository()
