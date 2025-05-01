import os
import io
import json
import base64
from fastapi import FastAPI, File, UploadFile, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import JSONResponse
from PIL import Image
import numpy as np
import cv2
import easyocr
from ultralytics import YOLO

app = FastAPI(
    title="CV Microservice",
    description="Procesa frames para OCR y detección de elementos de UI.",
    version="0.1.0"
)

# Carga de modelos
reader = easyocr.Reader(['en', 'es'], gpu=False)
yolo_model = YOLO('yolov8n.pt')

# Función auxiliar para cargar imagen desde bytes
def read_image_bytes(data: bytes) -> np.ndarray:
    image = Image.open(io.BytesIO(data)).convert('RGB')
    return cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)

@app.post("/detect_text")
async def detect_text(file: UploadFile = File(...)):
    """Detecta texto en la imagen usando EasyOCR."""
    try:
        content = await file.read()
        img = read_image_bytes(content)
        results = reader.readtext(img)
        detections = [{
            "bbox": [list(map(int, p)) for p in bbox],
            "text": text,
            "confidence": float(conf)
        } for bbox, text, conf in results]
        return JSONResponse(content={"text_detections": detections})
    except Exception as e:
        print("detect_text error:", e)
        return JSONResponse(content={"text_detections": []})

@app.post("/detect_ui")
async def detect_ui(file: UploadFile = File(...)):
    """Detecta elementos de UI en la imagen usando YOLO."""
    try:
        content = await file.read()
        img = read_image_bytes(content)
        results = yolo_model(img)
        detections = []
        for r in results:
            for b in r.boxes:
                cls = int(b.cls[0])
                name = results.names.get(cls, str(cls))
                x1, y1, x2, y2 = map(float, b.xyxy[0])
                detections.append({
                    "class_id": cls,
                    "class_name": name,
                    "bbox": [x1, y1, x2, y2],
                    "confidence": float(b.conf[0])
                })
        return JSONResponse(content={"ui_detections": detections})
    except Exception as e:
        print("detect_ui error:", e)
        return JSONResponse(content={"ui_detections": []})

@app.post("/process_frame")
async def process_frame(file: UploadFile = File(...)):
    try:
        content = await file.read()
        img = read_image_bytes(content)
        
        # Mejorar parámetros de OCR
        text_res = reader.readtext(
            img,
            decoder = 'beamsearch',  # Aumentar precisión
            batch_size = 4,
            width_ths = 0.95,
            text_threshold = 0.7
        )
        
        # Filtrar detecciones de UI
        ui_res = yolo_model(img, conf=0.6)  # Aumentar confianza mínima
        ui_detections = []
        class_names = ui_res[0].names if ui_res else {}
        
        for box in ui_res[0].boxes:
            cls_id = int(box.cls[0])
            confidence = float(box.conf[0])
            element = {
                "class_id": cls_id,
                "class_name": class_names.get(cls_id, f"cls_{cls_id}"),
                "confidence": confidence,
                "bbox": [round(float(x), 2) for x in box.xyxy[0].tolist()]
            }
            ui_detections.append(element)
        
        return JSONResponse(content={
            "text_detections": [{"text": t[1], "confidence": float(t[2])} for t in text_res],
            "ui_detections": ui_detections
        })
        
    except Exception as e:
        print(f"Error en process_frame: {str(e)}")
        return JSONResponse(content={
            "text_detections": [],
            "ui_detections": []
        })
@app.websocket("/ws/cv")
async def cv_ws(ws: WebSocket):
    """WebSocket para procesar frames en base64 y devolver texto y clases de UI."""
    await ws.accept()
    try:
        while True:
            data = await ws.receive_text()
            payload = json.loads(data)
            img_b64 = payload.get("image", "")
            if not img_b64:
                continue
            img_bytes = base64.b64decode(img_b64.split(",")[-1])
            img = read_image_bytes(img_bytes)
            # OCR parcial
            text_res = reader.readtext(img)
            texts = [t for _, t, _ in text_res]
            # UI parcial
            ui_res = yolo_model(img)
            classes = [int(b.cls[0]) for r in ui_res for b in r.boxes]
            await ws.send_json({"text": texts, "ui": classes})
    except WebSocketDisconnect:
        pass
