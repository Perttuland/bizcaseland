import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useBusinessData } from "@/contexts/BusinessDataContext";
import { JSONTemplate } from "./JSONTemplate";
import { DatapointsViewer } from "./DatapointsViewer";
import { BusinessCaseAnalysis } from "./BusinessCaseAnalysis";

export function BusinessCaseAnalyzer() {
  const [jsonInput, setJsonInput] = useState('');
  const [activeTab, setActiveTab] = useState('input');
  const { toast } = useToast();
  const { data, updateData } = useBusinessData();

  const handleJsonUpload = (value: string) => {
    try {
      const parsed = JSON.parse(value);
      
      // Validate required structure
      if (!parsed.meta || !parsed.assumptions) {
        throw new Error('Invalid JSON structure: missing meta or assumptions');
      }
      
      updateData(parsed);
      setActiveTab('datapoints');
      toast({
        title: "JSON uploaded successfully",
        description: "Data has been loaded into the system.",
      });
    } catch (error) {
      toast({
        title: "Invalid JSON",
        description: error instanceof Error ? error.message : "Please check your JSON format.",
        variant: "destructive"
      });
    }
  };

  const copyTemplate = () => {
    navigator.clipboard.writeText(JSONTemplate);
    toast({
      title: "Template copied",
      description: "JSON template has been copied to clipboard.",
    });
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Input Panel */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  JSON Upload
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Paste your business case JSON:</label>
                  <Textarea
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    placeholder="Paste JSON here..."
                    className="min-h-[300px] font-mono text-xs"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleJsonUpload(jsonInput)}
                    className="flex-1"
                    disabled={!jsonInput.trim()}
                  >
                    Upload JSON
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={copyTemplate}
                    className="flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Template
                  </Button>
                </div>

                {/* Navigation */}
                <div className="space-y-2 pt-4 border-t">
                  <Button
                    variant={activeTab === 'datapoints' ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setActiveTab('datapoints')}
                    disabled={!data}
                  >
                    Datapoints & Assumptions
                  </Button>
                  <Button
                    variant={activeTab === 'analysis' ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setActiveTab('analysis')}
                    disabled={!data}
                  >
                    Business Case Analysis
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content Panel */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardContent className="p-6">
                {!data && activeTab !== 'input' ? (
                  <div className="flex items-center justify-center h-96 text-muted-foreground">
                    <div className="text-center">
                      <p className="text-lg mb-2">No data loaded</p>
                      <p className="text-sm">Please upload a JSON file first</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {activeTab === 'datapoints' && data && <DatapointsViewer />}
                    {activeTab === 'analysis' && data && <BusinessCaseAnalysis />}
                    {activeTab === 'input' && (
                      <div className="space-y-6">
                        <div>
                          <h2 className="text-2xl font-bold mb-4">Business Case Analyzer</h2>
                          <p className="text-muted-foreground mb-6">
                            Upload your business case JSON to analyze datapoints and run financial projections.
                          </p>
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-semibold mb-3">JSON Template</h3>
                          <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-96">
                            {JSONTemplate}
                          </pre>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}