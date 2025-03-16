
import React from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import DocumentCard from '@/components/DocumentCard';
import { Section, Container, Heading, Text, Button } from '@/components/ui-components';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import AuthCheck from '@/components/AuthCheck';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const Index = () => {
  const navigate = useNavigate();
  const exampleDocs = [
    {
      title: 'Project Proposal',
      excerpt: 'A comprehensive project proposal with executive summary, timeline, and budget',
      date: 'Template'
    },
    {
      title: 'Research Report',
      excerpt: 'Detailed research findings with analysis and visual data representation',
      date: 'Template'
    },
    {
      title: 'Marketing Plan',
      excerpt: 'Strategic marketing plan with target audience analysis and campaign timeline',
      date: 'Template'
    }
  ];

  const handleCreateClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    
    const { data } = await supabase.auth.getSession();
    
    if (data.session) {
      navigate('/create');
    } else {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create documents",
      });
      navigate('/auth', { state: { returnUrl: '/create' } });
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <Features />
      
      <Section>
        <Container>
          <div className="max-w-2xl mx-auto text-center mb-12">
            <Heading.H2 className="mb-4">Start with a Template</Heading.H2>
            <Text.Regular>
              Choose from our professionally designed templates or start from scratch.
              Our AI will help you create the perfect document in minutes.
            </Text.Regular>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {exampleDocs.map((doc, i) => (
              <div key={i}>
                <AuthCheck message="Sign in to use templates">
                  <Link to="/create">
                    <DocumentCard
                      title={doc.title}
                      excerpt={doc.excerpt}
                      date={doc.date}
                      className="animate-fade-in h-full"
                      style={{ animationDelay: `${i * 100}ms` }}
                    />
                  </Link>
                </AuthCheck>
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <AuthCheck message="Sign in to create documents">
              <Button asChild>
                <Link to="/create">
                  Create Your Document <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </AuthCheck>
          </div>
        </Container>
      </Section>
      
      <Section className="bg-accent/50">
        <Container>
          <div className="max-w-3xl mx-auto text-center py-16">
            <Heading.H2 className="mb-6">Ready to Create Amazing Documents?</Heading.H2>
            <Text.Lead className="mb-8">
              Start creating professional documents with AI assistance today.
              Save time and get better results.
            </Text.Lead>
            <AuthCheck message="Sign in to get started">
              <Button size="lg" asChild>
                <Link to="/create">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </AuthCheck>
          </div>
        </Container>
      </Section>
    </div>
  );
};

export default Index;
