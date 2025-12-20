'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore } from '@/firebase';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection } from 'firebase/firestore';
import { PlusCircle, Loader2 } from 'lucide-react';
import type { PerformanceMetric } from '@/types';

const performanceMetricSchema = z.object({
  name: z.string().min(3, 'Metric name is required.'),
  value: z.string().min(1, 'Metric value is required.'), // Taking as string to be flexible
  unit: z.string().optional(),
  description: z.string().optional(),
  source: z.string().optional(),
  trend: z.enum(['up', 'down', 'stable', '']).optional(),
});

type PerformanceMetricFormValues = z.infer<typeof performanceMetricSchema>;

interface AddPerformanceMetricProps {
  representativeId: string;
}

export function AddPerformanceMetric({ representativeId }: AddPerformanceMetricProps) {
  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<PerformanceMetricFormValues>({
    resolver: zodResolver(performanceMetricSchema),
    defaultValues: {
      name: '',
      value: '',
      unit: '',
      description: '',
      source: '',
      trend: '',
    },
  });

  async function onSubmit(data: PerformanceMetricFormValues) {
    setIsLoading(true);
    
    // Convert value to number if possible
    const numericValue = !isNaN(Number(data.value)) ? Number(data.value) : data.value;

    const newMetric: Omit<PerformanceMetric, 'id'> = {
      ...data,
      value: numericValue,
      trend: data.trend === '' ? undefined : (data.trend as 'up' | 'down' | 'stable' | undefined),
    };

    if (!firestore) {
        toast({ variant: 'destructive', title: 'Error', description: 'Database service not available.' });
        setIsLoading(false);
        return;
    }

    try {
        const metricsCollection = collection(firestore, 'representatives', representativeId, 'performance_metrics');
        // This is a non-blocking call
        addDocumentNonBlocking(metricsCollection, newMetric);

        toast({
            title: 'Metric Submitted',
            description: `${data.name} has been added for review. It will appear shortly.`,
        });
        form.reset();
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Submission Failed',
            description: (error as Error).message || 'An unexpected error occurred.',
        });
    } finally {
        setIsLoading(false);
    }
  }

  if (!user) {
    return (
      <Card className="mt-6 bg-secondary/50">
        <CardHeader>
          <CardTitle className="font-headline text-lg">Contribute Data</CardTitle>
          <CardDescription>
            You must be logged in to add performance metrics.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="mt-6 border-dashed border-primary shadow-sm">
      <CardHeader>
        <CardTitle className="font-headline text-xl flex items-center">
            <PlusCircle className="mr-2 h-6 w-6 text-primary"/>
            Add a New Performance Metric
        </CardTitle>
        <CardDescription>
          Contribute to this representative's profile by adding a relevant performance indicator.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Metric Name</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., CDF Fund Utilization" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                    control={form.control}
                    name="value"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Value</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., 85" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                     <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Unit</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., % or KSh" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Briefly describe what this metric represents." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Source (Optional)</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., Auditor General Report 2023" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                    control={form.control}
                    name="trend"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Trend (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a trend" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="stable">Stable</SelectItem>
                                <SelectItem value="up">Trending Up</SelectItem>
                                <SelectItem value="down">Trending Down</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                </>
              ) : (
                'Submit Metric'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
