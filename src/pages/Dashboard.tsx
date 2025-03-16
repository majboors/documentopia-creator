
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, Settings, Clock } from 'lucide-react';
import { Section, Container, Heading, Text } from '@/components/ui-components';
import AuthCheck from '@/components/AuthCheck';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate('/auth');
          return;
        }
        
        setUserData({
          email: session.user.email,
          id: session.user.id,
        });
        
        // Fetch user documents (assuming there's a documents table)
        // If you don't have a documents table yet, this will be empty
        try {
          const { data: docsData, error } = await supabase
            .from('documents')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });
            
          if (!error && docsData) {
            setDocuments(docsData);
          }
        } catch (error) {
          console.error('Error fetching documents:', error);
          // Just continue if there's no documents table yet
        }
        
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <AuthCheck>
      <div className="min-h-screen pt-20 pb-10 bg-gradient-to-b from-background to-muted/30">
        <Container>
          <Section className="mb-8">
            <Heading.H1 className="mb-4">Your Dashboard</Heading.H1>
            <Text.Lead>
              Welcome back, {userData?.email || 'User'}
            </Text.Lead>
          </Section>
          
          <Section className="mb-8">
            <Heading.H2 className="mb-4">Quick Actions</Heading.H2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button 
                className="flex items-center justify-start px-4 py-6 h-auto" 
                onClick={() => navigate('/create')}
              >
                <FileText className="h-5 w-5 mr-2" />
                Create New Document
              </Button>
              
              <Button 
                className="flex items-center justify-start px-4 py-6 h-auto"
                variant="outline"
              >
                <Settings className="h-5 w-5 mr-2" />
                Account Settings
              </Button>
            </div>
          </Section>
          
          <Section>
            <Heading.H2 className="mb-4">Recent Documents</Heading.H2>
            {documents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc) => (
                  <div 
                    key={doc.id} 
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/document/${doc.id}`)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">{doc.title || 'Untitled Document'}</h3>
                    </div>
                    <div className="flex items-center text-muted-foreground text-sm">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(doc.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border rounded-lg bg-muted/20">
                <FileText className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                <Text.Muted>No documents yet. Create your first one!</Text.Muted>
                <Button 
                  className="mt-4" 
                  onClick={() => navigate('/create')}
                >
                  Create Document
                </Button>
              </div>
            )}
          </Section>
        </Container>
      </div>
    </AuthCheck>
  );
};

export default Dashboard;
