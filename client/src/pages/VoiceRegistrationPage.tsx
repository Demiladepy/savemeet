
import React, { useState, useRef } from "react";
import { AppLayout } from "@/components/layouts/AppLayout";
import { 
  Mic, 
  Square, 
  PlayCircle, 
  Upload, 
  RefreshCw,
  CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";

const SAMPLE_TEXT = `Please read the following text aloud clearly and naturally. This process helps us capture the unique characteristics of your voice for verification. Try to speak continuously and comfortably.

The quick brown fox jumps over the lazy dog. This sentence uses every letter in the English alphabet, which is perfect for voice sampling. Remember to speak at a steady pace and avoid background noise. Thank you for your cooperation.`;

const VoiceRegistrationPage = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingComplete, setRecordingComplete] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [enrollmentComplete, setEnrollmentComplete] = useState(false);
  
  const progressIntervalRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recordingTimeRef = useRef<number>(0);
  
  const MAX_RECORDING_TIME = 30; // 30 seconds

  const startRecording = () => {
    setIsRecording(true);
    setRecordingComplete(false);
    setRecordingProgress(0);
    recordingTimeRef.current = 0;
    
    // Simulate recording progress
    progressIntervalRef.current = window.setInterval(() => {
      recordingTimeRef.current += 1;
      const progress = (recordingTimeRef.current / MAX_RECORDING_TIME) * 100;
      setRecordingProgress(progress);
      
      if (recordingTimeRef.current >= MAX_RECORDING_TIME) {
        stopRecording();
      }
    }, 1000);
    
    toast({
      title: "Recording started",
      description: "Please speak for about 30 seconds"
    });
  };
  
  const stopRecording = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    
    setIsRecording(false);
    setRecordingComplete(true);
    
    toast({
      title: "Recording complete",
      description: "You can now preview or upload your recording"
    });
  };
  
  const resetRecording = () => {
    setRecordingComplete(false);
    setRecordingProgress(0);
    setEnrollmentComplete(false);
  };
  
  const uploadRecording = () => {
    // Simulate upload and enrollment process
    toast({
      title: "Uploading voice sample",
      description: "Your voice sample is being processed..."
    });
    
    setTimeout(() => {
      setEnrollmentComplete(true);
      toast({
        title: "Voice enrollment complete",
        description: "Your voice has been successfully registered"
      });
    }, 2000);
  };
  
  const playRecording = () => {
    // In a real implementation, this would play the actual recording
    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Voice Registration</h1>
          <p className="text-muted-foreground">
            Record your voice for speaker verification
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Record Voice Sample</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {!enrollmentComplete ? (
                <>
                  <div className="flex justify-center">
                    <div className={`relative w-32 h-32 rounded-full flex items-center justify-center border-4 ${isRecording ? 'border-destructive animate-pulse' : 'border-meeting-primary'}`}>
                      <Mic className={`h-12 w-12 ${isRecording ? 'text-destructive' : 'text-meeting-primary'}`} />
                      {isRecording && (
                        <div className="absolute -inset-1 rounded-full border-4 border-destructive/20 animate-ping"></div>
                      )}
                    </div>
                  </div>

                  {/* Sample text for reading during recording */}
                  <div className="max-w-xl mx-auto px-4 py-3 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm leading-relaxed whitespace-pre-wrap select-text">
                    {SAMPLE_TEXT}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Recording progress</span>
                      <span>{Math.round(recordingProgress)}%</span>
                    </div>
                    <Progress value={recordingProgress} className="h-2" />
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      Please speak continuously for about 30 seconds
                    </p>
                  </div>
                  
                  <div className="flex justify-center space-x-4">
                    {!isRecording && !recordingComplete && (
                      <Button
                        onClick={startRecording}
                        className="bg-meeting-primary hover:bg-meeting-primary/90"
                      >
                        <Mic className="h-5 w-5 mr-2" />
                        Start Recording
                      </Button>
                    )}
                    
                    {isRecording && (
                      <Button
                        variant="destructive"
                        onClick={stopRecording}
                      >
                        <Square className="h-5 w-5 mr-2" />
                        Stop Recording
                      </Button>
                    )}
                    
                    {recordingComplete && (
                      <>
                        <Button
                          variant="outline"
                          onClick={playRecording}
                        >
                          <PlayCircle className="h-5 w-5 mr-2" />
                          Preview
                        </Button>
                        
                        <Button
                          variant="outline"
                          onClick={resetRecording}
                        >
                          <RefreshCw className="h-5 w-5 mr-2" />
                          Reset
                        </Button>
                        
                        <Button
                          onClick={uploadRecording}
                          className="bg-meeting-secondary hover:bg-meeting-secondary/90"
                        >
                          <Upload className="h-5 w-5 mr-2" />
                          Upload
                        </Button>
                      </>
                    )}
                  </div>
                  
                  {/* Hidden audio element for preview (in a real app, this would use the actual recording) */}
                  <audio ref={audioRef} src="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=" />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 space-y-4">
                  <div className="w-20 h-20 rounded-full bg-meeting-secondary/20 flex items-center justify-center">
                    <CheckCircle className="h-10 w-10 text-meeting-secondary" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-semibold mb-2">Voice Registration Complete</h3>
                    <p className="text-muted-foreground">
                      Your voice has been successfully registered for speaker verification
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={resetRecording}
                    className="mt-4"
                  >
                    <RefreshCw className="h-5 w-5 mr-2" />
                    Record Again
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>About Voice Registration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p>
                Voice registration allows the AI Meeting Assistant to recognize your voice 
                during meetings. This helps with speaker identification in transcripts and
                improves the accuracy of question detection.
              </p>
              <h4 className="text-lg font-medium mt-4">Instructions:</h4>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Click "Start Recording" and speak continuously for 30 seconds</li>
                <li>Try to speak naturally as you would in a meeting</li>
                <li>Include a variety of sentences and speaking styles</li>
                <li>Avoid background noise during recording if possible</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default VoiceRegistrationPage;
