from __future__ import annotations

import os

DEFAULT_ALLOWED_ORIGINS = (
    "http://localhost:5173",
    "http://127.0.0.1:5173",
)


def get_allowed_origins() -> list[str]:
    raw_value = os.getenv("ALLOWED_ORIGINS", "").strip()
    if not raw_value:
        return list(DEFAULT_ALLOWED_ORIGINS)

    return [origin.strip() for origin in raw_value.split(",") if origin.strip()]
