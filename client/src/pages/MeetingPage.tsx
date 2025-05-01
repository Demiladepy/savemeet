import React, { useState, useRef, useEffect } from "react";
import { AppLayout } from "@/components/layouts/AppLayout";
import { Mic, MicOff, Share2, StopCircle, MessageSquare, BookText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";

const WS_URL = "ws://localhost:8003/ws/orchestrator";
const LLM_LIVE_URL = "http://localhost:8001/generate_answer";
const LLM_SUMMARY_URL = "http://localhost:8001/summarize";

const MeetingPage: React.FC = () => {
  const [isSharing, setIsSharing] = useState(false);
  const [shareStartTime, setShareStartTime] = useState<string|null>(null);
  const [shareEndTime, setShareEndTime]   = useState<string|null>(null);
  const [duration, setDuration]            = useState<string|null>(null);
  const [isCapturingAudio, setIsCapturingAudio] = useState(false);

  const [transcripts, setTranscripts] = useState<{id:number; text:string; timestamp:string}[]>([]);
  const [questions,  setQuestions ] = useState<{id:number; text:string; timestamp:string}[]>([]);
  const [answers,    setAnswers   ] = useState<{id:number; question:string; answer:string; timestamp:string}[]>([]);
  const [visionTexts, setVisionTexts] = useState<string[]>([]);
  const [uiElements,  setUiElements ]  = useState<string[]>([]);
  const [summary,     setSummary    ]  = useState<string>("");
  const [tasks,       setTasks      ]  = useState<string[]>([]);
  const [activeTab,   setActiveTab  ]  = useState<"transcript"|"qa"|"summary">("transcript");

  const videoRef    = useRef<HTMLVideoElement>(null);
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const recorderRef = useRef<MediaRecorder>();
  const socketRef   = useRef<WebSocket>();

  // Setup WebSocket
// Setup WebSocket
useEffect(() => {
  const ws = new WebSocket(WS_URL);
  socketRef.current = ws;
  
  const handleMessage = (evt: MessageEvent) => {
    try {
      const msg = JSON.parse(evt.data);
      const now = new Date().toLocaleTimeString();

      switch (msg.type) {
        case "frame_processed":
          setVisionTexts(prev => [...prev, ...msg.data.text]);
          setUiElements(prev => [...prev, ...msg.data.ui_elements]);
          break;

        case "transcript":
          setTranscripts(prev => [
            ...prev,
            { id: Date.now(), text: msg.data, timestamp: now }
          ]);
          break;

        case "questions":
          setQuestions(prev => [
            ...prev,
            ...msg.data.map((q: string) => ({
              id: Date.now() + Math.random(), // para evitar duplicados
              text: q,
              timestamp: now
            }))
          ]);
          break;

        case "answer":
          setAnswers(prev => [
            ...prev,
            {
              id: Date.now(),
              question: "What is this section about?",
              answer: msg.data,
              timestamp: now
            }
          ]);
          break;

        case "auto_analysis":
          setAnswers(prev => [
            ...prev,
            {
              id: Date.now(),
              question: "Análisis automático de pantalla",
              answer: msg.data.answer,
              timestamp: now
            }
          ]);
          break;

          
          
          

        default:
          console.warn("Tipo de mensaje no manejado:", msg.type);
      }
    } catch (e) {
      console.error("Error procesando mensaje WS:", e);
    }
  };

  const handleClose = () => {
    console.log("Conexión WebSocket cerrada");
  };

  ws.addEventListener("message", handleMessage);
  ws.addEventListener("close", handleClose);

  return () => {
    ws.removeEventListener("message", handleMessage);
    ws.removeEventListener("close", handleClose);
    ws.close();
  };
}, []);

  // Frame capture
  useEffect(() => {
    let interval: number;
    const sendFrame = async () => {
      if (canvasRef.current && videoRef.current && socketRef.current?.readyState === WebSocket.OPEN) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
          const imageData = canvasRef.current.toDataURL('image/jpeg', 0.8);
          socketRef.current.send(JSON.stringify({
            type: "frame",
            data: imageData
          }));
        }
      }
    };
  
    if (isSharing) {
      interval = window.setInterval(sendFrame, 3000);  // Reducir a 3 segundos
    }
    return () => window.clearInterval(interval);
  }, [isSharing]);

  // Live AI via LLM service (fallback)
  const liveAnswer = async (question:string) => {
    try {
      const res = await fetch(LLM_LIVE_URL, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ text:[...visionTexts, question], ui:uiElements, audio_meta:question })
      });
      const { answer } = await res.json();
      if (answer) {
        const now = new Date().toLocaleTimeString();
        setAnswers(a=>[...a, {id:Date.now(), question, answer, timestamp:now}]);
      }
    } catch(e){
      console.error("Live answer error", e);
    }
  };

  const handleStartSharing = async () => {
    try {
      const stream = await (navigator.mediaDevices as any).getDisplayMedia({video:true});
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      const now = new Date();
      setShareStartTime(now.toLocaleTimeString());
      setShareEndTime(null); setDuration(null);
      setSummary(""); setTasks([]);
      setVisionTexts([]); setUiElements([]); setTranscripts([]); setQuestions([]); setAnswers([]);
      setActiveTab("transcript");
      setIsSharing(true);
      toast({title:"Screen sharing started"});
    } catch(e){
      toast({title:"Failed to start sharing", description:String(e)});
    }
  };

  const handleStopSharing = async () => {
    const now = new Date();
    setShareEndTime(now.toLocaleTimeString());
    if (shareStartTime) {
      const [h,m,s] = shareStartTime.split(":").map(x=>parseInt(x,10));
      const start = new Date(); start.setHours(h,m,s);
      const diff = Math.floor((now.getTime()-start.getTime())/1000);
      setDuration(`${String(Math.floor(diff/60)).padStart(2,'0')}:${String(diff%60).padStart(2,'0')}`);
    }
    // Llamada al resumen
    const fullText = transcripts.map(t=>t.text).join(" ");
    try {
      const res = await fetch(LLM_SUMMARY_URL, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ full_transcript: fullText, highlights: questions.map(q=>q.text) })
      });
      const data = await res.json();
      setSummary(data.summary);
      setTasks(data.tasks);
      setActiveTab("summary");
    } catch(e){
      console.error(e);
    }
    (videoRef.current?.srcObject as MediaStream)?.getTracks().forEach(t=>t.stop());
    setIsSharing(false);
    toast({title:"Screen sharing stopped"});
  };

  const toggleAudioCapture = () => {
    if (!isCapturingAudio) {
      navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          noiseSuppression: true
        }
      }).then(stream => {
        const recorder = new MediaRecorder(stream, { 
          mimeType: "audio/webm; codecs=opus",
          audioBitsPerSecond: 16000 
        });
        
        recorderRef.current = recorder;
        let chunks: Blob[] = [];
        
        recorder.ondataavailable = e => {
          chunks.push(e.data);
          if (chunks.length >= 3) {  // Enviar cada 3 chunks (~6 segundos)
            const blob = new Blob(chunks, { type: "audio/webm" });
            const reader = new FileReader();
            reader.onload = () => {
              if (socketRef.current?.readyState === WebSocket.OPEN) {
                socketRef.current.send(JSON.stringify({
                  type: "audio",
                  data: reader.result?.toString().split(",")[1]  // Enviar solo base64
                }));
              }
              chunks = [];
            };
            reader.readAsDataURL(blob);
          }
        };
        
        recorder.start(2000);  // Coincidir con intervalos del backend
        setIsCapturingAudio(true);
      });
    } else {
      recorderRef.current?.stop();
      setIsCapturingAudio(false);
    }
  };
  return (
    <AppLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold">Live Meeting</h1>
          <p className="text-muted-foreground">Share your screen and analyze meeting content in real-time</p>
          {shareStartTime && <p className="text-sm">Started at: {shareStartTime}</p>}
          {shareEndTime && <p className="text-sm">Ended at: {shareEndTime} (Duration: {duration})</p>}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 relative">
            <video ref={videoRef} className="w-full h-[400px] bg-black rounded-lg" muted />
            <canvas ref={canvasRef} width={640} height={360} className="hidden" />
            <div className="absolute top-4 right-4 w-64 max-h-60 overflow-y-auto bg-white/80 p-2 rounded shadow-lg">
              <h4 className="font-semibold mb-1">AI Answers</h4>
              {answers.length ? answers.slice(-5).reverse().map(a=>(
                <div key={a.id} className="mb-1 text-sm">
                  <p><strong>Q:</strong> {a.question}</p>
                  <p><strong>A:</strong> {a.answer}</p>
                </div>
              )) : <p className="text-xs text-muted-foreground">No AI answers yet</p>}
            </div>
            <div className="absolute bottom-4 left-4 flex space-x-2">
              {!isSharing
                ? <Button onClick={handleStartSharing}><Share2 className="mr-2"/>Share Screen</Button>
                : <Button variant="destructive" onClick={handleStopSharing}><StopCircle className="mr-2"/>Stop Sharing</Button>
              }
              <Button variant={isCapturingAudio ? "destructive" : "outline"} onClick={toggleAudioCapture}>
                {isCapturingAudio
                  ? <><MicOff className="mr-2"/>Stop Audio</>
                  : <><Mic className="mr-2"/>Start Audio</>
                }
              </Button>
            </div>
          </div>
          <div className="lg:col-span-1">
            <Card className="h-full flex flex-col">
              <CardContent className="flex-1 p-0 flex flex-col">
                <Tabs value={activeTab} onValueChange={v=>setActiveTab(v as any)} className="h-full">
                  <div className="px-4 pt-4">
                    <TabsList>
                      <TabsTrigger value="transcript" className="flex-1"><BookText className="mr-2"/>Transcript</TabsTrigger>
                      <TabsTrigger value="qa" className="flex-1"><MessageSquare className="mr-2"/>Q&A</TabsTrigger>
                      <TabsTrigger value="summary" className="flex-1">Summary</TabsTrigger>
                    </TabsList>
                  </div>
                  <Separator/>
                  <TabsContent value="transcript" className="flex-1 overflow-y-auto p-4">
                    {transcripts.length ? (
                      <ul className="space-y-3">
                        {transcripts.map(t=>(
                          <li key={t.id} className="bg-muted/50 p-3 rounded-md flex justify-between">
                            <p>{t.text}</p>
                            <span className="text-xs text-muted-foreground">{t.timestamp}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center">
                        <BookText className="h-10 w-10 text-muted-foreground mb-4"/>
                        <h3 className="text-lg font-medium mb-1">No Transcript Yet</h3>
                        <p className="text-sm text-muted-foreground max-w-xs">Start sharing to record transcript</p>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="qa" className="flex-1 overflow-y-auto p-4">
                    {questions.length ? (
                      questions.map(q=>(
                        <div key={q.id} className="space-y-2">
                          <div className="bg-meeting-accent/10 p-3 rounded-md border-l-4 border-meeting-accent">
                            <p className="font-medium">Q: {q.text}</p>
                            <span className="text-xs text-muted-foreground">{q.timestamp}</span>
                          </div>
                          {answers.filter(a=>a.question===q.text).map(a=>(
                            <div key={a.id} className="bg-muted/50 p-3 rounded-md ml-4">
                              <p>A: {a.answer}</p>
                              <span className="text-xs text-muted-foreground">{a.timestamp}</span>
                            </div>
                          ))}
                        </div>
                      ))
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center">
                        <MessageSquare className="h-10 w-10 text-muted-foreground mb-4"/>
                        <h3 className="text-lg font-medium mb-1">No Questions Yet</h3>
                        <p className="text-sm text-muted-foreground max-w-xs">Questions will appear here</p>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="summary" className="flex-1 overflow-y-auto p-4">
                    {summary ? (
                      <>
                        <h3 className="font-bold mb-2">Meeting Summary</h3>
                        <p className="mb-4 whitespace-pre-wrap">{summary}</p>
                        {tasks.length > 0 && (
                          <ul className="list-disc pl-5">
                            {tasks.map((t,i)=><li key={i}>{t}</li>)}
                          </ul>
                        )}
                      </>
                    ) : (
                      <div className="h-full flex items-center justify-center text-center">
                        <p className="text-muted-foreground">Summary will appear here after sharing stops</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default MeetingPage;
