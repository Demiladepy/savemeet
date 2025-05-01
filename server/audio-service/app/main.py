import os
import io
import json
import base64
import tempfile
import subprocess
import mimetypes
from fastapi import FastAPI, File, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv
import whisper
import webrtcvad
import torchaudio
from simple_diarizer.diarizer import Diarizer
import torch

import time
time.sleep(0.1)
# Configurar backend de torchaudio
try:
    torchaudio.set_audio_backend("sox_io")
except Exception:
    try:
        torchaudio.set_audio_backend("soundfile")
    except Exception:
        print("[startup] Backend de torchaudio no configurado")

# Cargar variables de entorno
load_dotenv()
env_model = os.getenv("WHISPER_MODEL", "small")
SUPPORTED_MIME_TYPES = {
    "audio/webm", "audio/wav", "audio/mpeg", 
    "audio/ogg", "audio/x-aiff", "audio/x-flac"
}

# Configuración de dispositivo
device = "cuda" if torch.cuda.is_available() else "cpu"

# Cargar modelos
model = whisper.load_model(env_model, device=device)
vad = webrtcvad.Vad(1)
diag = Diarizer()

app = FastAPI(
    title="Audio Service",
    description="Transcribe audio, diarizar y detectar preguntas",
    version="0.4.0"
)

class QuestionDetectRequest(BaseModel):
    transcript: str

class QuestionDetectResponse(BaseModel):
    questions: list[str]

# Modificar la función de conversión FFmpeg
def convert_audio_ffmpeg(input_data: bytes) -> bytes:
    try:
        process = subprocess.Popen(
            [
                "ffmpeg",
                "-hide_banner",
                "-loglevel", "error",
                "-nostdin",
                "-f", "webm",
                "-ignore_unknown",
                "-fflags", "+discardcorrupt",
                "-c:a", "libopus",
                "-i", "pipe:0",
                "-ar", "16000",
                "-ac", "1",
                "-c:a", "pcm_s16le",
                "-f", "wav",
                "-y",
                "pipe:1"
            ],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        out, err = process.communicate(input=input_data, timeout=20)
        if process.returncode != 0:
            error_msg = err.decode('utf-8', errors='replace')
            if "Invalid data found" in error_msg:
                raise ValueError("Encabezado WebM corrupto")
            raise RuntimeError(f"FFmpeg error: {error_msg}")
            
        if len(out) < 1024:
            raise ValueError("Audio convertido vacío")
            
        return out
        
    except subprocess.TimeoutExpired:
        process.kill()
        raise RuntimeError("Tiempo de conversión excedido (20s)")

# Actualizar el endpoint de transcripción
@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """Endpoint mejorado con manejo de errores detallado"""
    try:
        # Validaciones básicas
        if not file.content_type.startswith("audio/"):
            return JSONResponse(
                content={"error": "Tipo de archivo no soportado"},
                status_code=400
            )
        
        data = await file.read()
        if len(data) < 1024:  # Mínimo 1KB para considerar válido
            return JSONResponse(
                content={"error": "Archivo de audio demasiado pequeño"},
                status_code=400
            )

        # Conversión a WAV
        wav_data = convert_audio_ffmpeg(data)
        
        # Usar archivo temporal con nombre explícito
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            tmp.write(wav_data)
            audio_path = tmp.name
        
        # Transcribir
        result = model.transcribe(audio_path)
        os.unlink(audio_path)  # Limpiar siempre
        
        return {"transcript": result.get("text", "").strip()}

    except Exception as e:
        print(f"Error crítico en transcripción: {str(e)}")
        return JSONResponse(
            content={"error": "Error procesando audio"},
            status_code=500
        )

@app.post("/detect_questions", response_model=QuestionDetectResponse)
async def detect_questions(req: QuestionDetectRequest):
    """Detecta preguntas en el texto transcrito"""
    txt = req.transcript.strip().replace('¿', '?')
    questions = [f"{p}?" for p in txt.split('?') if p.strip()]
    return QuestionDetectResponse(questions=questions[:-1])  # Excluir último fragmento vacío

@app.post("/diarize")
async def diarize_audio(file: UploadFile = File(...), num_speakers: int = 2):
    """Diarización de audio con preprocesamiento FFmpeg"""
    try:
        data = await file.read()
        wav_data = convert_audio_ffmpeg(data)
        
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            tmp.write(wav_data)
            wav_path = tmp.name
            
        segments = diag.diarize(wav_path, num_speakers=num_speakers)
        os.unlink(wav_path)  # Limpiar archivo temporal
        
        return JSONResponse(content={
            "segments": [{
                "start": float(s.get("start", 0)),
                "end": float(s.get("end", 0)),
                "speaker": f"Speaker {s.get('label', '')}"
            } for s in segments]
        })
        
    except Exception as e:
        print(f"[diarize] Error: {str(e)}")
        return JSONResponse(content={"segments": []})

@app.websocket("/ws/audio")
async def audio_websocket(ws: WebSocket):
    """WebSocket para streaming de audio en tiempo real"""
    await ws.accept()
    buffer = bytearray()
    
    try:
        while True:
            msg = await ws.receive_text()
            payload = json.loads(msg)
            
            if payload.get('cmd') == 'start_analysis':
                await ws.send_json({"status": "ready"})
                continue
                
            if 'audio' not in payload:
                continue
                
            # Decodificar audio base64
            chunk = base64.b64decode(payload['audio'].split(',')[-1])
            buffer.extend(chunk)
            
            if len(buffer) >= 3 * 16000 * 2:  # ~3 segundos de audio 16kHz 16-bit
                try:
                    # Convertir y transcribir
                    wav_data = convert_audio_ffmpeg(bytes(buffer))
                    with io.BytesIO(wav_data) as audio_buffer:
                        result = model.transcribe(audio_buffer.name)
                    
                    await ws.send_json({
                        "type": "transcript",
                        "data": result.get("text", "").strip()
                    })
                    buffer.clear()
                    
                except Exception as e:
                    print(f"[ws] Error: {str(e)}")
                    await ws.send_json({
                        "type": "error",
                        "data": "Error procesando audio"
                    })

    except WebSocketDisconnect:
        print("[ws] Cliente desconectado")
    except Exception as e:
        print(f"[ws] Error crítico: {str(e)}")
    finally:
        await ws.close()