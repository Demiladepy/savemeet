# server/tests/test_endpoint.py
import os
import pathlib
import pytest
from httpx import AsyncClient

# Las URL base de cada servicio (puedes sobrescribirlas con env vars si quieres)
BASE_CV     = os.getenv("BASE_CV",     "http://localhost:8000")
BASE_AUDIO  = os.getenv("BASE_AUDIO",  "http://localhost:8002")
BASE_AI     = os.getenv("BASE_AI",     "http://localhost:8001")
BASE_FILTER = os.getenv("BASE_FILTER", "http://localhost:8004")

# Ruta al directorio de fixtures (las imágenes y wav que guardaste ahí)
FIXTURES = pathlib.Path(__file__).parent

@pytest.mark.asyncio
async def test_cv_detect_text():
    img_path = FIXTURES / "sample_slide.png"
    assert img_path.exists(), f"Fixture no encontrada: {img_path}"
    async with AsyncClient() as client:
        with img_path.open("rb") as img:
            files = {"file": ("slide.png", img, "image/png")}
            r = await client.post(
                f"{BASE_CV}/detect_text",
                files=files,
                timeout=10.0
            )
    assert r.status_code == 200, r.text
    body = r.json()
    assert "text_detections" in body

@pytest.mark.asyncio
async def test_cv_detect_ui():
    img_path = FIXTURES / "sample_slide.png"
    async with AsyncClient() as client:
        with img_path.open("rb") as img:
            files = {"file": ("slide.png", img, "image/png")}
            r = await client.post(
                f"{BASE_CV}/detect_ui",
                files=files,
                timeout=10.0
            )
    assert r.status_code == 200, r.text
    body = r.json()
    assert "ui_detections" in body
    assert isinstance(body["ui_detections"], list)

@pytest.mark.asyncio
async def test_audio_transcribe_and_detect():
    wav_path = FIXTURES / "pregunta3.wav"
    assert wav_path.exists(), f"Fixture no encontrada: {wav_path}"
    # primero transcribe
    async with AsyncClient() as client:
        with wav_path.open("rb") as wav:
            files = {"file": ("pregunta3.wav", wav, "audio/wav")}
            r1 = await client.post(
                f"{BASE_AUDIO}/transcribe",
                files=files,
                timeout=15.0
            )
    assert r1.status_code == 200, r1.text
    transcript = r1.json().get("transcript")
    assert transcript is not None

    # luego detect_questions
    async with AsyncClient() as client:
        r2 = await client.post(
            f"{BASE_AUDIO}/detect_questions",
            json={"transcript": transcript},
            timeout=10.0
        )
    assert r2.status_code == 200, r2.text
    assert isinstance(r2.json().get("questions"), list)

@pytest.mark.asyncio
async def test_audio_diarize():
    wav_path = FIXTURES / "reunion.wav"
    assert wav_path.exists(), f"Fixture no encontrada: {wav_path}"
    async with AsyncClient() as client:
        with wav_path.open("rb") as wav:
            files = {"file": ("reunion.wav", wav, "audio/wav")}
            r = await client.post(
                f"{BASE_AUDIO}/diarize?num_speakers=2",
                files=files,
                timeout=20.0
            )
    assert r.status_code == 200, r.text
    segments = r.json().get("segments")
    assert isinstance(segments, list)
    # opcionalmente comprueba estructura mínima
    if segments:
        assert all(k in segments[0] for k in ("start", "end", "speaker"))

@pytest.mark.asyncio
async def test_ai_generate_answer():
    payload = {
        "text": ["Test OCR"],
        "ui": ["button Guardar"],
        "audio_meta": "¿Prueba?"
    }
    async with AsyncClient() as client:
        r = await client.post(
            f"{BASE_AI}/generate_answer",
            json=payload,
            timeout=10.0
        )
    assert r.status_code == 200, r.text
    body = r.json()
    assert "answer" in body

@pytest.mark.asyncio
async def test_filter_docs():
    async with AsyncClient() as client:
        r = await client.get(f"{BASE_FILTER}/docs", timeout=5.0)
    assert r.status_code == 200
