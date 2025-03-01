
import React from 'react';
import Header from '@/components/Header';
import DocumentCreator from '@/components/DocumentCreator';

const Creator = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <Header />
      <DocumentCreator />
    </div>
  );
};

export default Creator;
