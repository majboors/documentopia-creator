
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link2Icon } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import SubscriptionModal from '@/components/SubscriptionModal';

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

  // Check user subscription status on component mount
  useEffect(() => {
    const checkUserStatus = async () => {
      // Get the current user
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.id) {
        setUserId(session.user.id);
        
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
        // For unauthenticated users, we'll rely on the AuthCheck component
        setUserId(null);
      }
    };
    
    checkUserStatus();
  }, []);

  const handleSignIn = () => {
    navigate('/auth', { state: { returnUrl: '/create' } });
  };

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
                          className="hover:underline break-all"
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
