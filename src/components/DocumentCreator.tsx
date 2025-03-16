
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import AuthCheck from '@/components/AuthCheck';
import { toast } from '@/hooks/use-toast';
import { Toaster } from "@/components/ui/toaster";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link2Icon, FileIcon, BookOpenIcon, AlertTriangleIcon, CheckCircle2Icon } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import SubscriptionModal from '@/components/SubscriptionModal';
import { Badge } from '@/components/ui-components';

interface GenerateDocumentResponse {
  success: boolean;
  download_url: string;
  filename: string;
}

const TRIAL_USED_KEY = 'document_trial_used';

const DocumentCreator = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [numPages, setNumPages] = useState(3);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [freeTrialUsed, setFreeTrialUsed] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Check user subscription status on component mount
  useEffect(() => {
    const checkUserStatus = async () => {
      // Get the current user
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.id) {
        setUserId(session.user.id);
        setIsAuthenticated(true);
        
        // First check localStorage for a quick response
        const localTrialUsed = localStorage.getItem(`${TRIAL_USED_KEY}_${session.user.id}`);
        if (localTrialUsed === 'true') {
          setFreeTrialUsed(true);
        }
        
        // Then check Supabase for the accurate status
        try {
          const { data, error } = await supabase
            .from('user_subscriptions')
            .select('free_trial_used, is_subscribed')
            .eq('user_id', session.user.id)
            .maybeSingle();
          
          if (error) {
            console.error('Error fetching subscription status:', error);
            return;
          }
          
          if (data) {
            setFreeTrialUsed(data.free_trial_used || false);
            setIsSubscribed(data.is_subscribed || false);
            
            // Update localStorage to match the database
            localStorage.setItem(`${TRIAL_USED_KEY}_${session.user.id}`, data.free_trial_used ? 'true' : 'false');
          }
        } catch (error) {
          console.error('Error in subscription status check:', error);
        }
      } else {
        // For unauthenticated users
        setUserId(null);
        setIsAuthenticated(false);
      }
    };
    
    checkUserStatus();
  }, []);

  const updateTrialUsage = async () => {
    if (!userId) return;
    
    try {
      // Call Supabase Edge Function to update user subscription
      const { data, error } = await supabase.functions.invoke('update-document-usage', {
        body: { user_id: userId, count: 1 }
      });
      
      if (error) {
        console.error('Error updating trial usage:', error);
        return;
      }
      
      // Update local state and localStorage
      setFreeTrialUsed(true);
      localStorage.setItem(`${TRIAL_USED_KEY}_${userId}`, 'true');
      
    } catch (error) {
      console.error('Error in updateTrialUsage:', error);
    }
  };

  const generateDocument = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to generate documents.",
        variant: "destructive",
      });
      return;
    }

    if (!prompt) {
      toast({
        title: "Please enter a topic",
        description: "You must enter a topic to generate a document.",
        variant: "destructive",
      });
      return;
    }

    // Check if user has used their free trial and is not subscribed
    if (freeTrialUsed && !isSubscribed && userId) {
      setShowSubscriptionModal(true);
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
        // Ensure the download URL has the correct protocol
        let formattedUrl = data.download_url;
        if (formattedUrl.startsWith('http://')) {
          formattedUrl = formattedUrl.replace('http://', 'https://');
        }
        
        setDocumentUrl(formattedUrl);
        setFilename(data.filename);
        
        // Update trial usage in database if this is the first time
        if (!freeTrialUsed && userId) {
          await updateTrialUsage();
        }
        
        toast({
          title: "Document Generated",
          description: "Your document has been successfully generated.",
          variant: "default",
        });
      } else {
        throw new Error("Failed to generate document");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadDocument = () => {
    if (documentUrl) {
      window.open(documentUrl, '_blank');
    }
  };

  const handlePayment = async () => {
    setIsProcessingPayment(true);
    
    // Mock payment process - in a real app this would redirect to a payment gateway
    setTimeout(() => {
      toast({
        title: "Subscription Required",
        description: "This is a demo. In a real app, you would be redirected to a payment gateway.",
      });
      setIsProcessingPayment(false);
      setShowSubscriptionModal(false);
    }, 2000);
  };

  const closeSubscriptionModal = () => {
    setShowSubscriptionModal(false);
  };

  const handleSignIn = () => {
    navigate('/auth', { state: { returnUrl: '/create' } });
  };

  // Show trial status
  const renderTrialStatus = () => {
    if (!isAuthenticated) {
      return (
        <Alert variant="default" className="mb-4 bg-primary/10 border-primary/20">
          <AlertTriangleIcon className="h-4 w-4 text-primary" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            Sign in to generate documents. New users get one free document.
          </AlertDescription>
          <Button onClick={handleSignIn} size="sm" className="mt-2">
            Sign In Now
          </Button>
        </Alert>
      );
    }
    
    if (isSubscribed) {
      return (
        <Alert variant="default" className="mb-4 bg-green-500/10 border-green-500/20">
          <CheckCircle2Icon className="h-4 w-4 text-green-500" />
          <AlertTitle>Premium Account</AlertTitle>
          <AlertDescription>
            You have unlimited document generation with your premium subscription.
          </AlertDescription>
        </Alert>
      );
    }
    
    if (freeTrialUsed) {
      return (
        <Alert variant="default" className="mb-4 bg-orange-500/10 border-orange-500/20">
          <AlertTriangleIcon className="h-4 w-4 text-orange-500" />
          <AlertTitle>Free Trial Used</AlertTitle>
          <AlertDescription>
            You've used your free document generation. Upgrade for unlimited access.
            <Button 
              onClick={() => setShowSubscriptionModal(true)} 
              size="sm" 
              className="mt-2 bg-orange-500 hover:bg-orange-600"
            >
              Upgrade Now
            </Button>
          </AlertDescription>
        </Alert>
      );
    }
    
    return (
      <Alert variant="default" className="mb-4 bg-blue-500/10 border-blue-500/20">
        <BookOpenIcon className="h-4 w-4 text-blue-500" />
        <AlertTitle>Free Trial Available</AlertTitle>
        <AlertDescription>
          You can generate one document for free. Upgrade for unlimited access.
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <div className="container relative py-8">
      <div className="mx-auto w-full max-w-2xl lg:max-w-4xl">
        {renderTrialStatus()}
        
        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <FileIcon className="h-5 w-5 text-primary" />
                  <span>Document Creator</span>
                </CardTitle>
                <CardDescription>Enter a topic to generate a professional document.</CardDescription>
              </div>
              {!isAuthenticated ? null : (
                freeTrialUsed && !isSubscribed ? (
                  <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/30">
                    Trial Used
                  </Badge>
                ) : isSubscribed ? (
                  <Badge className="bg-green-500 hover:bg-green-600">
                    Premium
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">
                    Free Trial
                  </Badge>
                )
              )}
            </div>
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
                  className="min-h-24 resize-none"
                />
              </div>
              <div className="grid gap-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="numPages">Number of Pages</Label>
                  <span className="text-sm font-medium">{numPages}</span>
                </div>
                <Slider
                  id="numPages"
                  defaultValue={[numPages]}
                  min={1}
                  max={10}
                  step={1}
                  onValueChange={(value) => setNumPages(value[0])}
                  className="py-2"
                />
                <p className="text-sm text-muted-foreground">
                  Adjust the number of pages for your document (1-10).
                </p>
              </div>
              <Button 
                type="submit" 
                disabled={isLoading || (!isAuthenticated && userId !== null)} 
                className="mt-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
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
            <CardTitle className="flex items-center space-x-2">
              <BookOpenIcon className="h-5 w-5 text-primary" />
              <span>Generated Document</span>
            </CardTitle>
            <CardDescription>Your document will appear here when ready.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {documentUrl ? (
              <div className="space-y-4">
                <Alert className="bg-green-50 dark:bg-green-950/10 border-green-100 dark:border-green-900/30">
                  <CheckCircle2Icon className="h-4 w-4 text-green-500" />
                  <AlertTitle>Document Ready</AlertTitle>
                  <AlertDescription className="flex flex-col gap-2">
                    <p>Your document <strong>{filename}</strong> has been generated successfully!</p>
                    <div className="flex items-center gap-2 text-primary">
                      <Link2Icon size={16} />
                      <a 
                        href={documentUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:underline break-all"
                      >
                        {documentUrl}
                      </a>
                    </div>
                    <Button 
                      onClick={downloadDocument} 
                      className="mt-2 w-full sm:w-auto"
                    >
                      <FileIcon className="mr-2 h-4 w-4" />
                      Download Document
                    </Button>
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <div className="min-h-[200px] flex items-center justify-center border border-dashed rounded-md">
                <div className="text-center p-6">
                  <FileIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">Your generated document will appear here</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {isAuthenticated === false 
                      ? "Please sign in to generate documents" 
                      : "Enter a topic and click 'Generate Document'"}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <SubscriptionModal 
        isOpen={showSubscriptionModal}
        onClose={closeSubscriptionModal}
        onPayment={handlePayment}
        isProcessing={isProcessingPayment}
      />
      <Toaster />
    </div>
  );
};

export default DocumentCreator;
