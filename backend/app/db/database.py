from __future__ import annotations

import sqlite3
from contextlib import contextmanager
from datetime import UTC, datetime
from pathlib import Path
from typing import Iterator

from backend.app.db.seed_data import load_object_seeds

BACKEND_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = BACKEND_DIR / "data"
REFERENCE_IMAGES_DIR = BACKEND_DIR / "reference_images"
DB_PATH = DATA_DIR / "self_checkout.db"
SCHEMA_PATH = Path(__file__).with_name("schema.sql")


def utc_now_iso() -> str:
    return datetime.now(UTC).isoformat(timespec="seconds")


@contextmanager
def get_connection() -> Iterator[sqlite3.Connection]:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON;")

    try:
        yield connection
    finally:
        connection.close()


def init_database() -> None:
    schema_sql = SCHEMA_PATH.read_text(encoding="utf-8")
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    REFERENCE_IMAGES_DIR.mkdir(parents=True, exist_ok=True)

    with get_connection() as connection:
        connection.executescript(schema_sql)
        _seed_objects(connection)
        connection.commit()


def _seed_objects(connection: sqlite3.Connection) -> None:
    seed_objects = load_object_seeds()
    timestamp = utc_now_iso()
    labels = [seed_object.label for seed_object in seed_objects]

    connection.executemany(
        """
        INSERT INTO objects (label, name, price_minor, description, is_active, created_at, updated_at)
        VALUES (:label, :name, :price_minor, :description, 1, :created_at, :updated_at)
        ON CONFLICT(label) DO UPDATE SET
            name = excluded.name,
            price_minor = excluded.price_minor,
            description = excluded.description,
            is_active = 1,
            updated_at = excluded.updated_at
        """,
        [
            {
                "label": seed_object.label,
                "name": seed_object.name,
                "price_minor": seed_object.price_minor,
                "description": seed_object.description,
                "created_at": timestamp,
                "updated_at": timestamp,
            }
            for seed_object in seed_objects
        ],
    )

    if labels:
        placeholders = ", ".join("?" for _ in labels)
        connection.execute(
            f"UPDATE objects SET is_active = 0, updated_at = ? WHERE label NOT IN ({placeholders})",
            (timestamp, *labels),
        )
    else:
        connection.execute(
            "UPDATE objects SET is_active = 0, updated_at = ?",
            (timestamp,),
        )
