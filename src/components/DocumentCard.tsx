
import React from 'react';
import { FileText } from 'lucide-react';
import { Card } from './ui-components';
import { cn } from '@/lib/utils';

interface DocumentCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  excerpt?: string;
  icon?: React.ReactNode;
  date?: string;
  imageUrl?: string;
}

const DocumentCard = React.forwardRef<HTMLDivElement, DocumentCardProps>(
  ({ title, excerpt, icon, date, imageUrl, className, ...props }, ref) => {
    return (
      <Card
        ref={ref}
        className={cn(
          "overflow-hidden group cursor-pointer hover-scale hover:shadow-medium",
          className
        )}
        {...props}
      >
        <div className="relative aspect-video bg-muted overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {icon || <FileText className="w-12 h-12 text-muted-foreground/50" />}
            </div>
          )}
        </div>
        <div className="p-5">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-lg line-clamp-1">{title}</h3>
          </div>
          {excerpt && (
            <p className="mt-2 text-muted-foreground text-sm line-clamp-2">{excerpt}</p>
          )}
          {date && (
            <p className="mt-3 text-xs text-muted-foreground">{date}</p>
          )}
        </div>
      </Card>
    );
  }
);

DocumentCard.displayName = "DocumentCard";

export default DocumentCard;
