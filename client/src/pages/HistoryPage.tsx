
import React, { useState } from "react";
import { AppLayout } from "@/components/layouts/AppLayout";
import { 
  Calendar, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Download, 
  CheckSquare, 
  Search 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

// Mock meeting history data
const meetingHistory = [
  {
    id: 1,
    title: "Project Kickoff Meeting",
    date: "2025-04-15",
    duration: "45 minutes",
    summary: "Discussed project timeline, assigned initial tasks, and set up weekly check-ins.",
    tasks: [
      { id: 1, text: "Create wireframes by April 20", completed: true },
      { id: 2, text: "Set up development environment", completed: false },
      { id: 3, text: "Schedule design review", completed: false }
    ],
    transcript: "This is a sample transcript text for the project kickoff meeting..."
  },
  {
    id: 2,
    title: "Brainstorming Session",
    date: "2025-04-12",
    duration: "30 minutes",
    summary: "Generated ideas for the new feature set. Prioritized top 3 features for the next sprint.",
    tasks: [
      { id: 1, text: "Document feature ideas", completed: true },
      { id: 2, text: "Get feedback from stakeholders", completed: true }
    ],
    transcript: "This is a sample transcript text for the brainstorming session..."
  },
  {
    id: 3,
    title: "Client Status Update",
    date: "2025-04-10",
    duration: "60 minutes",
    summary: "Presented progress to the client. Addressed concerns about timeline. Received positive feedback on UI design.",
    tasks: [
      { id: 1, text: "Update timeline document", completed: false },
      { id: 2, text: "Send follow-up email", completed: true },
      { id: 3, text: "Schedule next review", completed: false }
    ],
    transcript: "This is a sample transcript text for the client status update..."
  }
];

const HistoryPage = () => {
  const [expandedMeeting, setExpandedMeeting] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const toggleMeetingExpansion = (id: number) => {
    setExpandedMeeting(expandedMeeting === id ? null : id);
  };
  
  const downloadTranscript = (id: number, format: 'txt' | 'docx') => {
    // In a real implementation, this would generate and download a file
    const meeting = meetingHistory.find(m => m.id === id);
    
    toast({
      title: `Downloading transcript as ${format.toUpperCase()}`,
      description: `${meeting?.title} transcript is being downloaded`
    });
  };
  
  const toggleTaskCompletion = (meetingId: number, taskId: number) => {
    // In a real implementation, this would update the task status in the database
    toast({
      title: "Task status updated",
      description: "The task status has been updated"
    });
  };
  
  const filteredMeetings = meetingHistory.filter(meeting => 
    meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    meeting.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Meeting History</h1>
          <p className="text-muted-foreground">
            View summaries and tasks from previous meetings
          </p>
        </div>

        <div className="flex items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search meetings..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-4">
          {filteredMeetings.length > 0 ? (
            filteredMeetings.map((meeting) => (
              <Card key={meeting.id} className="overflow-hidden">
                <CardHeader className="bg-card py-4 cursor-pointer" onClick={() => toggleMeetingExpansion(meeting.id)}>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{meeting.title}</CardTitle>
                    {expandedMeeting === meeting.id ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground mt-1 space-x-4">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {meeting.date}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {meeting.duration}
                    </div>
                  </div>
                </CardHeader>
                
                {expandedMeeting === meeting.id && (
                  <CardContent className="pt-4">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-2">Summary</h3>
                        <p className="text-muted-foreground">{meeting.summary}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium mb-2">Tasks</h3>
                        <ul className="space-y-2">
                          {meeting.tasks.map((task) => (
                            <li key={task.id} className="flex items-start">
                              <div 
                                className={`p-1 rounded-md mt-0.5 mr-2 cursor-pointer ${task.completed ? 'text-meeting-secondary' : 'text-muted-foreground'}`}
                                onClick={() => toggleTaskCompletion(meeting.id, task.id)}
                              >
                                <CheckSquare className="h-5 w-5" />
                              </div>
                              <span className={task.completed ? 'line-through text-muted-foreground' : ''}>{task.text}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="flex space-x-3">
                        <Button variant="outline" size="sm" onClick={() => downloadTranscript(meeting.id, 'txt')}>
                          <Download className="h-4 w-4 mr-2" />
                          Download as TXT
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => downloadTranscript(meeting.id, 'docx')}>
                          <Download className="h-4 w-4 mr-2" />
                          Download as DOCX
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full p-3 bg-muted">
                  <Calendar className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-medium">No meetings found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery ? "Try a different search term" : "You haven't had any meetings yet"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default HistoryPage;
