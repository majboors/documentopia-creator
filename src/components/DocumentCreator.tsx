
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import AuthCheck from '@/components/AuthCheck';
import { toast } from '@/hooks/use-toast';
import { Toaster } from "@/components/ui/toaster";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link2Icon } from "lucide-react";

interface GenerateDocumentResponse {
  success: boolean;
  download_url: string;
  filename: string;
}

const DocumentCreator = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [numPages, setNumPages] = useState(3);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);

  const handleSignIn = () => {
    navigate('/auth', { state: { returnUrl: '/create' } });
  };

  const generateDocument = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!prompt) {
      toast({
        title: "Please enter a topic",
        description: "You must enter a topic to generate a document.",
        variant: "destructive",
      })
      return;
    }

    setIsLoading(true);
    setDocumentUrl(null);
    setFilename(null);

    try {
      const response = await fetch('https://docx.techrealm.online/generate-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: prompt,
          num_pages: numPages
        }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }

      const data: GenerateDocumentResponse = await response.json();
      
      if (data.success) {
        setDocumentUrl(data.download_url);
        setFilename(data.filename);
        toast({
          title: "Document Generated",
          description: "Your document has been successfully generated.",
        });
      } else {
        throw new Error("Failed to generate document");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false);
    }
  };

  const downloadDocument = () => {
    if (documentUrl) {
      window.open(documentUrl, '_blank');
    }
  };

  return (
    <div className="container relative py-8">
      <div className="mx-auto w-full max-w-2xl lg:max-w-4xl">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Document Creator</CardTitle>
            <CardDescription>Enter a topic to generate a professional document.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <form onSubmit={generateDocument} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="prompt">Topic</Label>
                <Textarea
                  id="prompt"
                  placeholder="Enter the topic for your document..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="numPages">Number of Pages: {numPages}</Label>
                <Slider
                  id="numPages"
                  defaultValue={[numPages]}
                  min={1}
                  max={10}
                  step={1}
                  onValueChange={(value) => setNumPages(value[0])}
                />
                <p className="text-sm text-muted-foreground">
                  Adjust the number of pages for your document (1-10).
                </p>
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    Generating...
                    <svg className="animate-spin ml-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </>
                ) : (
                  "Generate Document"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card className="w-full mt-4">
          <CardHeader>
            <CardTitle>Generated Document</CardTitle>
            <CardDescription>Your document will appear here when ready.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <AuthCheck allowTrial={true}>
              {documentUrl ? (
                <div className="space-y-4">
                  <Alert>
                    <AlertDescription className="flex flex-col gap-2">
                      <p>Your document <strong>{filename}</strong> has been generated successfully!</p>
                      <div className="flex items-center gap-2 text-primary">
                        <Link2Icon size={16} />
                        <a 
                          href={documentUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {documentUrl}
                        </a>
                      </div>
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <div className="min-h-[200px] flex items-center justify-center border border-dashed rounded-md">
                  <p className="text-muted-foreground">Your generated document will appear here...</p>
                </div>
              )}
            </AuthCheck>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={downloadDocument} 
              disabled={!documentUrl}
            >
              Download Document
            </Button>
          </CardFooter>
        </Card>
      </div>
      <Toaster />
    </div>
  );
};

export default DocumentCreator;
