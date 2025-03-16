
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
      // Force clear the session locally regardless of server response
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      
      // Even if there's an error, we want to update local state and navigate away
      setIsAuthenticated(false);
      setIsSubscribed(false);
      
      // Show success toast and navigate home
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
      navigate('/');
      
      // Log error if any, but don't prevent the user from continuing
      if (error) {
        console.error('Error signing out:', error);
      }
    } catch (error) {
      console.error('Unexpected error during sign out:', error);
      // We still want to clear local state even if there was an error
      setIsAuthenticated(false);
      setIsSubscribed(false);
      navigate('/');
    }
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
              <Link to="/create">
                <Button size="sm" variant="ghost">
                  <UserCircle className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <Button size="sm" variant="ghost" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          ) : (
            <Link to="/auth">
              <Button size="sm">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
