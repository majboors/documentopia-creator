
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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <Header />
      <div className="container mx-auto pt-6 pb-16">
        <h1 className="text-4xl font-bold text-center mb-2">Document Creator</h1>
        <p className="text-center text-muted-foreground mb-8">Generate professional documents in seconds</p>
        <DocumentCreator />
      </div>
    </div>
  );
};

export default Creator;
