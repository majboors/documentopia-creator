
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Section, Container, Heading, Text, Button, GlassCard } from '@/components/ui-components';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Mail, Key, LogIn, UserPlus, Loader2 } from 'lucide-react';

interface LocationState {
  returnUrl?: string;
}

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;
  const returnUrl = state?.returnUrl || '/create';
  
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('signin');
  
  useEffect(() => {
    let isMounted = true;
    let sessionCheckTimeout: NodeJS.Timeout;
    
    const checkSession = async () => {
      try {
        setCheckingSession(true);
        console.log('Auth: Checking for existing session...');
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error checking session:', error);
          if (isMounted) {
            setCheckingSession(false);
          }
          return;
        }
        
        console.log('Auth: Session check result:', data.session ? 'Active session found' : 'No active session');
        
        if (data.session && isMounted) {
          console.log('Auth: User is already logged in, redirecting to:', returnUrl);
          
          // Store the return URL in localStorage for post-redirect use
          localStorage.setItem('auth_redirect_url', returnUrl);
          
          // Force a refresh for immediate redirect
          window.location.href = returnUrl;
        } else if (isMounted) {
          setCheckingSession(false);
        }
      } catch (error) {
        console.error('Error in checkSession:', error);
        if (isMounted) {
          setCheckingSession(false);
        }
      }
    };
    
    // Shorter timeout for checking session
    sessionCheckTimeout = setTimeout(() => {
      if (isMounted && checkingSession) {
        console.log('Session check timeout reached in Auth');
        setCheckingSession(false);
      }
    }, 1500); // Reduced further to 1.5s
    
    checkSession();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth: Auth state changed:', event, session ? 'with session' : 'no session');
        
        if (!isMounted) return;
        
        if (session && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION')) {
          console.log('Auth: User signed in, redirecting to:', returnUrl);
          
          // For a more reliable redirect after authentication
          if (event === 'SIGNED_IN') {
            // Store return URL for post-redirect use
            localStorage.setItem('auth_redirect_url', returnUrl);
            
            // Immediate redirect
            window.location.href = returnUrl;
          } else {
            // For other events, use regular navigation
            setTimeout(() => {
              if (isMounted) {
                navigate(returnUrl);
              }
            }, 100); // Smaller delay
          }
        }
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(sessionCheckTimeout);
      subscription.unsubscribe();
    };
  }, [navigate, returnUrl]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setLoading(true);
      console.log('Auth: Attempting to sign in with email:', email);
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      console.log('Auth: Sign in successful:', data.user?.id);
      
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });
      
      // More reliable redirect after sign-in
      localStorage.setItem('auth_redirect_url', returnUrl);
      window.location.href = returnUrl;
    } catch (error: any) {
      console.error('Sign in error:', error.message);
      toast({
        title: "Error signing in",
        description: error.message || 'An error occurred during sign in',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setLoading(true);
      console.log('Auth: Attempting to sign up with email:', email);
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin + '/create',
        }
      });
      
      if (error) throw error;
      
      console.log('Auth: Sign up successful:', data);
      
      if (data.session) {
        toast({
          title: "Account Created",
          description: "Your account has been created and you are now logged in.",
        });
        
        // Immediate redirect
        localStorage.setItem('auth_redirect_url', returnUrl);
        window.location.href = returnUrl;
      } else {
        toast({
          title: "Success",
          description: "Check your email for the confirmation link.",
        });
        setActiveTab('signin');
      }
    } catch (error: any) {
      console.error('Sign up error:', error.message);
      toast({
        title: "Error signing up",
        description: error.message || 'An error occurred during sign up',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <Text.Muted>Checking authentication status...</Text.Muted>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Container className="max-w-md w-full">
        <GlassCard className="p-8">
          <div className="text-center mb-8">
            <Heading.H2 className="mb-2">Welcome</Heading.H2>
            <Text.Muted>Sign in to access your account</Text.Muted>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label htmlFor="signin-email" className="block text-sm font-medium mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signin-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="signin-password" className="block text-sm font-medium mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signin-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Sign In
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <label htmlFor="signup-email" className="block text-sm font-medium mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="signup-password" className="block text-sm font-medium mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Choose a password"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Sign Up
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </GlassCard>
      </Container>
    </div>
  );
};

export default Auth;
