from __future__ import annotations

from pathlib import Path

from backend.app.db.database import REFERENCE_IMAGES_DIR, get_connection, init_database, utc_now_iso

SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


def sync_reference_images() -> dict[str, int]:
    init_database()
    timestamp = utc_now_iso()
    discovered_paths: set[str] = set()
    inserted = 0
    updated = 0
    skipped = 0

    with get_connection() as connection:
        object_rows = connection.execute(
            "SELECT id, label FROM objects WHERE is_active = 1"
        ).fetchall()
        objects_by_label = {row["label"]: row["id"] for row in object_rows}

        for label_directory in sorted(REFERENCE_IMAGES_DIR.iterdir()):
            if not label_directory.is_dir():
                continue

            object_id = objects_by_label.get(label_directory.name)
            if object_id is None:
                skipped += _count_supported_files(label_directory)
                continue

            for file_path in sorted(label_directory.rglob("*")):
                if not file_path.is_file() or file_path.suffix.lower() not in SUPPORTED_EXTENSIONS:
                    continue

                relative_path = file_path.relative_to(REFERENCE_IMAGES_DIR.parent).as_posix()
                discovered_paths.add(relative_path)
                existing_row = connection.execute(
                    "SELECT id FROM reference_images WHERE relative_path = ?",
                    (relative_path,),
                ).fetchone()

                if existing_row is None:
                    connection.execute(
                        """
                        INSERT INTO reference_images (
                            object_id,
                            relative_path,
                            original_filename,
                            is_active,
                            created_at
                        )
                        VALUES (?, ?, ?, 1, ?)
                        """,
                        (
                            object_id,
                            relative_path,
                            file_path.name,
                            timestamp,
                        ),
                    )
                    inserted += 1
                else:
                    connection.execute(
                        """
                        UPDATE reference_images
                        SET object_id = ?, original_filename = ?, is_active = 1
                        WHERE id = ?
                        """,
                        (
                            object_id,
                            file_path.name,
                            existing_row["id"],
                        ),
                    )
                    updated += 1

        if discovered_paths:
            placeholders = ", ".join("?" for _ in discovered_paths)
            connection.execute(
                f"UPDATE reference_images SET is_active = 0 WHERE relative_path NOT IN ({placeholders})",
                tuple(discovered_paths),
            )
        else:
            connection.execute("UPDATE reference_images SET is_active = 0")

        connection.commit()

    return {
        "inserted": inserted,
        "updated": updated,
        "skipped": skipped,
        "active": len(discovered_paths),
    }


def _count_supported_files(directory: Path) -> int:
    return sum(
        1
        for file_path in directory.rglob("*")
        if file_path.is_file() and file_path.suffix.lower() in SUPPORTED_EXTENSIONS
    )


def main() -> None:
    result = sync_reference_images()
    print(
        "Reference image sync completed: "
        f"inserted={result['inserted']}, "
        f"updated={result['updated']}, "
        f"skipped={result['skipped']}, "
        f"active={result['active']}"
    )


if __name__ == "__main__":
    main()
