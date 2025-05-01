
import React, { useState } from "react";
import { AppLayout } from "@/components/layouts/AppLayout";
import { Save, Copy, Eye, EyeOff, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const SettingsPage = () => {
  // Detection settings
  const [ssimThreshold, setSsimThreshold] = useState(0.85);
  const [frameCooldown, setFrameCooldown] = useState(3);
  const [fullRefresh, setFullRefresh] = useState(20);
  
  // API settings
  const [apiUrl, setApiUrl] = useState("https://api.aimeetingassistant.com");
  const [apiKey, setApiKey] = useState("sk_123456789abcdef");
  const [pyannoteToken, setPyannoteToken] = useState("hf_123456789abcdef");
  
  // Password visibility
  const [showApiKey, setShowApiKey] = useState(false);
  const [showPyannoteToken, setShowPyannoteToken] = useState(false);
  
  const saveSettings = () => {
    // In a real implementation, this would save to localStorage or backend
    toast({
      title: "Settings saved",
      description: "Your settings have been updated successfully"
    });
  };
  
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: `${label} has been copied to your clipboard`
    });
  };

  return (
    <AppLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Configure detection thresholds and API credentials
          </p>
        </div>

        <Tabs defaultValue="detection">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="detection">Detection Settings</TabsTrigger>
            <TabsTrigger value="api">API Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="detection" className="mt-4 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Detection Thresholds</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Label htmlFor="ssim-threshold">SSIM Threshold</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 ml-1">
                              <Info className="h-4 w-4" />
                              <span className="sr-only">SSIM Info</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              Structural Similarity Index. Higher values mean more similar frames 
                              will be treated as duplicates. Range: 0.0 to 1.0
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <span className="text-sm font-mono">{ssimThreshold.toFixed(2)}</span>
                  </div>
                  <Slider 
                    id="ssim-threshold"
                    defaultValue={[ssimThreshold]} 
                    max={1} 
                    min={0.5} 
                    step={0.01} 
                    onValueChange={(values) => setSsimThreshold(values[0])}
                  />
                  <p className="text-xs text-muted-foreground">
                    Determines how similar two frames must be to be considered identical
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Label htmlFor="frame-cooldown">Frame Cooldown</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 ml-1">
                              <Info className="h-4 w-4" />
                              <span className="sr-only">Frame Cooldown Info</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              Number of frames to wait before processing a new frame
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <span className="text-sm font-mono">{frameCooldown} frames</span>
                  </div>
                  <Slider 
                    id="frame-cooldown"
                    defaultValue={[frameCooldown]} 
                    max={10} 
                    min={1} 
                    step={1}
                    onValueChange={(values) => setFrameCooldown(values[0])}
                  />
                  <p className="text-xs text-muted-foreground">
                    Controls processing frequency (higher values = less CPU usage)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Label htmlFor="full-refresh">Full Refresh Rate</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 ml-1">
                              <Info className="h-4 w-4" />
                              <span className="sr-only">Full Refresh Info</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              Number of processed frames before forcing a full analysis
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <span className="text-sm font-mono">{fullRefresh} frames</span>
                  </div>
                  <Slider 
                    id="full-refresh"
                    defaultValue={[fullRefresh]} 
                    max={50} 
                    min={5} 
                    step={5}
                    onValueChange={(values) => setFullRefresh(values[0])}
                  />
                  <p className="text-xs text-muted-foreground">
                    How often to run complete analysis on frames regardless of similarity
                  </p>
                </div>
                
                <Button onClick={saveSettings} className="mt-6 w-full bg-meeting-primary hover:bg-meeting-primary/90">
                  <Save className="h-4 w-4 mr-2" />
                  Save Detection Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="api" className="mt-4 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>API Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="api-url">API URL</Label>
                  <div className="flex">
                    <Input 
                      id="api-url" 
                      value={apiUrl} 
                      onChange={(e) => setApiUrl(e.target.value)}
                    />
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="ml-2"
                      onClick={() => copyToClipboard(apiUrl, "API URL")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="api-key">API Key</Label>
                  <div className="flex">
                    <div className="relative flex-1">
                      <Input 
                        id="api-key" 
                        type={showApiKey ? "text" : "password"} 
                        value={apiKey} 
                        onChange={(e) => setApiKey(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showApiKey ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="ml-2"
                      onClick={() => copyToClipboard(apiKey, "API Key")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pyannote-token">Pyannote Token</Label>
                  <div className="flex">
                    <div className="relative flex-1">
                      <Input 
                        id="pyannote-token" 
                        type={showPyannoteToken ? "text" : "password"} 
                        value={pyannoteToken} 
                        onChange={(e) => setPyannoteToken(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPyannoteToken(!showPyannoteToken)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPyannoteToken ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="ml-2"
                      onClick={() => copyToClipboard(pyannoteToken, "Pyannote Token")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Hugging Face token with access to Pyannote models
                  </p>
                </div>
                
                <Button onClick={saveSettings} className="mt-6 w-full bg-meeting-primary hover:bg-meeting-primary/90">
                  <Save className="h-4 w-4 mr-2" />
                  Save API Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
