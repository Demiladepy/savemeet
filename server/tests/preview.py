# server/tests/preview.py
import asyncio
import httpx
import pathlib
import json
from typing import Dict, Any

ROOT = pathlib.Path(__file__).parent
CV_IMAGE = ROOT / "sample_slide.png"
AUDIO_WAV = ROOT / "pregunta3.wav"

SERVICES = {
    "vision": "http://localhost:8000",
    "audio": "http://localhost:8002",
    "llm": "http://localhost:8001",
    "orchestrator": "http://localhost:8003"
}

async def make_request(
    client: httpx.AsyncClient,
    service: str,
    endpoint: str,
    method: str = "POST",
    **kwargs
) -> Dict[str, Any]:
    url = f"{SERVICES[service]}/{endpoint}"
    try:
        response = await client.request(method, url, **kwargs)
        response.raise_for_status()
        return response.json()
    except httpx.HTTPStatusError as e:
        print(f"Error en {url}: {e.response.status_code} - {e.response.text}")
        raise
    except Exception as e:
        print(f"Error inesperado en {url}: {str(e)}")
        raise

async def test_vision(client: httpx.AsyncClient):
    # 1) Detectar texto en imagen
    with CV_IMAGE.open("rb") as img:
        files = {"file": ("slide.png", img, "image/png")}
        ocr_data = await make_request(
            client, "vision", "detect_text",
            files=files
        )
        print("=== OCR Results ===")
        print(json.dumps(ocr_data, indent=2))

    # 2) Detectar elementos UI
    with CV_IMAGE.open("rb") as img:
        files = {"file": ("slide.png", img, "image/png")}
        ui_data = await make_request(
            client, "vision", "detect_ui",
            files=files
        )
        print("\n=== UI Detection ===")
        print(json.dumps(ui_data, indent=2))
    
    return {
        "text_detections": [d["text"] for d in ocr_data.get("text_detections", [])],
        "ui_elements": [d["text"] for d in ui_data.get("ui_detections", [])]
    }

async def test_audio(client: httpx.AsyncClient):
    # 3) Transcribir audio
    with AUDIO_WAV.open("rb") as wav:
        files = {"file": ("pregunta3.wav", wav, "audio/wav")}
        transcript_data = await make_request(
            client, "audio", "transcribe",
            files=files
        )
        print("\n=== Transcripción ===")
        print(json.dumps(transcript_data, indent=2))

    # 4) Detectar preguntas
    questions_data = await make_request(
        client, "audio", "detect_questions",
        json={"transcript": transcript_data.get("transcript", "")}
    )
    print("\n=== Preguntas Detectadas ===")
    print(json.dumps(questions_data, indent=2))

    # 5) Diarización
    with AUDIO_WAV.open("rb") as wav:
        files = {"file": ("reunion.wav", wav, "audio/wav")}
        diarization_data = await make_request(
            client, "audio", "diarize?num_speakers=2",
            files=files
        )
        print("\n=== Diarización ===")
        print(json.dumps(diarization_data, indent=2))
    
    return {
        "transcript": transcript_data.get("transcript", ""),
        "questions": questions_data.get("questions", []),
        "diarization": diarization_data.get("segments", [])
    }

async def test_llm(client: httpx.AsyncClient, vision_data: Dict, audio_data: Dict):
    # 6) Generar respuesta contextual
   # 6) Generar respuesta contextual
    #    incluimos también el texto detectado en la slide (vision_data["text_detections"])
    payload = {
        "text": vision_data["text_detections"] + [audio_data["transcript"]],
        "ui": vision_data["ui_elements"],
        "audio_meta": json.dumps({
            "speakers": len({s["speaker"] for s in audio_data["diarization"]}),
            "duration": sum(s["end"] - s["start"] for s in audio_data["diarization"])
        })
    }
    llm_response = await make_request(
        client, "llm", "generate_answer",
        json=payload
    )
    print("\n=== Respuesta Generada ===")
    print(json.dumps(llm_response, indent=2))
    return llm_response

async def test_orchestrator(client: httpx.AsyncClient):
    # 7) Verificar documentación
    docs_data = await make_request(
        client, "orchestrator", "docs",
        method="GET"
    )
    print("\n=== Documentación Orchestrador ===")
    print(f"Status: {docs_data['status']}")
    print(f"Docs available: {len(docs_data['content']) > 0}")
    return docs_data

async def main():
    timeout = httpx.Timeout(60.0, connect=10.0)
    
    async with httpx.AsyncClient(timeout=timeout) as client:
        # Ejecutar pruebas secuencialmente
        vision_results = await test_vision(client)
        audio_results = await test_audio(client)
        llm_results = await test_llm(client, vision_results, audio_results)
        orchestrator_results = await test_orchestrator(client)
        
        # Verificar resultados finales
        assert len(vision_results["text_detections"]) > 0, "OCR no detectó texto"
        assert len(audio_results["questions"]) > 0, "No se detectaron preguntas"
        assert "answer" in llm_results, "Respuesta LLM inválida"
        assert orchestrator_results.get("status") == 200, "Error en orchestrator"

        print("\n✅ Todas las pruebas pasaron exitosamente!")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception as e:
        print(f"\n❌ Error en las pruebas: {str(e)}")
        raise