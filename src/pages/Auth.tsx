
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

  // Check if user is already logged in
  useEffect(() => {
    let isMounted = true;
    let sessionCheckTimeout: NodeJS.Timeout;
    
    const checkSession = async () => {
      try {
        setCheckingSession(true);
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error checking session:', error);
          if (isMounted) {
            setCheckingSession(false);
          }
          return;
        }
        
        if (data.session && isMounted) {
          // User is already logged in, redirect to return URL
          navigate(returnUrl);
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
    
    // Set a timeout to prevent getting stuck
    sessionCheckTimeout = setTimeout(() => {
      if (isMounted && checkingSession) {
        console.log('Session check timeout reached');
        setCheckingSession(false);
      }
    }, 3000);
    
    checkSession();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event);
        
        if (!isMounted) return;
        
        if (session && event === 'SIGNED_IN') {
          // User signed in, redirect to return URL
          navigate(returnUrl);
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
        title: 'Error',
        description: 'Please enter both email and password',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      // Success notification
      toast({
        title: 'Welcome back!',
        description: 'You have successfully signed in.',
      });
      
      // Redirect is handled by the onAuthStateChange listener
    } catch (error: any) {
      toast({
        title: 'Error signing in',
        description: error.message || 'An error occurred during sign in',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: 'Error',
        description: 'Please enter both email and password',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Check your email for the confirmation link',
      });
      
      // Switch to sign in tab
      setActiveTab('signin');
    } catch (error: any) {
      toast({
        title: 'Error signing up',
        description: error.message || 'An error occurred during sign up',
        variant: 'destructive',
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
