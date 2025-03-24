import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface InspectionStatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  description?: string;
  change?: number;
  colorClass?: string;
}

const InspectionStatCard: React.FC<InspectionStatCardProps> = ({
  title,
  value,
  icon,
  description,
  change,
  colorClass = "bg-primary/10 text-primary"
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={cn("p-2 rounded-full", colorClass)}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
      {typeof change !== 'undefined' && (
        <CardFooter className="p-2">
          <div className={cn(
            "text-xs font-medium flex items-center",
            change > 0 ? "text-green-600" : 
            change < 0 ? "text-red-600" : "text-muted-foreground"
          )}>
            {change > 0 ? (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-3 h-3 mr-1"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z"
                    clipRule="evenodd"
                  />
                </svg>
                {Math.abs(change)}% from last month
              </>
            ) : change < 0 ? (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-3 h-3 mr-1"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z"
                    clipRule="evenodd"
                  />
                </svg>
                {Math.abs(change)}% from last month
              </>
            ) : (
              'No change from last month'
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default InspectionStatCard; 