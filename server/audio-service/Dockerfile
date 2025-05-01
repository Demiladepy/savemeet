# syntax=docker/dockerfile:1.4
FROM python:3.11-slim AS base
WORKDIR /app

# deps sistema + wget
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg build-essential gcc python3-dev wget \
  && rm -rf /var/lib/apt/lists/*

# builder pip
FROM base AS builder
WORKDIR /app
COPY requirements.txt ./
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --no-cache-dir -r requirements.txt

# final
FROM base
WORKDIR /app
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY . .

# pre-descarga Whisper en build
RUN python - <<EOF
import whisper
whisper.load_model("small")
EOF

ENV PORT=8002
EXPOSE 8002

CMD ["sh","-c","uvicorn app.main:app --host 0.0.0.0 --port $PORT"]
