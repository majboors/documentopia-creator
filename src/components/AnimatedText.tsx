
import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedTextProps {
  text: string | string[];
  className?: string;
  speed?: number;
  delay?: number;
  once?: boolean;
  animated?: boolean;
  as?: React.ElementType;
}

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  className,
  speed = 40,
  delay = 0,
  once = false,
  animated = true,
  as: Component = 'div',
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const textArray = Array.isArray(text) ? text : [text];
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startTyping = () => {
    if (!animated) {
      setDisplayedText(textArray[currentTextIndex]);
      return;
    }

    setIsTyping(true);
    let i = 0;
    const currentText = textArray[currentTextIndex];

    const type = () => {
      if (i <= currentText.length) {
        setDisplayedText(currentText.substring(0, i));
        i++;
        timeoutRef.current = setTimeout(type, speed);
      } else {
        setIsTyping(false);
        if (textArray.length > 1 && !once) {
          timeoutRef.current = setTimeout(() => {
            setCurrentTextIndex((prev) => (prev + 1) % textArray.length);
          }, 2000); // Wait before switching to next text
        }
      }
    };

    timeoutRef.current = setTimeout(type, delay);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isTyping) {
          startTyping();
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentTextIndex]);

  useEffect(() => {
    if (!isTyping && !once) {
      startTyping();
    }
  }, [currentTextIndex]);

  return (
    <Component 
      ref={containerRef} 
      className={cn('', className)}
      aria-label={textArray[currentTextIndex]}
    >
      {displayedText}
      {isTyping && (
        <span className="inline-block w-[2px] h-[1em] bg-current ml-0.5 animate-pulse-subtle" />
      )}
    </Component>
  );
};

export default AnimatedText;
