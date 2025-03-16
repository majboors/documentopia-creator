
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { UserCircle } from 'lucide-react';

interface AuthCheckProps {
  children: React.ReactNode;
  message?: string;
}

const AuthCheck: React.FC<AuthCheckProps> = ({ 
  children, 
  message = "Please sign in to continue"
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(!!data.session);
    };
    checkAuth();
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
      <p className="text-center text-muted-foreground">{message}</p>
      <Button onClick={handleSignIn} size="sm">
        <UserCircle className="mr-2 h-4 w-4" />
        Sign In to Continue
      </Button>
    </div>
  );
};

export default AuthCheck;
