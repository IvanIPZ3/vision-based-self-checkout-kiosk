from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

OBJECT_SEED_PATH = Path(__file__).resolve().parents[2] / "data" / "objects_seed.json"


@dataclass(frozen=True)
class ObjectSeedRecord:
    label: str
    name: str
    price_minor: int
    description: str | None


def load_object_seeds() -> list[ObjectSeedRecord]:
    if not OBJECT_SEED_PATH.exists():
        raise FileNotFoundError(
            f"Object seed file is missing: {OBJECT_SEED_PATH}"
        )

    raw_payload = json.loads(OBJECT_SEED_PATH.read_text(encoding="utf-8"))
    if not isinstance(raw_payload, list):
        raise ValueError("Object seed file must contain a JSON array.")

    seed_records: list[ObjectSeedRecord] = []
    for index, item in enumerate(raw_payload, start=1):
        if not isinstance(item, dict):
            raise ValueError(f"Object seed at index {index} must be a JSON object.")

        label = _read_required_string(item, "label", index)
        name = _read_required_string(item, "name", index)
        description = _read_optional_string(item, "description", index)
        price_minor = _read_price_minor(item, index)

        seed_records.append(
            ObjectSeedRecord(
                label=label,
                name=name,
                price_minor=price_minor,
                description=description,
            )
        )

    return seed_records


def _read_required_string(item: dict[str, object], key: str, index: int) -> str:
    value = item.get(key)
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"Object seed at index {index} must contain non-empty '{key}'.")

    return value.strip()


def _read_optional_string(item: dict[str, object], key: str, index: int) -> str | None:
    value = item.get(key)
    if value is None:
        return None

    if not isinstance(value, str):
        raise ValueError(f"Object seed at index {index} has invalid '{key}'.")

    normalized_value = value.strip()
    return normalized_value or None


def _read_price_minor(item: dict[str, object], index: int) -> int:
    if "price_minor" in item:
        raw_value = item["price_minor"]
        if not isinstance(raw_value, int) or raw_value < 0:
            raise ValueError(
                f"Object seed at index {index} must contain non-negative integer 'price_minor'."
            )
        return raw_value

    if "price" in item:
        raw_value = item["price"]
        if not isinstance(raw_value, int | float) or raw_value < 0:
            raise ValueError(
                f"Object seed at index {index} must contain non-negative numeric 'price'."
            )
        return int(round(float(raw_value) * 100))

    raise ValueError(
        f"Object seed at index {index} must contain either 'price' or 'price_minor'."
    )
