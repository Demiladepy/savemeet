# app/main.py
import os
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv
from openai import AsyncOpenAI
from typing import AsyncGenerator, List, Literal, Union
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Request
load_dotenv()

AI_API_KEY = os.getenv("AI_ML_API_KEY")
AI_API_URL = os.getenv("AI_ML_API_URL")
if not AI_API_KEY or not AI_API_URL:
    raise RuntimeError("Faltan variables de entorno para la configuración de IA")

app = FastAPI(
    title="Servicio de Asistente Inteligente",
    version="1.0.0",
    description="API para integración con modelos de lenguaje avanzado"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cliente OpenAI asíncrono
client = AsyncOpenAI(
    api_key=AI_API_KEY,
    base_url=AI_API_URL,
    timeout=30.0,
    max_retries=3,
    default_headers={
        "User-Agent": "FastAPI-Assistant/1.0",
        "X-Custom-Request-ID": os.urandom(16).hex()
    }
)

# ——— Schemas ————————————————————————————————————————————————————————————
class GenerateRequest(BaseModel):
    text:         List[str] = []
    ui:           List[str] = []
    audio_meta:   Union[str, None] = None

class GenerateResponse(BaseModel):
    answer: str

class CompleteRequest(BaseModel):
    partial_transcript: str

class SummarizeRequest(BaseModel):
    full_transcript: str
    highlights:      List[str] = []

class SummarizeResponse(BaseModel):
    summary:       str
    tasks:         List[str]
    debug_payload: str

class VisualContext(BaseModel):
    text:        List[str] = []
    ui_elements: List[str] = []
    screenshot:  Union[str,None] = None

class MultimodalRequest(BaseModel):
    audio_transcript: str
    visual_context:   VisualContext
    user_intent:      Union[str,None] = None

# ——— Lógica de llamada a OpenAI ————————————————————————————————————————
async def handle_ai_request(
    messages: list[dict[str,str]],
    stream: bool = False
) -> AsyncGenerator[str,None] | str:
    try:
        if stream:
            async def generate_stream():
                async with client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=messages,
                    stream=True,
                    temperature=0.7,
                    max_tokens=500
                ) as s:
                    async for chunk in s:
                        if content := chunk.choices[0].delta.content:
                            yield f"data: {content}\n\n"
            return generate_stream()

        resp = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages,
            temperature=0.5
        )
        return resp.choices[0].message.content

    except httpx.ConnectError as e:
        raise HTTPException(503, f"Error de conexión con IA: {e}")
    except Exception as e:
        raise HTTPException(500, f"Error interno del servidor: {e}")

# ——— Endpoints —————————————————————————————————————————————————————————————

@app.post("/generate_answer", response_model=GenerateResponse)
async def generate_answer(request: GenerateRequest):
    """
    Espera:
      {
        "text": [...],
        "ui": [...],
        "audio_meta": "..."
      }
    """
    # Construye tu prompt de sistema
    system_prompt = (
        "Eres un asistente multimodal experto en análisis de contexto visual y auditivo. "
        "Integra información de estas fuentes:\n"
        "1. Texto de pantalla\n"
        "2. Elementos UI\n"
        "3. Contexto de audio\n"
        "Responde de forma clara y concisa."
    )

    # Construye el prompt de usuario usando los campos que recibiste
    user_prompt = (
        f"Texto en pantalla: {', '.join(request.text) or 'Ninguno'}\n"
        f"Elementos UI: {', '.join(request.ui)   or 'Ninguno'}\n"
        f"Metadato de audio: {request.audio_meta or 'Ninguno'}\n\n"
        "Genera una respuesta integrada considerando estos tres contextos."
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user",   "content": user_prompt}
    ]

    answer = await handle_ai_request(messages)
    return GenerateResponse(answer=answer)

@app.post("/analyze_screen")
async def analyze_screen(visual: VisualContext):
    system_prompt = (
        "Eres un experto en análisis de interfaces de usuario. Analiza:\n"
        "1. Tipo de app o sitio\n"
        "2. Flujo\n"
        "3. Elementos interactivos\n"
        "4. Sugerencias de mejora\n"
        "Responde en lista concisa."
    )
    user_prompt = (
        f"Texto: {', '.join(visual.text)}\n"
        f"UI:   {', '.join(visual.ui_elements)}"
    )
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user",   "content": user_prompt}
    ]
    analysis = await handle_ai_request(messages)
    return {"analysis": analysis.split("\n")}

@app.post("/complete_speech")
async def complete_speech(request: CompleteRequest):
    system_prompt = (
        "Completa el texto proporcionado manteniendo coherencia y estilo. "
        "Devuelve solo el texto completado."
    )
    messages = [
        {"role":"system","content": system_prompt},
        {"role":"user",  "content": request.partial_transcript}
    ]
    return StreamingResponse(
        handle_ai_request(messages, stream=True),
        media_type="text/event-stream"
    )


@app.post("/summarize", response_model=SummarizeResponse)
async def summarize(request: SummarizeRequest):
    system_prompt = (
        "You are a helpful assistant specialized in summarizing technical IT documents for meeting reports. "
        "Summarize in 4–5 bullet points. Then list action items like this:\n"
        "- [Type] [Task] [Responsible] [Priority]."
    )

    user_prompt = (
        f"Document:\n{request.full_transcript.strip()}\n\n"
        f"Key highlights: {', '.join(request.highlights) or 'None'}\n\n"
        "Please provide a concise summary and task list."
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]

    result = await handle_ai_request(messages)
    if not isinstance(result, str):
        raise HTTPException(500, "Unexpected response format from OpenAI")

    parts = result.strip().split("\n\n", maxsplit=1)
    summary = parts[0].strip()
    tasks = [line.strip() for line in parts[1].split("\n") if line.strip()] if len(parts) > 1 else []

    return SummarizeResponse(
        summary=summary,
        tasks=tasks,
        debug_payload=user_prompt
    )

@app.on_event("startup")
async def startup_event():
    try:
        test = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role":"user","content":"ping"}],
            max_tokens=1
        )
        print("✅ Conexión a IA OK")
    except Exception as e:
        print(f"⚠️ No se pudo verificar IA al inicio: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    await client.close()
