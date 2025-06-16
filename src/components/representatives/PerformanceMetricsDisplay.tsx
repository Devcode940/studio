
import type { PerformanceMetric } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus, Info, BarChartHorizontalBig } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface PerformanceMetricsDisplayProps {
  metrics: PerformanceMetric[];
  title?: string;
}

const TrendIcon = ({ trend }: { trend?: 'up' | 'down' | 'stable' }) => {
  if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-500" />;
  if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />;
  if (trend === 'stable') return <Minus className="h-4 w-4 text-yellow-500" />;
  return null;
};

export function PerformanceMetricsDisplay({ metrics, title = "Key Performance Indicators" }: PerformanceMetricsDisplayProps) {
  if (!metrics || metrics.length === 0) {
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center">
             <BarChartHorizontalBig className="mr-2 h-6 w-6 text-primary" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No performance metrics available for this representative.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
         <BarChartHorizontalBig className="mr-2 h-8 w-8 text-primary" />
          <div>
            <CardTitle className="font-headline text-xl">{title}</CardTitle>
            <CardDescription>Overview of the representative's performance based on available data.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <ul className="space-y-6">
            {metrics.map((metric) => (
              <li key={metric.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground/90 flex items-center">
                    {metric.name}
                    {metric.description && (
                       <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="ml-2 h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{metric.description}</p>
                          {metric.source && <p className="text-xs mt-1 text-muted-foreground">Source: {metric.source}</p>}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    <TrendIcon trend={metric.trend} />
                    <span className="font-semibold text-primary">{metric.value}{metric.unit && (metric.unit === '%' ? '%' : ` ${metric.unit}`)}</span>
                  </div>
                </div>
                {typeof metric.value === 'number' && metric.unit === '%' && (
                  <Progress value={metric.value} aria-label={`${metric.name}: ${metric.value}%`} className="h-3" />
                )}
              </li>
            ))}
          </ul>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
