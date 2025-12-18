
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { factCheckRepresentativeAction } from '@/app/actions/aiActions';
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileText, ShieldAlert, Wand2 } from "lucide-react";
import type { Representative } from '@/types';

interface IntegrityReportGeneratorProps {
  representative: Representative;
}

export function IntegrityReportGenerator({ representative }: IntegrityReportGeneratorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const { toast } = useToast();

  async function handleGenerate() {
    setIsLoading(true);
    setReport(null);
    try {
      const result = await factCheckRepresentativeAction({
        name: representative.name,
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
            <CardDescription>
              Generate a real-time summary of news articles for {representative.name}.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Click the button below to use AI to search for recent, reputable news articles concerning this representative and generate a summary of potential integrity issues. This process may take a moment.
        </p>
      </CardContent>
      <CardFooter className="flex-col items-start gap-4">
        <Button onClick={handleGenerate} disabled={isLoading} className="w-full sm:w-auto">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-4 w-4" />
              Generate Real-time Report
            </>
          )}
        </Button>
        
        {report && (
          <div className="w-full pt-4 border-t">
            <h3 className="font-headline text-lg font-semibold mb-2 flex items-center">
              <FileText className="mr-2 h-5 w-5 text-primary" />
              Generated Integrity Summary
            </h3>
            <div className="prose prose-sm max-w-none rounded-md border bg-muted/50 p-4">
              <p>{report}</p>
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
