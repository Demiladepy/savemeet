import os
import asyncio
from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from openai import AsyncOpenAI

# Cargar variables de entorno
load_dotenv()
AI_API_KEY = os.getenv("AI_ML_API_KEY")
AI_API_URL = os.getenv("AI_ML_API_URL")

if not AI_API_KEY or not AI_API_URL:
    raise RuntimeError("Faltan variables de entorno AI_ML_API_KEY o AI_ML_API_URL")

# Inicializar cliente OpenAI
client = AsyncOpenAI(
    api_key=AI_API_KEY,
    base_url=AI_API_URL,
    timeout=30.0
)

# Documento simulado en pantalla
DOCUMENT_LINES = [
    "2.5 Professional Development",
    "Professional development is intended to ensure that users, from beginner to the career security professional, possess a required level of knowledge and competence necessary for their roles.",
    "Professional development validates skills through certification. Such development and successful certification can be termed “professionalization.”",
    "The preparatory work to testing for such a certification normally includes study of a prescribed body of knowledge or technical curriculum, and may be supplemented by on-the-job experience.",
    "The movement toward professionalization within the IT security field can be seen among IT security officers, IT security auditors, IT contractors, and system/network administrators, and is evolving.",
    "There are two types of certification: general and technical. The general certification focuses on establishing a foundation of knowledge on the many aspects of the IT security profession.",
    "The technical certification focuses primarily on the technical security issues related to specific platforms, operating systems, vendor products, etc.",
    "Some agencies and organizations focus on IT security professionals with certifications as part of their recruitment efforts.",
    "Other organizations offer pay raises and bonuses to retain users with certifications and encourage others in the IT security field to seek certification."
]
DOCUMENT_TEXT = "\n".join(DOCUMENT_LINES)

# Estado para evitar respuestas múltiples en prueba
sent_audio = False

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.websocket("/ws/orchestrator")
async def ws_orchestrator(ws: WebSocket):
    await ws.accept()
    try:
        sent_audio = False  # Para evitar enviar múltiples veces la misma respuesta

        while True:
            msg = await ws.receive_json()
            msg_type = msg.get("type")

            if msg_type == "frame":
                # Simula análisis de imagen
                await ws.send_json({
                    "type": "frame_processed",
                    "data": {
                        "text": ["2.5 Professional Development", "Certification", "Security", "IT", "Training"],
                        "ui_elements": ["Header", "Paragraph"]
                    }
                })

            elif msg_type == "audio" and not sent_audio:
                question = "What is this section about?"
                await ws.send_json({"type": "transcript", "data": question})
                await ws.send_json({"type": "questions", "data": [question]})

                messages = [
                    {"role": "system", "content": "You are an assistant helping summarize and explain technical documents."},
                    {"role": "user", "content": f"Document:\n{DOCUMENT_TEXT}\n\nQuestion: {question}"}
                ]
                response = await client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=messages,
                    temperature=0.5
                )
                answer = response.choices[0].message.content.strip()
                await ws.send_json({"type": "answer", "data": answer})
                sent_audio = True  # Previene envíos repetidos

            else:
                await ws.send_json({
                    "type": "error",
                    "message": f"Unsupported message type: {msg_type}"
                })

    except WebSocketDisconnect:
        print("WebSocket disconnected.")
    except Exception as e:
        print("Critical error:", str(e))
        await ws.close(code=1011)
