
import React from 'react';
import { cn } from '@/lib/utils';
import { GlassCard } from './ui-components';

interface FeatureCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const FeatureCard = React.forwardRef<HTMLDivElement, FeatureCardProps>(
  ({ title, description, icon, className, ...props }, ref) => {
    return (
      <GlassCard
        ref={ref}
        className={cn(
          "overflow-hidden hover-scale group",
          className
        )}
        {...props}
      >
        <div className="p-5 sm:p-6">
          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-primary/10 text-primary mb-5 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
            {icon}
          </div>
          <h3 className="text-xl font-semibold mb-2">{title}</h3>
          <p className="text-muted-foreground">{description}</p>
        </div>
      </GlassCard>
    );
  }
);

FeatureCard.displayName = "FeatureCard";

export default FeatureCard;
