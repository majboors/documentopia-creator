
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompletion } from 'ai/react';
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

const DocumentCreator = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [temperature, setTemperature] = useState(0.5);
  const [contextEnabled, setContextEnabled] = useState(true);
  const [selectedFramework, setSelectedFramework] = useState("React");
  const { completion, complete, setCompletion } = useCompletion({
    api: '/api/completion',
  });

  const handleSignIn = () => {
    navigate('/auth', { state: { returnUrl: '/create' } });
  };

  const generateDocument = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!prompt) {
      toast({
        title: "Please enter a prompt",
        description: "You must enter a prompt to generate a document.",
        variant: "destructive",
      })
      return;
    }

    setIsLoading(true);
    setCompletion("")

    try {
      // Pass the prompt as the first parameter
      // For custom data, use the second parameter which should be a body object
      // that gets passed directly to the API endpoint
      await complete(prompt, {
        body: {
          temperature,
          framework: selectedFramework,
          context: contextEnabled,
        },
      });
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

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(completion).then(() => {
      toast({
        description: "Copied to clipboard",
      })
    });
  }, [completion]);

  return (
    <div className="container relative py-8">
      <div className="mx-auto w-full max-w-2xl lg:max-w-4xl">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Document Creator</CardTitle>
            <CardDescription>Enter a prompt to generate a document.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <form onSubmit={generateDocument} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="prompt">Prompt</Label>
                <Textarea
                  id="prompt"
                  placeholder="Write a prompt for the document you want to generate..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="contextEnabled">Enable Context</Label>
                <Switch
                  id="contextEnabled"
                  checked={contextEnabled}
                  onCheckedChange={(checked) => setContextEnabled(checked)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="temperature">Temperature</Label>
                <Slider
                  id="temperature"
                  defaultValue={[temperature * 100]}
                  max={100}
                  step={1}
                  onValueChange={(value) => setTemperature(value[0] / 100)}
                />
                <p className="text-sm text-muted-foreground">
                  Adjust the temperature of the model. Lower values will result in more
                  predictable results, while higher values will result in more creative
                  results.
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="framework">Framework</Label>
                <Select onValueChange={(value) => setSelectedFramework(value)}>
                  <SelectTrigger id="framework">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="React">React</SelectItem>
                    <SelectItem value="Vue">Vue</SelectItem>
                    <SelectItem value="Angular">Angular</SelectItem>
                    <SelectItem value="Svelte">Svelte</SelectItem>
                  </SelectContent>
                </Select>
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
                  "Generate"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card className="w-full mt-4">
          <CardHeader>
            <CardTitle>Result</CardTitle>
            <CardDescription>Here is the generated document.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <AuthCheck allowTrial={true}>
              <Textarea
                id="result"
                placeholder="Your generated document will appear here..."
                value={completion}
                readOnly
                className="min-h-[300px] resize-none"
              />
            </AuthCheck>
          </CardContent>
          <CardFooter>
            <Button onClick={copyToClipboard}>Copy to clipboard</Button>
          </CardFooter>
        </Card>
      </div>
      <Toaster />
    </div>
  );
};

export default DocumentCreator;
