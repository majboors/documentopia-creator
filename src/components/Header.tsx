
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { UserCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Header: React.FC = () => {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(!!data.session);
    };
    
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <header className="fixed w-full bg-background/80 backdrop-blur-md z-10 border-b">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex gap-6 md:gap-10">
          <Link to="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl">DocGen</span>
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
            <Link to="/create">
              <Button size="sm" variant="ghost">
                <UserCircle className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </Link>
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
