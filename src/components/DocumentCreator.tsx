
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Section, Container, Heading, Text, Button, GlassCard } from './ui-components';
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { FileText, Send, Download, Copy, Check, Loader2, ExternalLink, CreditCard, LogOut, Crown, Diamond, Star } from 'lucide-react';
import { toast } from "@/hooks/use-toast";
import SubscriptionModal from './SubscriptionModal';
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface GenerateResponse {
  success: boolean;
  download_url: string;
  filename: string;
}

interface PaymentResponse {
  success: boolean;
  payment_url: string;
}

interface UserSession {
  id: string | undefined;
  email: string | undefined;
}

const DocumentCreator: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [numPages, setNumPages] = useState(3);
  const [documentContent, setDocumentContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('create');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [filename, setFilename] = useState('');
  const [usageCount, setUsageCount] = useState(0);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [user, setUser] = useState<UserSession>({ id: undefined, email: undefined });
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const paymentStatus = params.get('payment');
    const paymentReason = params.get('reason');
    const subscriptionId = params.get('subscription_id');
    
    if (paymentStatus === 'success') {
      toast({
        title: "Payment Successful",
        description: "Your subscription has been activated. You now have unlimited access!",
      });
      setIsSubscribed(true);
      navigate('/create', { replace: true });
    } else if (paymentStatus === 'failed') {
      toast({
        title: "Payment Failed",
        description: `There was an issue processing your payment${paymentReason ? `: ${paymentReason}` : ''}. Please try again.`,
        variant: "destructive"
      });
      navigate('/create', { replace: true });
    } else if (paymentStatus === 'error') {
      toast({
        title: "Payment Error",
        description: `An error occurred during payment processing${paymentReason ? `: ${paymentReason}` : ''}. Please try again later.`,
        variant: "destructive"
      });
      navigate('/create', { replace: true });
    }
  }, [location.search, navigate]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate('/auth');
          return;
        }
        
        setUser({
          id: session.user.id,
          email: session.user.email,
        });
        
        let documentCount = 0;
        
        try {
          const { data, error } = await supabase
            .from('user_subscriptions')
            .select('*')
            .eq('user_id', session.user.id)
            .single();
          
          if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
            console.error('Error fetching usage count:', error);
          } else {
            if (data && data.is_subscribed === false) {
              documentCount = 1;
            }
            setUsageCount(documentCount);
          }
        } catch (error) {
          console.error('Error fetching document usage:', error);
          setUsageCount(0);
        }
        
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('is_active', true)
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (subscriptionError) {
          console.error('Error checking subscription:', subscriptionError);
        } else {
          setIsSubscribed(subscriptionData && subscriptionData.length > 0);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
    
    const authSubscription = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setUser({
          id: session.user.id,
          email: session.user.email,
        });
      } else if (event === 'SIGNED_OUT') {
        navigate('/auth');
      }
    });
    
    return () => {
      authSubscription.data.subscription.unsubscribe();
    };
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast({
        title: "Topic required",
        description: "Please enter a topic for your document",
        variant: "destructive"
      });
      return;
    }

    if (usageCount >= 1 && !isSubscribed) {
      setShowSubscriptionModal(true);
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
        const secureDownloadUrl = data.download_url.replace(/^http:\/\//i, 'https://');
        setDownloadUrl(secureDownloadUrl);
        setFilename(data.filename);
        setDocumentContent(`Document generated successfully!\n\nTopic: ${topic}\nPages: ${numPages}\n\nClick the Download button to get your document.`);
        setActiveTab('preview');
        
        if (user.id) {
          const newCount = usageCount + 1;
          setUsageCount(newCount);
          
          try {
            const { error: updateError } = await supabase.functions.invoke('update-document-usage', {
              body: {
                user_id: user.id,
                count: newCount
              }
            });
            
            if (updateError) {
              console.error('Error updating usage count:', updateError);
            }
          } catch (error) {
            console.error('Error updating document usage:', error);
          }
        }
        
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

  const handleInitiatePayment = async () => {
    if (!user.id) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to subscribe.",
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessingPayment(true);
    
    try {
      const redirectUrl = `${window.location.origin}/create?user_id=${user.id}`;
      const fallbackUrl = `${window.location.origin}/api/payment-fallback?user_id=${user.id}`;
      
      const response = await fetch('https://pay.techrealm.pk/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: 5141,
          redirection_url: redirectUrl,
          fallback_url: fallbackUrl
        }),
      });
      
      const data = await response.json();
      
      if (data.payment_url) {
        window.location.href = data.payment_url;
        
        toast({
          title: "Payment Initiated",
          description: "Redirecting to payment page...",
        });
        
        setShowSubscriptionModal(false);
      } else {
        toast({
          title: "Payment Error",
          description: "There was an error initiating the payment. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: "Payment Error",
        description: "Failed to connect to the payment service. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsProcessingPayment(false);
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
      
      window.open(downloadUrl, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Section className="min-h-screen pt-28 pb-16">
      <Container>
        <div className="flex justify-between items-center max-w-3xl mx-auto mb-8">
          <div>
            <div className="flex items-center gap-2">
              <Heading.H1 className="mb-1">Document Creator</Heading.H1>
              {isSubscribed && (
                <Badge className="bg-purple-500 hover:bg-purple-600">
                  <Crown className="h-3.5 w-3.5 mr-1" />
                  Premium
                </Badge>
              )}
            </div>
            {user.email && (
              <Text.Muted>Logged in as {user.email}</Text.Muted>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>

        {isSubscribed ? (
          <Alert className="max-w-3xl mx-auto mb-6 bg-purple-100 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800/30">
            <AlertDescription className="text-center py-1 flex items-center justify-center gap-2">
              <Crown className="h-4 w-4 text-purple-500" />
              <span className="font-semibold text-purple-700 dark:text-purple-300">Premium Subscription Active</span>
              <span className="text-purple-600 dark:text-purple-400">- You have unlimited document creation</span>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="max-w-3xl mx-auto mb-6">
            <AlertDescription className="text-center py-1">
              {usageCount === 0 ? (
                "You have 1 free document creation."
              ) : (
                "You've used your free document. Subscribe for unlimited access."
              )}
            </AlertDescription>
          </Alert>
        )}

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
                    <label htmlFor="document-title" className="block text-sm font-medium mb-1 flex items-center gap-1">
                      Document Topic
                      {isSubscribed && (
                        <Diamond className="h-3.5 w-3.5 text-purple-500 ml-1" />
                      )}
                    </label>
                    <Input 
                      id="document-title"
                      placeholder="Enter a topic for your document"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className={`w-full ${isSubscribed ? 'border-purple-200 focus-visible:ring-purple-500/20' : ''}`}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="document-description" className="block text-sm font-medium mb-1 flex items-center gap-1">
                      Additional Details (Optional)
                      {isSubscribed && (
                        <Diamond className="h-3.5 w-3.5 text-purple-500 ml-1" />
                      )}
                    </label>
                    <Textarea 
                      id="document-description"
                      placeholder="Add any additional details you'd like to include in the document"
                      rows={4}
                      className={`w-full resize-none ${isSubscribed ? 'border-purple-200 focus-visible:ring-purple-500/20' : ''}`}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="num-pages" className="block text-sm font-medium mb-1 flex items-center gap-1">
                      Number of Pages
                      {isSubscribed && (
                        <Diamond className="h-3.5 w-3.5 text-purple-500 ml-1" />
                      )}
                    </label>
                    <Input 
                      id="num-pages"
                      type="number"
                      min={1}
                      max={isSubscribed ? 20 : 10}
                      value={numPages}
                      onChange={(e) => setNumPages(parseInt(e.target.value) || 3)}
                      className={`w-full ${isSubscribed ? 'border-purple-200 focus-visible:ring-purple-500/20' : ''}`}
                    />
                    {isSubscribed && (
                      <Text.Muted className="mt-1 text-purple-500 flex items-center">
                        <Star className="h-3 w-3 mr-1" /> 
                        Premium users can create up to 20-page documents
                      </Text.Muted>
                    )}
                  </div>
                  
                  <Button 
                    onClick={handleGenerate} 
                    className={`w-full ${isSubscribed ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                    disabled={!topic.trim() || isGenerating || (usageCount >= 1 && !isSubscribed)}
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
                        {isSubscribed && <Crown className="ml-2 h-4 w-4" />}
                      </>
                    )}
                  </Button>
                  
                  {usageCount >= 1 && !isSubscribed && (
                    <div className="text-center mt-4">
                      <Text.Muted>You've used your free document creation.</Text.Muted>
                      <Button 
                        variant="link" 
                        onClick={() => setShowSubscriptionModal(true)}
                        className="mt-1"
                      >
                        Subscribe for unlimited access
                      </Button>
                    </div>
                  )}
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

        <div id="pricing" className="mt-24 max-w-3xl mx-auto scroll-mt-24">
          <div className="text-center mb-12">
            <Heading.H2 className="mb-4">Simple, Transparent Pricing</Heading.H2>
            <Text.Regular>
              Get unlimited access to our document generation service at an affordable price.
            </Text.Regular>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <GlassCard className="p-6 flex flex-col h-full">
              <div className="p-4 bg-muted/30 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <Heading.H3 className="mb-2">Free Trial</Heading.H3>
              <Text.Regular className="mb-2">$0/month</Text.Regular>
              <div className="border-t border-border my-4" />
              <ul className="space-y-3 mb-8 flex-grow">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                  <Text.Regular>Create 1 document</Text.Regular>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                  <Text.Regular>Basic formatting options</Text.Regular>
                </li>
              </ul>
              <div className="mt-auto">
                <Button variant="outline" className="w-full" disabled>
                  {usageCount >= 1 ? "Trial Used" : "Current Plan"}
                </Button>
              </div>
            </GlassCard>
            
            <GlassCard className="p-6 flex flex-col h-full border-purple-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-purple-500 text-primary-foreground py-1 px-3 text-xs font-medium flex items-center gap-1">
                <Crown className="h-3 w-3" /> PREMIUM
              </div>
              <div className="p-4 bg-purple-100 dark:bg-purple-900/20 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <CreditCard className="h-6 w-6 text-purple-500" />
              </div>
              <Heading.H3 className="mb-2 flex items-center">
                Premium Package
                <Diamond className="h-4 w-4 text-purple-500 ml-2" />
              </Heading.H3>
              <Text.Regular className="mb-2">$14/month</Text.Regular>
              <div className="border-t border-border my-4" />
              <ul className="space-y-3 mb-8 flex-grow">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-purple-500 mr-2 flex-shrink-0" />
                  <Text.Regular>Unlimited document creation</Text.Regular>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-purple-500 mr-2 flex-shrink-0" />
                  <Text.Regular>Advanced formatting options</Text.Regular>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-purple-500 mr-2 flex-shrink-0" />
                  <Text.Regular>Priority support</Text.Regular>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-purple-500 mr-2 flex-shrink-0" />
                  <Text.Regular>Download in multiple formats</Text.Regular>
                </li>
              </ul>
              <div className="mt-auto">
                {isSubscribed ? (
                  <Button className="w-full bg-purple-600 hover:bg-purple-700" disabled>
                    <Crown className="mr-2 h-4 w-4" />
                    Currently Subscribed
                  </Button>
                ) : (
                  <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={() => setShowSubscriptionModal(true)}>
                    Subscribe Now
                  </Button>
                )}
              </div>
            </GlassCard>
          </div>
        </div>
      </Container>

      <SubscriptionModal 
        isOpen={showSubscriptionModal} 
        onClose={() => setShowSubscriptionModal(false)}
        onPayment={handleInitiatePayment}
        isProcessing={isProcessingPayment}
        isPremium={isSubscribed}
      />
    </Section>
  );
};

export default DocumentCreator;
