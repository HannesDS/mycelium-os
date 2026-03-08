FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY apps/control-plane/pyproject.toml .
RUN pip install --no-cache-dir .

COPY apps/control-plane/ .
COPY mycelium.yaml /app/mycelium.yaml
COPY examples/ /app/examples/

EXPOSE 8000

CMD ["sh", "-c", "alembic upgrade head && uvicorn main:app --host 0.0.0.0 --port 8000"]
