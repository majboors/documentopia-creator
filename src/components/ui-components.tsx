
import React from 'react';
import { cn } from "@/lib/utils";
import { Button as ShadcnButton } from "@/components/ui/button";
import { Card as ShadcnCard } from "@/components/ui/card";

export const Section = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <section
    ref={ref}
    className={cn(
      "w-full py-16 md:py-24", 
      className
    )}
    {...props}
  />
));
Section.displayName = "Section";

export const Container = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "container px-4 md:px-8 mx-auto", 
      className
    )}
    {...props}
  />
));
Container.displayName = "Container";

export const Button = React.forwardRef<
  React.ElementRef<typeof ShadcnButton>,
  React.ComponentPropsWithoutRef<typeof ShadcnButton>
>(({ className, ...props }, ref) => (
  <ShadcnButton
    ref={ref}
    className={cn(
      "font-medium transition-all duration-300 active:scale-95", 
      className
    )}
    {...props}
  />
));
Button.displayName = "Button";

export const Card = React.forwardRef<
  React.ElementRef<typeof ShadcnCard>,
  React.ComponentPropsWithoutRef<typeof ShadcnCard>
>(({ className, ...props }, ref) => (
  <ShadcnCard
    ref={ref}
    className={cn(
      "border border-border/40 shadow-soft transition-all duration-300",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

export const GlassCard = React.forwardRef<
  React.ElementRef<typeof ShadcnCard>,
  React.ComponentPropsWithoutRef<typeof ShadcnCard>
>(({ className, ...props }, ref) => (
  <ShadcnCard
    ref={ref}
    className={cn(
      "glass-effect", 
      className
    )}
    {...props}
  />
));
GlassCard.displayName = "GlassCard";

export const Heading = {
  H1: ({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 
      className={cn(
        "scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl", 
        className
      )} 
      {...props}
    >
      {children}
    </h1>
  ),
  H2: ({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 
      className={cn(
        "scroll-m-20 text-3xl font-semibold tracking-tight transition-colors first:mt-0", 
        className
      )} 
      {...props}
    >
      {children}
    </h2>
  ),
  H3: ({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 
      className={cn(
        "scroll-m-20 text-2xl font-semibold tracking-tight", 
        className
      )} 
      {...props}
    >
      {children}
    </h3>
  ),
  H4: ({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h4 
      className={cn(
        "scroll-m-20 text-xl font-semibold tracking-tight", 
        className
      )} 
      {...props}
    >
      {children}
    </h4>
  ),
};

export const Text = {
  Lead: ({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p 
      className={cn(
        "text-xl text-muted-foreground", 
        className
      )} 
      {...props}
    >
      {children}
    </p>
  ),
  Large: ({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p 
      className={cn(
        "text-lg font-semibold", 
        className
      )} 
      {...props}
    >
      {children}
    </p>
  ),
  Regular: ({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p 
      className={cn(
        "leading-7", 
        className
      )} 
      {...props}
    >
      {children}
    </p>
  ),
  Small: ({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p 
      className={cn(
        "text-sm", 
        className
      )} 
      {...props}
    >
      {children}
    </p>
  ),
  Muted: ({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p 
      className={cn(
        "text-sm text-muted-foreground", 
        className
      )} 
      {...props}
    >
      {children}
    </p>
  ),
};

export const Badge = ({ 
  variant = "default", 
  className, 
  children, 
  ...props 
}: {
  variant?: "default" | "outline" | "secondary"
  className?: string
  children: React.ReactNode
  [key: string]: any
}) => {
  const baseClasses = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border border-primary text-primary hover:bg-primary/10",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  };
  
  return (
    <span
      className={cn(
        baseClasses,
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
