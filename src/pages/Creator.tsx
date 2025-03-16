
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import DocumentCreator from '@/components/DocumentCreator';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const Creator = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check auth status on component mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      // Check if there's a redirect URL in localStorage (set by Auth.tsx)
      const redirectUrl = localStorage.getItem('auth_redirect_url');
      if (redirectUrl) {
        localStorage.removeItem('auth_redirect_url');
      }

      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error checking auth status:', error);
        }
        
        if (!data.session) {
          console.log('No active session found, redirecting to auth page');
          navigate('/auth', { state: { returnUrl: '/create' } });
        }
      } catch (error) {
        console.error('Error in auth check:', error);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuthStatus();
  }, [navigate]);

  // Scroll to pricing section if the URL has #pricing
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
