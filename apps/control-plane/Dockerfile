FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

RUN adduser --system --home /app --no-create-home appuser

WORKDIR /app

COPY apps/control-plane/pyproject.toml .
RUN pip install --no-cache-dir .

COPY --chown=appuser:appuser apps/control-plane/ .
COPY --chown=appuser:appuser mycelium.yaml /app/mycelium.yaml
COPY --chown=appuser:appuser examples/ /app/examples/

USER appuser

EXPOSE 8000

CMD ["sh", "-c", "alembic upgrade head && uvicorn main:app --host 0.0.0.0 --port 8000"]
