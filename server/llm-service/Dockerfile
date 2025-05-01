FROM python:3.11-slim AS base
WORKDIR /app
# Install compile deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3-dev build-essential gcc \
    && rm -rf /var/lib/apt/lists/*

# Builder stage: cache pip packages
FROM base AS builder
WORKDIR /app
COPY requirements.txt ./
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --no-cache-dir -r requirements.txt

# Final image
FROM base
WORKDIR /app
# Copy installed packages
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
# Copy source code
COPY . .

# Expose port
ENV PORT=8001
EXPOSE ${PORT}

# LLM API config
ENV AI_ML_API_KEY=${AI_ML_API_KEY}
ENV AI_ML_API_URL=${AI_ML_API_URL:-https://api.ai-ml.com/v1/chat/completions}

# Run
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port $PORT"]