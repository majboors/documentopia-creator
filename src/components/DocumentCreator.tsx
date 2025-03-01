
import React, { useState } from 'react';
import { Section, Container, Heading, Text, Button, GlassCard } from './ui-components';
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { FileText, Send, Download, Copy, Check } from 'lucide-react';

const DocumentCreator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [documentContent, setDocumentContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('create');

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    
    // Simulate AI generation
    setTimeout(() => {
      setDocumentContent(
        `# ${prompt}\n\n## Introduction\nThis is a sample document generated based on your request: "${prompt}". In a real implementation, this would be created by an AI model that understands your specific requirements and generates appropriate content.\n\n## Key Points\n- Professional formatting applied automatically\n- Content structured for readability\n- Key information highlighted appropriately\n- Conclusions and next steps clearly outlined\n\n## Conclusion\nThe AI has analyzed your request and created this document structure to match your needs. In a production environment, this would be much more detailed and specifically tailored to your exact requirements.`
      );
      setIsGenerating(false);
      setActiveTab('preview');
    }, 1500);
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
    if (!documentContent) return;
    
    const blob = new Blob([documentContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${prompt.substring(0, 30)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
                      Document Title
                    </label>
                    <Input 
                      id="document-title"
                      placeholder="Enter a title for your document"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="document-description" className="block text-sm font-medium mb-1">
                      Document Description
                    </label>
                    <Textarea 
                      id="document-description"
                      placeholder="Describe what you want in your document. The more details you provide, the better the result will be."
                      rows={6}
                      className="w-full resize-none"
                    />
                  </div>
                  
                  <Button 
                    onClick={handleGenerate} 
                    className="w-full"
                    disabled={!prompt.trim() || isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <span className="mr-2">Generating...</span>
                        <div className="h-4 w-4 rounded-full border-2 border-current border-r-transparent animate-spin" />
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
                    <Text.Large>{prompt}</Text.Large>
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
                      <Button variant="outline" size="sm" onClick={handleDownload}>
                        <Download className="mr-1 h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  </div>
                  
                  <div className="bg-muted/30 rounded-md p-4 overflow-auto max-h-96 whitespace-pre-wrap text-sm font-mono">
                    {documentContent || 'No content generated yet'}
                  </div>
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
