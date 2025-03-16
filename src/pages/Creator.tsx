
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import DocumentCreator from '@/components/DocumentCreator';

const Creator = () => {
  const location = useLocation();

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
