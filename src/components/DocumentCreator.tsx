
import React, { useState } from 'react';
import { Section, Container, Heading, Text, Button, GlassCard } from './ui-components';
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { FileText, Send, Download, Copy, Check, Loader2, ExternalLink } from 'lucide-react';
import { toast } from "@/hooks/use-toast";

interface GenerateResponse {
  success: boolean;
  download_url: string;
  filename: string;
}

const DocumentCreator: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [numPages, setNumPages] = useState(3);
  const [documentContent, setDocumentContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('create');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [filename, setFilename] = useState('');

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast({
        title: "Topic required",
        description: "Please enter a topic for your document",
        variant: "destructive"
      });
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const response = await fetch('https://docx.techrealm.online/generate-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: topic,
          num_pages: numPages
        }),
      });
      
      const data: GenerateResponse = await response.json();
      
      if (data.success) {
        // Convert download_url to HTTPS if it's HTTP
        const secureDownloadUrl = data.download_url.replace(/^http:/, 'https:');
        setDownloadUrl(secureDownloadUrl);
        setFilename(data.filename);
        setDocumentContent(`Document generated successfully!\n\nTopic: ${topic}\nPages: ${numPages}\n\nClick the Download button to get your document.`);
        setActiveTab('preview');
        
        toast({
          title: "Document Generated",
          description: "Your document has been created successfully!",
        });
      } else {
        toast({
          title: "Generation Failed",
          description: "There was an error generating your document. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error generating document:', error);
      toast({
        title: "Error",
        description: "Failed to connect to the document generation service. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!documentContent) return;
    
    navigator.clipboard.writeText(documentContent);
    setIsCopied(true);
    
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  const handleDownload = () => {
    if (downloadUrl) {
      // Create an anchor element and trigger the download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || 'document.docx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download Started",
        description: "Your document is being downloaded.",
      });
      
      // Also open the link in a new tab
      window.open(downloadUrl, '_blank');
    }
  };

  return (
    <Section className="min-h-screen pt-28 pb-16">
      <Container>
        <div className="max-w-3xl mx-auto mb-10">
          <Heading.H1 className="text-center mb-4">Document Creator</Heading.H1>
          <Text.Lead className="text-center">
            Describe the document you need, and our AI will generate it for you instantly.
          </Text.Lead>
        </div>

        <GlassCard className="max-w-4xl mx-auto overflow-hidden">
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="border-b">
              <TabsList className="w-full justify-start p-0 h-auto bg-transparent">
                <TabsTrigger 
                  value="create" 
                  className="py-3 px-5 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                >
                  Create
                </TabsTrigger>
                <TabsTrigger 
                  value="preview" 
                  className="py-3 px-5 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                  disabled={!documentContent}
                >
                  Preview
                </TabsTrigger>
              </TabsList>
            </div>
            
            <div className="p-6">
              <TabsContent value="create" className="mt-0">
                <div className="space-y-6">
                  <div>
                    <label htmlFor="document-title" className="block text-sm font-medium mb-1">
                      Document Topic
                    </label>
                    <Input 
                      id="document-title"
                      placeholder="Enter a topic for your document"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="document-description" className="block text-sm font-medium mb-1">
                      Additional Details (Optional)
                    </label>
                    <Textarea 
                      id="document-description"
                      placeholder="Add any additional details you'd like to include in the document"
                      rows={4}
                      className="w-full resize-none"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="num-pages" className="block text-sm font-medium mb-1">
                      Number of Pages
                    </label>
                    <Input 
                      id="num-pages"
                      type="number"
                      min={1}
                      max={10}
                      value={numPages}
                      onChange={(e) => setNumPages(parseInt(e.target.value) || 3)}
                      className="w-full"
                    />
                  </div>
                  
                  <Button 
                    onClick={handleGenerate} 
                    className="w-full"
                    disabled={!topic.trim() || isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Generate Document
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="preview" className="mt-0">
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <Text.Large>{topic}</Text.Large>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={handleCopy}>
                        {isCopied ? (
                          <>
                            <Check className="mr-1 h-4 w-4" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="mr-1 h-4 w-4" />
                            Copy
                          </>
                        )}
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleDownload} disabled={!downloadUrl}>
                        <Download className="mr-1 h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  </div>
                  
                  <div className="bg-muted/30 rounded-md p-4 overflow-auto max-h-96 whitespace-pre-wrap text-sm font-mono">
                    {documentContent || 'No content generated yet'}
                  </div>
                  
                  {downloadUrl && (
                    <div className="flex flex-col space-y-4 border-t pt-4 mt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-5 w-5 text-primary" />
                          <Text.Regular>{filename}</Text.Regular>
                        </div>
                        <Button size="sm" onClick={handleDownload}>
                          <Download className="mr-1 h-4 w-4" />
                          Download Document
                        </Button>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm">
                        <Text.Muted>Direct link:</Text.Muted>
                        <a 
                          href={downloadUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center"
                        >
                          {downloadUrl.split('/').pop()} 
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </GlassCard>
      </Container>
    </Section>
  );
};

export default DocumentCreator;
