
import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Section, Container, Heading, Text, Button } from './ui-components';
import AnimatedText from './AnimatedText';
import { ArrowRight } from 'lucide-react';

const Hero: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!heroRef.current) return;
      
      const rect = heroRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      heroRef.current.style.setProperty('--mouse-x', `${x}px`);
      heroRef.current.style.setProperty('--mouse-y', `${y}px`);
    };
    
    const hero = heroRef.current;
    if (hero) {
      hero.addEventListener('mousemove', handleMouseMove);
    }
    
    return () => {
      if (hero) {
        hero.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, []);

  return (
    <Section className="pt-32 pb-16 md:py-32 overflow-hidden relative">
      <div
        className="absolute inset-0 bg-gradient-to-b from-accent/40 to-transparent opacity-50 pointer-events-none"
        aria-hidden="true"
      />
      
      <div
        ref={heroRef}
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(var(--primary-rgb), 0.15), transparent 40%)`,
        }}
        aria-hidden="true"
      />
      
      <Container className="relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-10 md:mb-16">
          <div className="inline-block mb-4">
            <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium animate-fade-in">
              AI-Powered Document Creation
            </div>
          </div>
          
          <Heading.H1 className="mb-6 animate-slide-up">
            Create Perfect Documents with
            <span className="relative ml-2 text-primary">
              <AnimatedText 
                text={["AI", "Intelligence", "Precision"]} 
                className="inline-block"
                speed={80}
                delay={500}
              />
            </span>
          </Heading.H1>
          
          <Text.Lead className="mx-auto mb-8 animate-slide-up" style={{animationDelay: '100ms'}}>
            Transform your ideas into professionally crafted documents instantly.
            Our AI understands context, formatting, and style to deliver exactly what you need.
          </Text.Lead>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 animate-slide-up" style={{animationDelay: '200ms'}}>
            <Button size="lg" asChild>
              <Link to="/create">
                Start Creating <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/#features">
                Explore Features
              </Link>
            </Button>
          </div>
        </div>
        
        <div className="relative mx-auto max-w-4xl aspect-[16/9] animate-scale-in" style={{animationDelay: '300ms'}}>
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" aria-hidden="true" />
          <div className="absolute -inset-px rounded-lg border border-border/50 pointer-events-none" aria-hidden="true" />
          <div className="absolute inset-0 rounded-lg overflow-hidden bg-muted">
            <img 
              src="https://images.unsplash.com/photo-1488590528505-98d2b5aba04b" 
              alt="Document Creator Interface" 
              className="w-full h-full object-cover opacity-90"
              loading="lazy"
            />
          </div>
        </div>
      </Container>
    </Section>
  );
};

export default Hero;
