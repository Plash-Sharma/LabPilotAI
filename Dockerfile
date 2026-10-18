FROM python:3.12-slim-bookworm

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

# Install system dependencies required by WeasyPrint (Pango, Cairo, fonts)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libharfbuzz0b \
    libjpeg-dev \
    libopenjp2-7-dev \
    libffi-dev \
    fonts-dejavu-core \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python requirements
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application, alembic configs and migrations
COPY backend/ .

# Ensure storage directory exists
RUN mkdir -p /app/storage

EXPOSE 8000

# Start script: run migrations, seed templates, and start FastAPI
CMD sh -c "alembic upgrade head && python -m app.core.seed && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"
