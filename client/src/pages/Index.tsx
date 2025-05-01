
import React from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layouts/AppLayout";
import { 
  Activity, 
  Video, 
  Mic, 
  AlertCircle, 
  PlayCircle, 
  LogIn 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Mock service status data (in a real app, this would come from an API)
const serviceStatus = [
  { 
    id: "cv-service", 
    name: "CV Service", 
    status: "online", 
    description: "Computer Vision analysis service",
    icon: Activity 
  },
  { 
    id: "audio-service", 
    name: "Audio Service", 
    status: "warning", 
    description: "Voice recognition and transcription",
    icon: Mic 
  },
  { 
    id: "orchestrator", 
    name: "Orchestrator", 
    status: "online", 
    description: "Central coordination service",
    icon: PlayCircle 
  },
];

// Status indicator component
const StatusIndicator = ({ status }: { status: string }) => {
  const getStatusClass = (status: string) => {
    switch (status) {
      case "online":
        return "status-online";
      case "warning":
        return "status-warning";
      case "offline":
        return "status-offline";
      default:
        return "status-offline";
    }
  };

  return (
    <div className="flex items-center">
      <div className={`status-indicator ${getStatusClass(status)} mr-2`} />
      <span className="text-sm font-medium capitalize">{status}</span>
    </div>
  );
};

const Index = () => {
  // Mock authentication state (in a real app, this would come from auth context)
  const isAuthenticated = false;

  return (
    <AppLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor services and start AI-assisted meetings
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {serviceStatus.map((service) => (
            <Card key={service.id} className="status-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium">
                  {service.name}
                </CardTitle>
                <service.icon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-2">
                  <StatusIndicator status={service.status} />
                  <p className="text-sm text-muted-foreground">
                    {service.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="meeting-card">
            <CardHeader>
              <CardTitle>Start a Meeting</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Begin a new AI-assisted meeting with screen sharing and audio capture.
              </p>
              <Link to="/meeting">
                <Button 
                  className="meeting-button bg-meeting-primary hover:bg-meeting-primary/90 w-full"
                >
                  <Video className="h-5 w-5" />
                  Start Meeting
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="meeting-card">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {isAuthenticated ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    You haven't had any meetings yet. Start your first meeting now.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5 text-meeting-accent" />
                    <p className="text-sm">You need to login to see recent activity</p>
                  </div>
                  <Button variant="outline" className="w-full">
                    <LogIn className="h-5 w-5 mr-2" />
                    Login
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
