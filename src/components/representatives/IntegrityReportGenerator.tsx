
"use client";

import { useState } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { summarizeIntegrityReportAction } from '@/app/actions/aiActions'; // Will create this action
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileText, ShieldAlert } from "lucide-react";
import type { Representative } from '@/types';

const formSchema = z.object({
  newsSummary: z.string().min(50, {
    message: "News summary must be at least 50 characters.",
  }).max(5000, { message: "News summary must not exceed 5000 characters."}),
});

interface IntegrityReportGeneratorProps {
  representative: Representative;
}

export function IntegrityReportGenerator({ representative }: IntegrityReportGeneratorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newsSummary: representative.newsSummaryForAI || "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setReport(null);
    try {
      const result = await summarizeIntegrityReportAction({
        name: representative.name,
        newsSummary: values.newsSummary,
      });
      if (result.success && result.data) {
        setReport(result.data.integrityReport);
        toast({
          title: "Integrity Report Generated",
          description: "The AI-powered summary is now available.",
        });
      } else {
        throw new Error(result.error || "Failed to generate report.");
      }
    } catch (error) {
      console.error("Error generating integrity report:", error);
      toast({
        variant: "destructive",
        title: "Error Generating Report",
        description: (error as Error).message || "An unexpected error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <ShieldAlert className="h-8 w-8 text-primary" />
          <div>
            <CardTitle className="font-headline text-xl">AI-Powered Integrity Report</CardTitle>
            <CardDescription>Summarize verified news for {representative.name}.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="newsSummary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>News Summary Input</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Paste a summary of reputable news articles about the representative here (max 5000 characters)..."
                      className="min-h-[150px] resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide a concise summary of verified news from reputable sources. This will be used by AI to generate the integrity report.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Report"
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
      
      {report && (
        <div className="p-6 border-t">
          <h3 className="font-headline text-lg font-semibold mb-2 flex items-center">
            <FileText className="mr-2 h-5 w-5 text-primary" />
            Generated Integrity Summary
          </h3>
          <div className="prose prose-sm max-w-none rounded-md border bg-muted/50 p-4">
            <p>{report}</p>
          </div>
        </div>
      )}
    </Card>
  );
}
