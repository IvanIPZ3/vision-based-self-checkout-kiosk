from __future__ import annotations

import os

from fastapi import Header, HTTPException, status

ADMIN_PASSWORD_HEADER = "x-admin-password"
DEFAULT_ADMIN_PASSWORD = "rinkakyu"


def get_admin_password() -> str:
    return os.getenv("REFERENCE_ADMIN_PASSWORD", DEFAULT_ADMIN_PASSWORD)


def verify_admin_password(
    admin_password: str | None = Header(default=None, alias=ADMIN_PASSWORD_HEADER),
) -> None:
    if admin_password != get_admin_password():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Невірний пароль адміністратора.",
        )
