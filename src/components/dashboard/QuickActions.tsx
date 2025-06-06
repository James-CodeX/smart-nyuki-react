import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CalendarPlus, Plus, ClipboardPen, FileText, BarChart3, Webhook, Leaf, PlusCircle, Home, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { checkMetricsAndCreateAlerts } from '@/services/alertService';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Map } from 'lucide-react';
import { forceMetricsCheck } from '@/utils/metricsChecker';
import logger from '@/utils/logger';

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color?: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon, label, onClick, color = 'blue' }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-2 p-4 rounded-lg border border-border transition-all",
        "hover:shadow-md hover:border-primary/30 hover:bg-primary/5"
      )}
    >
      <div className={cn(
        "p-3 rounded-full bg-opacity-10",
        `bg-${color}-100 text-${color}-600`
      )}>
        {icon}
      </div>
      <span className="text-sm font-medium text-center">{label}</span>
    </button>
  );
};

interface QuickActionsProps {
  className?: string;
  onAddApiary?: () => void;
  onAddHive?: () => void;
  onScheduleInspection?: () => void;
  onAddNote?: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  className,
  onAddApiary,
  onAddHive,
  onScheduleInspection,
  onAddNote
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleForceMetricsCheck = async () => {
    try {
      logger.log("[DEBUG] Manually triggering metrics check...");
      const alertsCreated = await forceMetricsCheck();
      
      logger.log(`[DEBUG] Metrics check complete: ${alertsCreated} alerts created`);
    } catch (error) {
      logger.error("[DEBUG] Error during manual metrics check:", error);
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-md">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <ActionButton
            icon={<Plus className="h-5 w-5" />}
            label="Add Apiary"
            onClick={onAddApiary || (() => {})}
            color="green"
          />
          <ActionButton
            icon={<Leaf className="h-5 w-5" />}
            label="Add Hive"
            onClick={onAddHive || (() => {})}
            color="yellow"
          />
          <ActionButton
            icon={<CalendarPlus className="h-5 w-5" />}
            label="Schedule Inspection"
            onClick={onScheduleInspection || (() => {})}
            color="blue"
          />
          <ActionButton
            icon={<ClipboardPen className="h-5 w-5" />}
            label="Add Note"
            onClick={onAddNote || (() => {})}
            color="purple"
          />
          <ActionButton
            icon={<BarChart3 className="h-5 w-5" />}
            label="Production"
            onClick={() => navigate('/production')}
            color="red"
          />
          <ActionButton
            icon={<Webhook className="h-5 w-5" />}
            label="Node Status"
            onClick={() => {}}
            color="blue"
          />
          <Button onClick={handleForceMetricsCheck} variant="outline" className="w-full justify-start">
            <Activity className="mr-2 h-4 w-4" />
            Force Metrics Check
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions; 