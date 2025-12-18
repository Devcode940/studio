
'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DownloadCloud, Loader2, Server, FileJson } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fetchEconomicDataAction } from '@/app/actions/aiActions';
import type { FetchEconomicDataOutput } from '@/ai/flows/fetch-economic-data';

export default function DataManagementPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<FetchEconomicDataOutput | null>(null);
  const { toast } = useToast();

  const handleFetchData = async () => {
    setIsLoading(true);
    setResult(null);
    try {
      const actionResult = await fetchEconomicDataAction();
      if (actionResult.success && actionResult.data) {
        setResult(actionResult.data);
        toast({
          title: 'Data Fetch Successful',
          description: actionResult.data.summary,
        });
      } else {
        throw new Error(actionResult.error || 'Failed to fetch data.');
      }
    } catch (error) {
      console.error('Error fetching economic data:', error);
      toast({
        variant: 'destructive',
        title: 'Error Fetching Data',
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
                        Fetch the latest County GDP and Census data.
                    </CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This tool simulates fetching the most recent economic data from an external API (like the Kenya National Bureau of Statistics). Clicking the button will trigger an AI flow that retrieves the data.
              <br />
              <strong>Note:</strong> In a real-world application, this process would securely update the Firestore database. For this demo, it just displays the fetched data.
            </p>
          </CardContent>
          <CardFooter className="flex-col items-start gap-4">
            <Button onClick={handleFetchData} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fetching Data...
                </>
              ) : (
                <>
                  <DownloadCloud className="mr-2 h-4 w-4" />
                  Fetch Latest Economic Data
                </>
              )}
            </Button>

            {result && (
              <div className="w-full pt-4 border-t">
                 <h3 className="font-headline text-lg font-semibold mb-2 flex items-center">
                    <FileJson className="mr-2 h-5 w-5 text-primary" />
                    Fetched Data
                </h3>
                <p className="text-sm mb-4 italic text-muted-foreground">{result.summary}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h4 className="font-semibold mb-2">New GDP Data:</h4>
                        <pre className="text-xs p-4 bg-muted rounded-md max-h-60 overflow-auto">
                            {JSON.stringify(result.newGdpData, null, 2)}
                        </pre>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2">New Census Data:</h4>
                        <pre className="text-xs p-4 bg-muted rounded-md max-h-60 overflow-auto">
                            {JSON.stringify(result.newCensusData, null, 2)}
                        </pre>
                    </div>
                </div>
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
    </MainLayout>
  );
}
