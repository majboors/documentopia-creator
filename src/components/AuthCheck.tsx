
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { UserCircle } from 'lucide-react';

interface AuthCheckProps {
  children: React.ReactNode;
  message?: string;
  allowTrial?: boolean; // New prop to indicate if this feature should allow trials
}

const AuthCheck: React.FC<AuthCheckProps> = ({ 
  children, 
  message = "Please sign in to continue",
  allowTrial = false
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(!!data.session);
    };
    checkAuth();

    // Setup auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          setIsAuthenticated(false);
        } else if (event === 'SIGNED_IN' && session) {
          setIsAuthenticated(true);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignIn = () => {
    navigate('/auth');
  };

  // Show nothing during initial load
  if (isAuthenticated === null) return null;

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 gap-4 bg-muted/30 rounded-lg border border-border">
      <p className="text-center text-muted-foreground">
        {allowTrial 
          ? "Sign in to continue or try once for free" 
          : message}
      </p>
      <Button onClick={handleSignIn} size="sm">
        <UserCircle className="mr-2 h-4 w-4" />
        Sign In to Continue
      </Button>
    </div>
  );
};

export default AuthCheck;
