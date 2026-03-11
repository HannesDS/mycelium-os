from __future__ import annotations

import os

from fastapi import Header, HTTPException

DEV_API_KEY = os.getenv("DEV_API_KEY")
DEV_PRINCIPAL_ID = os.getenv("DEV_PRINCIPAL_ID", "dev-user")


def get_principal(x_api_key: str | None = Header(None)) -> str:
    if not DEV_API_KEY:
        return DEV_PRINCIPAL_ID
    if not x_api_key or x_api_key != DEV_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")
    return DEV_PRINCIPAL_ID
