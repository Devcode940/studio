
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { generateSocialHighlightsAction } from '@/app/actions/aiActions';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Rss, Wand2, Twitter } from "lucide-react";
import type { Representative } from '@/types';

interface SocialHighlightsGeneratorProps {
  representative: Representative;
}

export function SocialHighlightsGenerator({ representative }: SocialHighlightsGeneratorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const canGenerate = representative.contactInfo?.twitter;

  async function handleGenerate() {
    if (!canGenerate) return;

    setIsLoading(true);
    try {
      const result = await generateSocialHighlightsAction({
        representativeId: representative.id,
        representativeName: representative.name,
        twitterHandle: representative.contactInfo.twitter,
      });

      if (result.success && result.data) {
        toast({
          title: "Social Highlights Updated",
          description: result.data.summary,
        });
      } else {
        throw new Error(result.error || "Failed to generate highlights.");
      }
    } catch (error) {
      console.error("Error generating social highlights:", error);
      toast({
        variant: "destructive",
        title: "Error Generating Highlights",
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
          <Rss className="h-8 w-8 text-primary" />
          <div>
            <CardTitle className="font-headline text-xl">AI-Powered Social Media Feed</CardTitle>
            <CardDescription>
              Generate key highlights from {representative.name}'s recent social media activity.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          This tool simulates fetching recent posts from the representative's X (Twitter) account and uses AI to extract and save notable highlights like project launches, statements, and achievements.
        </p>
        {!canGenerate && (
            <p className="mt-4 text-sm font-medium text-amber-600">
                A verified X (Twitter) handle is not available for this representative, so highlights cannot be generated.
            </p>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleGenerate} disabled={isLoading || !canGenerate} className="w-full sm:w-auto">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Highlights...
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-4 w-4" />
              Generate from X Feed <Twitter className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
