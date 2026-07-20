"use client";

import type { PerformanceMetric } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { useMemo } from 'react';
import { SCORING_VERSION } from '@/lib/scoring';

interface PerformanceChartProps {
  metrics: PerformanceMetric[];
  representativeName?: string;
}

interface ChartDataPoint {
  name: string;
  value: number;
  unit?: string;
  fullName: string;
  trend?: 'up' | 'down' | 'stable';
  source?: string;
}

export function PerformanceChart({ metrics, representativeName }: PerformanceChartProps) {
  const chartData: ChartDataPoint[] = useMemo(() => {
    if (!metrics || metrics.length === 0) return [];

    return metrics
      .filter(m => {
        // Only numeric metrics for chart
        const num = typeof m.value === 'number' ? m.value : parseFloat(String(m.value));
        return !isNaN(num) && isFinite(num);
      })
      .map(m => {
        const numValue = typeof m.value === 'number' ? m.value : parseFloat(String(m.value));
        // Truncate long names for XAxis
        const shortName = m.name.length > 15 ? m.name.substring(0, 15) + '...' : m.name;
        return {
          name: shortName,
          fullName: m.name,
          value: Math.max(0, Math.min(100, numValue > 100 && m.unit === '%' ? numValue : numValue)), // cap % at 100
          unit: m.unit,
          trend: m.trend,
          source: m.source,
        };
      })
      .slice(0, 8); // max 8 for readability
  }, [metrics]);

  // Generate time series mock data for performance over time
  // Real app: would use historical metrics with timestamps
  // For now, we simulate 6 months trend based on current metrics avg
  const timeSeriesData = useMemo(() => {
    if (chartData.length === 0) return [];

    const avgValue = chartData.reduce((sum, d) => sum + d.value, 0) / chartData.length;
    
    // Simulate 6 months of data with slight variation
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const baseDate = new Date();
    
    return months.map((month, idx) => {
      // Add some realistic variation: ±10%
      const variation = (Math.sin(idx) * 5) + (Math.random() * 6 - 3);
      const value = Math.max(0, Math.min(100, avgValue + variation + idx * 0.5)); // slight upward trend
      
      return {
        month: `${month} ${baseDate.getFullYear()}`,
        score: Math.round(value),
        performance: Math.round(value * 0.9 + Math.random() * 5),
        cdu: Math.round(value * 0.7 + Math.random() * 10), // CDF utilization proxy
      };
    });
  }, [chartData]);

  if (!metrics || metrics.length === 0) {
    return null;
  }

  if (chartData.length === 0) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" />Performance Visualization</CardTitle>
          <CardDescription>No numeric metrics available for chart</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6 mt-6">
      {/* Bar Chart – Current Performance Comparison */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Performance Breakdown – {representativeName || 'Representative'}
          </CardTitle>
          <CardDescription>
            Visual comparison of key performance indicators (Source: OAG 1.5x weight, Mzalendo 1.2x, user 0.8x) • Scoring {SCORING_VERSION}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis 
                dataKey="name" 
                angle={-35} 
                textAnchor="end" 
                height={70}
                tick={{ fontSize: 11 }}
                interval={0}
              />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '8px' }}
                formatter={(value: any, name: any, props: any) => {
                  const payload = props.payload as ChartDataPoint;
                  return [`${value}${payload.unit === '%' ? '%' : payload.unit ? ` ${payload.unit}` : ''} (${payload.fullName})`, 'Value'];
                }}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    const p = payload[0].payload as ChartDataPoint;
                    return `${p.fullName}${p.source ? ` – Source: ${p.source}` : ''}`;
                  }
                  return label;
                }}
              />
              <Legend />
              <Bar 
                dataKey="value" 
                name="Performance Score" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
                barSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Line Chart – Performance Over Time */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Performance Trend Over Time (Last 6 Months)
          </CardTitle>
          <CardDescription>
            Simulated trend based on current average ({Math.round(chartData.reduce((s,d)=>s+d.value,0)/chartData.length)}%). Real app: historical metrics from OAG audits (2022, 2023) + monthly reviews
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={timeSeriesData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorPerf" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2a6d2a" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#2a6d2a" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="score" 
                name="Overall Score" 
                stroke="hsl(var(--primary))" 
                fill="url(#colorScore)" 
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="performance" 
                name="Performance" 
                stroke="#2a6d2a" 
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line 
                type="monotone" 
                dataKey="cdu" 
                name="CDF Utilization (OAG)" 
                stroke="#B22234" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
          <p className="text-xs text-muted-foreground mt-3">
            * Trend simulated from current average. Production: Historical data from OAG audits (2022-2023, 2023-2024) + monthly community ratings. Each point auditable via source URL.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export function PerformanceMiniChart({ metrics }: { metrics: PerformanceMetric[] }) {
  const data = metrics.slice(0,5).map(m => ({
    name: m.name.substring(0,10),
    value: typeof m.value === 'number' ? m.value : parseFloat(String(m.value)) || 0
  }));

  if (data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={150}>
      <BarChart data={data}>
        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
        <YAxis hide />
        <Tooltip />
        <Bar dataKey="value" fill="hsl(var(--primary))" radius={[2,2,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
