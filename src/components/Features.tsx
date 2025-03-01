
import React from 'react';
import { Section, Container, Heading, Text } from './ui-components';
import FeatureCard from './FeatureCard';
import { FileText, Sparkles, Clock, Palette, Search, Wand2 } from 'lucide-react';

const Features: React.FC = () => {
  const features = [
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: 'AI-Generated Content',
      description: 'Our advanced AI creates high-quality, context-aware document content for any need.'
    },
    {
      icon: <Palette className="h-6 w-6" />,
      title: 'Beautiful Templates',
      description: 'Choose from professionally designed templates for every document type.'
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: 'Save Time',
      description: 'Create in seconds what would normally take hours to write and format.'
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: 'Multiple Formats',
      description: 'Export to PDF, Word, HTML and more with perfect formatting preserved.'
    },
    {
      icon: <Search className="h-6 w-6" />,
      title: 'Smart Search',
      description: 'Instantly find what you need across all your created documents.'
    },
    {
      icon: <Wand2 className="h-6 w-6" />,
      title: 'Intelligent Editing',
      description: 'AI-powered suggestions and corrections make editing effortless.'
    }
  ];

  return (
    <Section className="relative" id="features">
      <Container>
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Heading.H2 className="mb-4">
            Powerful Features for
            <span className="ml-2 relative">
              <span className="text-primary relative z-10">Perfect Documents</span>
              <span className="absolute -inset-1 -z-10 bg-primary/10 rounded-md blur-sm" aria-hidden="true"></span>
            </span>
          </Heading.H2>
          <Text.Regular>
            Our AI-powered platform gives you everything you need to create professional documents in seconds.
          </Text.Regular>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              className="animate-scale-in"
              style={{ animationDelay: `${index * 100}ms` }}
            />
          ))}
        </div>
      </Container>
    </Section>
  );
};

export default Features;
