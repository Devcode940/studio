
'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DownloadCloud, Loader2, Server, Database, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fetchEconomicDataAction } from '@/app/actions/aiActions';
import type { FetchEconomicDataOutput } from '@/ai/flows/fetch-economic-data';

export default function DataManagementPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<FetchEconomicDataOutput | null>(null);
  const { toast } = useToast();

  const handleFetchData = async () => {
    setIsLoading(true);
    setLastResult(null);
    try {
      const actionResult = await fetchEconomicDataAction();
      if (actionResult.success && actionResult.data) {
        setLastResult(actionResult.data);
        toast({
          title: 'Database Update Successful',
          description: actionResult.data.summary,
        });
      } else {
        throw new Error(actionResult.error || 'Failed to fetch and update data.');
      }
    } catch (error) {
      console.error('Error in data management action:', error);
      toast({
        variant: 'destructive',
        title: 'Error Updating Database',
        description: (error as Error).message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        <header>
          <h1 className="font-headline text-4xl font-bold text-primary tracking-tight">Data Management</h1>
          <p className="mt-2 text-lg text-foreground/80">
            Tools for updating the application&apos;s datasets from external sources.
          </p>
        </header>

        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
                <Server className="h-8 w-8 text-primary" />
                <div>
                    <CardTitle className="font-headline text-xl">Update Economic Data</CardTitle>
                    <CardDescription>
                        Fetch the latest County GDP and Census data and write it to the Firestore database.
                    </CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This tool simulates fetching the most recent economic data from an external API and writes the results directly to your Firestore database. This is a real database operation.
              <br />
              <strong>Note:</strong> Refreshing the County GDP or Census Data pages after running this will show the newly updated information.
            </p>
          </CardContent>
          <CardFooter className="flex-col items-start gap-4">
            <Button onClick={handleFetchData} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fetching & Saving...
                </>
              ) : (
                <>
                  <DownloadCloud className="mr-2 h-4 w-4" />
                  Update Database from Source
                </>
              )}
            </Button>

            {lastResult && (
              <div className="w-full pt-4 border-t">
                 <h3 className="font-headline text-lg font-semibold mb-2 flex items-center">
                    <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                    Update Complete
                </h3>
                <div className="p-4 bg-muted rounded-md text-sm">
                  <p>{lastResult.summary}</p>
                  <ul className="list-disc pl-5 mt-2">
                    <li><span className="font-semibold">{lastResult.gdpCount}</span> GDP records processed.</li>
                    <li><span className="font-semibold">{lastResult.censusCount}</span> Census records processed.</li>
                  </ul>
                </div>
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
    </MainLayout>
  );
}
