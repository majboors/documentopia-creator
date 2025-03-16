
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { UserCircle, Crown, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(!!data.session);
      
      if (data.session) {
        // Check subscription status
        const { data: subscriptionData, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', data.session.user.id)
          .eq('is_active', true)
          .gt('expires_at', new Date().toISOString())
          .limit(1);
          
        setIsSubscribed(subscriptionData && subscriptionData.length > 0);
      }
    };
    
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      if (!session) {
        setIsSubscribed(false);
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      // First, show the toast to indicate the process has started
      toast({
        title: "Signing Out...",
        description: "Please wait while we sign you out.",
      });
      
      // Explicitly reset auth state first
      setIsAuthenticated(false);
      setIsSubscribed(false);
      
      // Then sign out from Supabase
      await supabase.auth.signOut();
      
      // Show success toast
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
      
      // Navigate to home page
      navigate('/');
    } catch (error) {
      console.error('Error during sign out:', error);
      
      // Even if there's an error, we want to clear local state
      setIsAuthenticated(false);
      setIsSubscribed(false);
      
      // Show success toast anyway to prevent user confusion
      toast({
        title: "Signed Out",
        description: "You have been signed out locally. Some server operations may have failed.",
      });
      
      // Navigate to home page
      navigate('/');
    }
  };

  const handleSignIn = () => {
    navigate('/auth');
  };

  return (
    <header className="fixed w-full bg-background/80 backdrop-blur-md z-10 border-b">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex gap-6 md:gap-10">
          <Link to="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl">DocGen</span>
            {isSubscribed && (
              <Badge variant="default" className="bg-purple-500 hover:bg-purple-600 ml-2 flex items-center gap-1">
                <Crown className="h-3 w-3" />
                <span>Premium</span>
              </Badge>
            )}
          </Link>
          <nav className="flex gap-6">
            <Link
              to="/"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === '/' ? 'text-foreground' : 'text-foreground/60'
              }`}
            >
              Home
            </Link>
            <Link
              to="/create"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === '/create' ? 'text-foreground' : 'text-foreground/60'
              }`}
            >
              Create
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <div className="flex items-center">
              {isSubscribed && (
                <Badge variant="outline" className="border-purple-500 text-purple-500 mr-3">
                  <Crown className="h-3 w-3 mr-1 text-purple-500" />
                  Premium
                </Badge>
              )}
              <Link to="/dashboard">
                <Button size="sm" variant="ghost">
                  <UserCircle className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={handleSignOut}
                className="hover:bg-red-100 hover:text-red-600 transition-colors"
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={handleSignIn}>
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
