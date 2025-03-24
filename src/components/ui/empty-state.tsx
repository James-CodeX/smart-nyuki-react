import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  image?: React.ReactNode;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  image,
  className
}) => {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 space-y-4 text-center border rounded-md bg-muted/20",
      className
    )}>
      {image ? (
        <div className="mb-2">{image}</div>
      ) : icon ? (
        <div className="p-3 rounded-full bg-muted">
          {icon}
        </div>
      ) : null}
      
      <h3 className="text-lg font-medium text-foreground">{title}</h3>
      
      {description && (
        <p className="text-sm text-muted-foreground max-w-md px-4">{description}</p>
      )}
      
      {action && (
        <Button onClick={action.onClick} className="mt-2">
          {action.icon && <span className="mr-2">{action.icon}</span>}
          {action.label}
        </Button>
      )}
    </div>
  );
};

export { EmptyState }; 