# cv-service/Dockerfile
FROM python:3.11-slim AS base
WORKDIR /app

# system deps + wget
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 libglib2.0-0 python3-dev build-essential gcc wget \
  && rm -rf /var/lib/apt/lists/*

# builder para pip con cache
FROM base AS builder
WORKDIR /app
COPY requirements.txt ./
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --no-cache-dir -r requirements.txt

# stage final
FROM base
WORKDIR /app

# copiar paquetes instalados
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# copiar código
COPY . .

# pre-descarga de pesos YOLO en build
RUN wget -q -O yolov8n.pt \
    https://github.com/ultralytics/assets/releases/download/v8.3.0/yolov8n.pt

ENV PORT=8000
EXPOSE 8000

CMD ["sh","-c","uvicorn app.main:app --host 0.0.0.0 --port $PORT"]
