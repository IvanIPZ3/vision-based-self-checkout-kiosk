from __future__ import annotations

from dataclasses import dataclass

from backend.app.db.database import get_connection


@dataclass(frozen=True)
class ObjectRecord:
    id: int
    label: str
    name: str
    price_minor: int
    description: str | None
    is_active: bool

    @property
    def price(self) -> float:
        return self.price_minor / 100


class ObjectsRepository:
    def get_active_by_labels(self, labels: list[str]) -> dict[str, ObjectRecord]:
        unique_labels = list(dict.fromkeys(labels))
        if not unique_labels:
            return {}

        placeholders = ", ".join("?" for _ in unique_labels)
        query = f"""
            SELECT id, label, name, price_minor, description, is_active
            FROM objects
            WHERE label IN ({placeholders}) AND is_active = 1
        """

        with get_connection() as connection:
            rows = connection.execute(query, unique_labels).fetchall()

        return {
            row["label"]: ObjectRecord(
                id=row["id"],
                label=row["label"],
                name=row["name"],
                price_minor=row["price_minor"],
                description=row["description"],
                is_active=bool(row["is_active"]),
            )
            for row in rows
        }


objects_repository = ObjectsRepository()
