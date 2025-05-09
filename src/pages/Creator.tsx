
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import DocumentCreator from '@/components/DocumentCreator';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Creator = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  useEffect(() => {
    let isMounted = true;
    let authCheckTimeout: NodeJS.Timeout | null = null;
    
    const checkAuthStatus = async () => {
      try {
        console.log('Creator: Checking auth status');
        
        const storedUser = sessionStorage.getItem('supabase_auth_user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          console.log('Found stored user in session storage:', parsedUser.id);
          if (isMounted) {
            setUserId(parsedUser.id);
            setIsCheckingAuth(false);
            return;
          }
        }

        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error checking auth status:', error);
          if (isMounted) {
            setIsCheckingAuth(false);
            toast({
              title: "Authentication Error",
              description: "There was a problem verifying your login status.",
              variant: "destructive",
            });
          }
          return;
        }
        
        if (!data.session) {
          console.log('No active session found in Creator page');
          if (isMounted) {
            setIsCheckingAuth(false);
            setUserId(null);
          }
        } else if (isMounted) {
          console.log('User is authenticated in Creator page, ID:', data.session.user.id);
          sessionStorage.setItem('supabase_auth_user', JSON.stringify(data.session.user));
          setUserId(data.session.user.id);
          setIsCheckingAuth(false);
        }
      } catch (error) {
        console.error('Error in auth check:', error);
        if (isMounted) {
          setIsCheckingAuth(false);
        }
      }
    };

    checkAuthStatus();
    
    authCheckTimeout = setTimeout(() => {
      if (isMounted && isCheckingAuth) {
        console.log('Auth check timeout reached in Creator page');
        setIsCheckingAuth(false);
      }
    }, 2000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Creator: Auth state changed:', event);
        
        if (!isMounted) return;
        
        if (event === 'SIGNED_IN' && session) {
          console.log('Creator: User signed in, ID:', session.user.id);
          sessionStorage.setItem('supabase_auth_user', JSON.stringify(session.user));
          setUserId(session.user.id);
          setIsCheckingAuth(false);
        } else if (event === 'SIGNED_OUT') {
          console.log('Creator: User signed out');
          sessionStorage.removeItem('supabase_auth_user');
          setUserId(null);
          navigate('/auth', { state: { returnUrl: '/create' } });
        }
      }
    );

    return () => {
      isMounted = false;
      if (authCheckTimeout) {
        clearTimeout(authCheckTimeout);
      }
      subscription.unsubscribe();
    };
  }, [navigate]);

  useEffect(() => {
    if (!isCheckingAuth && !userId) {
      navigate('/auth', { state: { returnUrl: '/create' } });
    }
  }, [isCheckingAuth, userId, navigate]);

  useEffect(() => {
    if (location.hash === '#pricing') {
      setTimeout(() => {
        const pricingSection = document.getElementById('pricing');
        if (pricingSection) {
          pricingSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [location.hash]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-muted/30">
      <Header />
      <div className="container mx-auto pt-8 pb-20">
        <div className="max-w-3xl mx-auto text-center mb-8">
          <h1 className="text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
            Document Creator
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Generate professional documents in seconds with our AI-powered document creator.
            Simply enter your topic and let our advanced AI do the work.
          </p>
        </div>
        <DocumentCreator />
      </div>
    </div>
  );
};

export default Creator;
