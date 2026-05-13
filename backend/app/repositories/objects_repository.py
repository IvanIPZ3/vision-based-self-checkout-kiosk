from __future__ import annotations

from dataclasses import dataclass
import re
import unicodedata

from backend.app.db.database import REFERENCE_IMAGES_DIR, get_connection, utc_now_iso


@dataclass(frozen=True)
class ObjectRecord:
    id: int
    label: str
    name: str
    price_minor: int
    description: str | None
    catalog_source: str
    is_active: bool

    @property
    def price(self) -> float:
        return self.price_minor / 100


class ObjectsRepository:
    def list_active(self) -> list[ObjectRecord]:
        query = """
            SELECT id, label, name, price_minor, description, catalog_source, is_active
            FROM objects
            WHERE is_active = 1
            ORDER BY name COLLATE NOCASE, label
        """

        with get_connection() as connection:
            rows = connection.execute(query).fetchall()

        return [self._row_to_record(row) for row in rows]

    def get_active_by_label(self, label: str) -> ObjectRecord | None:
        query = """
            SELECT id, label, name, price_minor, description, catalog_source, is_active
            FROM objects
            WHERE label = ? AND is_active = 1
        """

        with get_connection() as connection:
            row = connection.execute(query, (label,)).fetchone()

        if row is None:
            return None

        return self._row_to_record(row)

    def get_active_by_labels(self, labels: list[str]) -> dict[str, ObjectRecord]:
        unique_labels = list(dict.fromkeys(labels))
        if not unique_labels:
            return {}

        placeholders = ", ".join("?" for _ in unique_labels)
        query = f"""
            SELECT id, label, name, price_minor, description, catalog_source, is_active
            FROM objects
            WHERE label IN ({placeholders}) AND is_active = 1
        """

        with get_connection() as connection:
            rows = connection.execute(query, unique_labels).fetchall()

        return {
            row["label"]: self._row_to_record(row)
            for row in rows
        }

    def create_admin_book(self, *, name: str, price_minor: int, description: str | None) -> ObjectRecord:
        label = self._build_unique_label(name)
        timestamp = utc_now_iso()

        with get_connection() as connection:
            cursor = connection.execute(
                """
                INSERT INTO objects (
                    label,
                    name,
                    price_minor,
                    description,
                    catalog_source,
                    is_active,
                    created_at,
                    updated_at
                )
                VALUES (?, ?, ?, ?, 'admin', 1, ?, ?)
                """,
                (
                    label,
                    name,
                    price_minor,
                    description,
                    timestamp,
                    timestamp,
                ),
            )
            connection.commit()
            object_id = int(cursor.lastrowid)

        (REFERENCE_IMAGES_DIR / label / "front").mkdir(parents=True, exist_ok=True)
        (REFERENCE_IMAGES_DIR / label / "back").mkdir(parents=True, exist_ok=True)

        return ObjectRecord(
            id=object_id,
            label=label,
            name=name,
            price_minor=price_minor,
            description=description,
            catalog_source="admin",
            is_active=True,
        )

    def _build_unique_label(self, name: str) -> str:
        base_label = _slugify_book_label(name)

        with get_connection() as connection:
            existing_labels = {
                row["label"]
                for row in connection.execute("SELECT label FROM objects").fetchall()
            }

        if base_label not in existing_labels:
            return base_label

        suffix = 2
        while f"{base_label}_{suffix}" in existing_labels:
            suffix += 1

        return f"{base_label}_{suffix}"

    @staticmethod
    def _row_to_record(row) -> ObjectRecord:
        return ObjectRecord(
            id=row["id"],
            label=row["label"],
            name=row["name"],
            price_minor=row["price_minor"],
            description=row["description"],
            catalog_source=row["catalog_source"],
            is_active=bool(row["is_active"]),
        )


CYRILLIC_TO_LATIN_MAP = {
    "а": "a",
    "б": "b",
    "в": "v",
    "г": "h",
    "ґ": "g",
    "д": "d",
    "е": "e",
    "є": "ye",
    "ж": "zh",
    "з": "z",
    "и": "y",
    "і": "i",
    "ї": "yi",
    "й": "i",
    "к": "k",
    "л": "l",
    "м": "m",
    "н": "n",
    "о": "o",
    "п": "p",
    "р": "r",
    "с": "s",
    "т": "t",
    "у": "u",
    "ф": "f",
    "х": "kh",
    "ц": "ts",
    "ч": "ch",
    "ш": "sh",
    "щ": "shch",
    "ь": "",
    "ю": "yu",
    "я": "ya",
    "ы": "y",
    "э": "e",
    "ъ": "",
    "ё": "yo",
}


def _slugify_book_label(name: str) -> str:
    normalized_name = name.strip().lower()
    transliterated_characters: list[str] = []

    for character in normalized_name:
        transliterated_characters.append(CYRILLIC_TO_LATIN_MAP.get(character, character))

    transliterated_name = "".join(transliterated_characters)
    ascii_name = unicodedata.normalize("NFKD", transliterated_name).encode("ascii", "ignore").decode("ascii")
    sanitized_name = re.sub(r"[^a-z0-9]+", "_", ascii_name).strip("_")

    if not sanitized_name:
        sanitized_name = "book"

    return sanitized_name[:48]


objects_repository = ObjectsRepository()
