import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { toast } from '@/hooks/use-toast';
import { Toaster } from "@/components/ui/toaster";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link2Icon, FileIcon, BookOpenIcon, AlertTriangleIcon, CheckCircle2Icon, Loader2Icon } from "lucide-react";
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
  const [checkingAuthStatus, setCheckingAuthStatus] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [authCheckTimeout, setAuthCheckTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const checkUserStatus = async () => {
      if (!isMounted) return;
      
      setCheckingAuthStatus(true);
      
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          if (isMounted) {
            setIsAuthenticated(false);
            setCheckingAuthStatus(false);
          }
          return;
        }
        
        if (data.session?.user?.id) {
          if (isMounted) {
            setUserId(data.session.user.id);
            setIsAuthenticated(true);
          }
          
          const localTrialUsed = localStorage.getItem(`${TRIAL_USED_KEY}_${data.session.user.id}`);
          if (localTrialUsed === 'true' && isMounted) {
            setFreeTrialUsed(true);
          }
          
          try {
            const { data: subscriptionData, error } = await supabase
              .from('user_subscriptions')
              .select('free_trial_used, is_subscribed')
              .eq('user_id', data.session.user.id)
              .maybeSingle();
            
            if (error) {
              console.error('Error fetching subscription status:', error);
            } else if (subscriptionData && isMounted) {
              setFreeTrialUsed(subscriptionData.free_trial_used || false);
              setIsSubscribed(subscriptionData.is_subscribed || false);
              
              localStorage.setItem(
                `${TRIAL_USED_KEY}_${data.session.user.id}`, 
                subscriptionData.free_trial_used ? 'true' : 'false'
              );
            } else if (isMounted) {
              const { error: insertError } = await supabase
                .from('user_subscriptions')
                .insert({
                  user_id: data.session.user.id,
                  is_subscribed: false,
                  free_trial_used: false
                });
                
              if (insertError) {
                console.error('Error creating user subscription record:', insertError);
              }
            }
          } catch (error) {
            console.error('Error in subscription status check:', error);
          }
        } else if (isMounted) {
          setUserId(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error in checkUserStatus:', error);
        if (isMounted) {
          setIsAuthenticated(false);
        }
      } finally {
        if (isMounted) {
          setCheckingAuthStatus(false);
        }
      }
    };
    
    const timeout = setTimeout(() => {
      if (isMounted && checkingAuthStatus) {
        console.log('Auth check timeout reached, clearing stuck state');
        setCheckingAuthStatus(false);
        setIsAuthenticated(false);
      }
    }, 5000);
    
    setAuthCheckTimeout(timeout);
    
    checkUserStatus();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (!isMounted) return;
        
        if (event === 'SIGNED_OUT') {
          setIsAuthenticated(false);
          setUserId(null);
          setFreeTrialUsed(false);
          setIsSubscribed(false);
          setCheckingAuthStatus(false);
        } else if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
          setIsAuthenticated(true);
          setUserId(session.user.id);
          
          try {
            const { data, error } = await supabase
              .from('user_subscriptions')
              .select('free_trial_used, is_subscribed')
              .eq('user_id', session.user.id)
              .maybeSingle();
            
            if (error) {
              console.error('Error fetching subscription status after auth change:', error);
            } else if (data) {
              setFreeTrialUsed(data.free_trial_used || false);
              setIsSubscribed(data.is_subscribed || false);
              localStorage.setItem(`${TRIAL_USED_KEY}_${session.user.id}`, data.free_trial_used ? 'true' : 'false');
            } else {
              const { error: insertError } = await supabase
                .from('user_subscriptions')
                .insert({
                  user_id: session.user.id,
                  is_subscribed: false,
                  free_trial_used: false
                });
                
              if (insertError) {
                console.error('Error creating user subscription record after auth change:', insertError);
              }
            }
          } catch (error) {
            console.error('Error checking subscription after auth change:', error);
          } finally {
            setCheckingAuthStatus(false);
          }
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      if (authCheckTimeout) {
        clearTimeout(authCheckTimeout);
      }
    };
  }, []);

  const canGenerateDocument = () => {
    if (!isAuthenticated) return false;
    if (isSubscribed) return true;
    return !freeTrialUsed;
  };

  const updateTrialUsage = async () => {
    if (!userId) return false;
    
    try {
      setFreeTrialUsed(true);
      localStorage.setItem(`${TRIAL_USED_KEY}_${userId}`, 'true');
      
      const { data, error } = await supabase.functions.invoke('update-document-usage', {
        body: { user_id: userId, count: 1 }
      });
      
      if (error) {
        console.error('Error updating trial usage:', error);
        return false;
      }
      
      console.log('Trial usage updated successfully:', data);
      return true;
    } catch (error) {
      console.error('Error in updateTrialUsage:', error);
      return false;
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
      navigate('/auth', { state: { returnUrl: '/create' } });
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

    if (isGenerating) {
      toast({
        title: "Already in progress",
        description: "Please wait for the current document to finish generating.",
        variant: "destructive",
      });
      return;
    }

    if (freeTrialUsed && !isSubscribed && userId) {
      setShowSubscriptionModal(true);
      return;
    }

    setIsLoading(true);
    setIsGenerating(true);
    setDocumentUrl(null);
    setFilename(null);

    try {
      if (!isSubscribed && !freeTrialUsed && userId) {
        const updateSuccess = await updateTrialUsage();
        
        if (!updateSuccess) {
          throw new Error("Failed to update trial usage. Please try again.");
        }
      }
      
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
        let formattedUrl = data.download_url;
        if (formattedUrl.startsWith('http://')) {
          formattedUrl = formattedUrl.replace('http://', 'https://');
        }
        
        setDocumentUrl(formattedUrl);
        setFilename(data.filename);
        
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
      
      if (!isSubscribed && userId) {
        toast({
          title: "Free Trial Status",
          description: "Your free trial has been marked as used. Contact support if you need assistance.",
          variant: "default",
        });
      }
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
    }
  };

  const downloadDocument = () => {
    if (documentUrl) {
      window.open(documentUrl, '_blank');
    }
  };

  const handlePayment = () => {
    setIsProcessingPayment(true);
    
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

  const renderTrialStatus = () => {
    if (checkingAuthStatus) {
      return (
        <Alert variant="default" className="mb-4 bg-muted/30 border-muted/40">
          <Loader2Icon className="h-4 w-4 animate-spin text-muted-foreground" />
          <AlertTitle>Checking status...</AlertTitle>
          <AlertDescription>
            Verifying your account status.
          </AlertDescription>
        </Alert>
      );
    }
    
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
          <AlertDescription className="flex flex-col">
            <span>You've used your free document generation. Upgrade for unlimited access.</span>
            <Button 
              onClick={() => setShowSubscriptionModal(true)} 
              size="sm" 
              className="mt-2 bg-orange-500 hover:bg-orange-600 w-full sm:w-auto"
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
    <div className="container relative py-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
      <div className="mx-auto w-full max-w-2xl lg:max-w-4xl">
        {renderTrialStatus()}
        
        <Card className="w-full shadow-md mb-6">
          <CardHeader className="border-b bg-card/50">
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
          <CardContent className="grid gap-4 pt-6">
            <form onSubmit={generateDocument} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="prompt" className="flex items-center justify-between">
                  <span>Topic</span>
                  <span className="text-xs text-muted-foreground">
                    {prompt.length > 0 ? `${prompt.length} characters` : 'Enter topic details'}
                  </span>
                </Label>
                <Textarea
                  id="prompt"
                  placeholder="Enter the topic for your document..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={isGenerating}
                  className="min-h-24 resize-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
              <div className="grid gap-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="numPages">Number of Pages</Label>
                  <span className="text-sm font-medium bg-primary/10 px-2 py-0.5 rounded-md">{numPages}</span>
                </div>
                <Slider
                  id="numPages"
                  defaultValue={[numPages]}
                  min={1}
                  max={10}
                  step={1}
                  onValueChange={(value) => setNumPages(value[0])}
                  disabled={isGenerating}
                  className="py-2"
                />
                <p className="text-xs text-muted-foreground">
                  Adjust the number of pages for your document (1-10).
                </p>
              </div>
              <Button 
                type="submit" 
                disabled={isLoading || isGenerating || !isAuthenticated || (freeTrialUsed && !isSubscribed)}
                className="mt-2 relative overflow-hidden group"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <Loader2Icon className="animate-spin mr-2 h-4 w-4" />
                    Generating...
                  </span>
                ) : freeTrialUsed && !isSubscribed ? (
                  <span className="flex items-center justify-center">
                    <AlertTriangleIcon className="mr-2 h-4 w-4" />
                    Upgrade to Generate
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <FileIcon className="mr-2 h-4 w-4" />
                    Generate Document
                  </span>
                )}
                {!isLoading && canGenerateDocument() && (
                  <span className="absolute inset-0 w-0 bg-white/20 transition-all duration-300 group-hover:w-full"></span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <Card className="w-full shadow-md overflow-hidden">
          <CardHeader className="border-b bg-card/50">
            <CardTitle className="flex items-center space-x-2">
              <BookOpenIcon className="h-5 w-5 text-primary" />
              <span>Generated Document</span>
            </CardTitle>
            <CardDescription>Your document will appear here when ready.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {documentUrl ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <Alert className="bg-green-50 dark:bg-green-950/10 border-green-100 dark:border-green-900/30">
                  <CheckCircle2Icon className="h-4 w-4 text-green-500" />
                  <AlertTitle>Document Ready</AlertTitle>
                  <AlertDescription className="flex flex-col gap-2">
                    <p>Your document <strong>{filename}</strong> has been generated successfully!</p>
                    <div className="flex items-center gap-2 text-primary mt-1 bg-primary/5 p-2 rounded-md">
                      <Link2Icon size={16} className="shrink-0" />
                      <a 
                        href={documentUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:underline text-sm break-all"
                      >
                        {documentUrl}
                      </a>
                    </div>
                    <Button 
                      onClick={() => window.open(documentUrl, '_blank')} 
                      className="mt-4 w-full sm:w-auto bg-green-600 hover:bg-green-700 transition-colors"
                    >
                      <FileIcon className="mr-2 h-4 w-4" />
                      Download Document
                    </Button>
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <div className="min-h-[200px] flex items-center justify-center border border-dashed rounded-md bg-muted/5">
                <div className="text-center p-6">
                  <FileIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">Your generated document will appear here</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {isAuthenticated === false 
                      ? "Please sign in to generate documents" 
                      : freeTrialUsed && !isSubscribed
                        ? "Upgrade to premium to generate more documents"
                        : "Enter a topic and click 'Generate Document'"}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
          {isAuthenticated && !isSubscribed && (
            <CardFooter className="bg-muted/10 border-t px-6 py-4">
              <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                  {freeTrialUsed 
                    ? "You've used your free trial. Upgrade to premium for unlimited documents." 
                    : "You have 1 free document generation with your account."}
                </p>
                <Button 
                  onClick={() => setShowSubscriptionModal(true)}
                  size="sm" 
                  variant={freeTrialUsed ? "default" : "outline"}
                  className={freeTrialUsed ? "bg-primary hover:bg-primary/90" : ""}
                >
                  Upgrade to Premium
                </Button>
              </div>
            </CardFooter>
          )}
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
