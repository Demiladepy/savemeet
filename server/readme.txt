# AsSIstant

Descripcion:  
AsSIstant es una plataforma modular de micro-servicios (Visión, Audio, LLM y Orquestador) que, en conjunto, permiten:  
- Detectar y extraer texto de diapositivas  
- Identificar elementos de UI  
- Transcribir y diarizar grabaciones de voz  
- Generar respuestas contextuales mediante un modelo de lenguaje  
- Orquestar el flujo completo a través de WebSockets  

---

Planificacion:  
Desarrollo planificado desde 01/05/2025 hasta 30/06/2025, con despliegue iterativo de cada componente.

---

Pages:  
Vision-Service  
Audio-Service  
LLM-Service  
Orchestrator-Service  
Pruebas de integración (`server/tests/preview.py`)  

---

Ramas:  
main  
vision-service  
audio-service  
llm-service  
orchestrator-service  
tests  

---

Funciones:  
César Vera (Orquestación WebSocket)  
Christian Mendoza (Visión por Computadora)  
Ignacio García (Servicio de Audio)  
Jared Pimentel (Integración LLM)  
Fernanda Mattos (Pruebas de integración)  

---

Configuración del Proyecto:  

1. Clonar repositorio  
   ```bash
   git clone https://github.com/tu_usuario/AssIstant.git
   cd AssIstant/server
Crear y activar entorno virtual

bash
Copiar
Editar
python -m venv venv
# Linux / macOS
source venv/bin/activate
# Windows PowerShell
.\venv\Scripts\Activate.ps1
Variables de entorno
Copiar cada .env.template a .env dentro de cada carpeta de servicio y rellenar:

vision-service/.env → (API keys si aplica)

audio-service/.env

llm-service/.env

dotenv
Copiar
Editar
AI_ML_API_KEY=<tu_api_key>
AI_ML_API_URL=https://api.aimlapi.com/v1
orchestrator-service/.env

dotenv
Copiar
Editar
CV_SERVICE_URL=http://localhost:8000
AUDIO_SERVICE_URL=http://localhost:8002
AI_SERVICE_URL=http://localhost:8001
SSIM_THRESHOLD=0.9
FRAME_COOLDOWN=20
FULL_REFRESH=120
Instalar dependencias
En cada servicio:

bash
Copiar
Editar
pip install -r requirements.txt
Ejecutar Servicios:

Vision

bash
Copiar
Editar
cd vision-service
uvicorn app.main:app --reload --port 8000
Audio

bash
Copiar
Editar
cd audio-service
uvicorn app.main:app --reload --port 8002
LLM

bash
Copiar
Editar
cd llm-service
uvicorn app.main:app --reload --port 8001
Orchestrator

bash
Copiar
Editar
cd orchestrator-service
uvicorn app.main:app --reload --port 8003
Pruebas de Integración:

Con todos los servicios arriba, ejecutar desde server/tests:

bash
Copiar
Editar
cd tests
python preview.py
Salida esperada:

OCR de la diapositiva

Detección UI

Transcripción

Detección de preguntas

Diarización

Respuesta LLM

Verificación Orquestador

Al finalizar, verás un ✅ Todas las pruebas pasaron exitosamente!

