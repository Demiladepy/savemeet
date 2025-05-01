FROM python:3.11-slim AS base
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg python3-dev build-essential gcc \
    && rm -rf /var/lib/apt/lists/*

FROM base AS builder
WORKDIR /app
COPY requirements.txt ./
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --no-cache-dir -r requirements.txt

FROM base
WORKDIR /app
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY . .

ENV PORT=8003
EXPOSE ${PORT}

# Service endpoints
ENV CV_SERVICE_URL=http://cv-service:8000
ENV AUDIO_SERVICE_URL=http://audio-service:8002
ENV AI_SERVICE_URL=http://ai-orchestrator:8001
# Filtering parameters
env SSIM_THRESHOLD=0.9
ENV FRAME_COOLDOWN=20
ENV FULL_REFRESH=120

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port $PORT"]