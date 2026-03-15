from __future__ import annotations

import io
import logging
import os
import uuid

from minio import Minio
from minio.error import S3Error

logger = logging.getLogger(__name__)

MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "localhost:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin")
KNOWLEDGE_BUCKET = os.getenv("KNOWLEDGE_BUCKET", "knowledge")

_client: Minio | None = None


def get_client() -> Minio:
    global _client
    if _client is None:
        _client = Minio(
            MINIO_ENDPOINT,
            access_key=MINIO_ACCESS_KEY,
            secret_key=MINIO_SECRET_KEY,
            secure=False,
        )
        _ensure_bucket(_client)
    return _client


def _ensure_bucket(client: Minio) -> None:
    try:
        if not client.bucket_exists(KNOWLEDGE_BUCKET):
            client.make_bucket(KNOWLEDGE_BUCKET)
            logger.info("Created MinIO bucket: %s", KNOWLEDGE_BUCKET)
    except S3Error as e:
        logger.error("Failed to ensure MinIO bucket: %s", e)
        raise


def upload_file(content: bytes, content_type: str, filename: str) -> str:
    """Upload file to MinIO, return the object key."""
    client = get_client()
    key = f"{uuid.uuid4()}/{filename}"
    client.put_object(
        KNOWLEDGE_BUCKET,
        key,
        io.BytesIO(content),
        length=len(content),
        content_type=content_type,
    )
    logger.info("Uploaded file to MinIO: %s", key)
    return key


def download_file(key: str) -> tuple[bytes, str]:
    """Download file from MinIO, return (content, content_type)."""
    client = get_client()
    response = client.get_object(KNOWLEDGE_BUCKET, key)
    try:
        content = response.read()
        content_type = response.headers.get("Content-Type", "application/octet-stream")
    finally:
        response.close()
        response.release_conn()
    return content, content_type


def delete_file(key: str) -> None:
    """Delete file from MinIO."""
    client = get_client()
    try:
        client.remove_object(KNOWLEDGE_BUCKET, key)
    except S3Error as e:
        logger.warning("Failed to delete MinIO object %s: %s", key, e)
