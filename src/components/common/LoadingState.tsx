import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  /**
   * Text to display below the spinner
   */
  text?: string;
  
  /**
   * Size of the spinner: 'small', 'medium', or 'large'
   */
  size?: 'small' | 'medium' | 'large';
  
  /**
   * Whether to show the spinner in a full-page overlay
   */
  fullPage?: boolean;
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({
  text,
  size = 'medium',
  fullPage = false,
  className,
}) => {
  // Define spinner sizes
  const spinnerSizes = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12',
  };
  
  // Define container classes
  const containerClasses = cn(
    'flex flex-col items-center justify-center',
    fullPage && 'fixed inset-0 bg-background/80 backdrop-blur-sm z-50',
    !fullPage && 'p-4',
    className
  );
  
  return (
    <div className={containerClasses}>
      <Loader2 
        className={cn(
          'animate-spin text-primary',
          spinnerSizes[size]
        )} 
      />
      {text && (
        <p className={cn(
          'mt-2 text-muted-foreground',
          size === 'small' && 'text-xs',
          size === 'medium' && 'text-sm',
          size === 'large' && 'text-base'
        )}>
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingState; 