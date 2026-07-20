"use client";

import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAdmin } from '@/hooks/useAdmin';
import { ingestCountyGDPCSVAction, ingestCensusCSVAction } from '@/app/actions/admin';
import { SAMPLE_GDP_CSV, SAMPLE_CENSUS_CSV } from '@/lib/knbs';
import { Loader2, Upload, FileText, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function GdpIngestPage() {
  const { isAuthorized } = useAdmin(true);
  const [gdpCsv, setGdpCsv] = useState(SAMPLE_GDP_CSV);
  const [censusCsv, setCensusCsv] = useState(SAMPLE_CENSUS_CSV);
  const [isGdpLoading, setIsGdpLoading] = useState(false);
  const [isCensusLoading, setIsCensusLoading] = useState(false);
  const [gdpResult, setGdpResult] = useState<any>(null);
  const [censusResult, setCensusResult] = useState<any>(null);
  const { toast } = useToast();

  const handleGdpIngest = async () => {
    setIsGdpLoading(true);
    const res = await ingestCountyGDPCSVAction(gdpCsv);
    setGdpResult(res);
    setIsGdpLoading(false);
    toast({ title: res.success ? 'GDP Ingested' : 'Failed', description: res.message, variant: res.success ? 'default' : 'destructive' });
  };

  const handleCensusIngest = async () => {
    setIsCensusLoading(true);
    const res = await ingestCensusCSVAction(censusCsv);
    setCensusResult(res);
    setIsCensusLoading(false);
    toast({ title: res.success ? 'Census Ingested' : 'Failed', description: res.message, variant: res.success ? 'default' : 'destructive' });
  };

  if (!isAuthorized) return null;

  return (
    <MainLayout>
      <div className="space-y-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-headline">GDP & Census Ingest (KNBS)</h1>
            <p className="text-muted-foreground">Real pipeline: KNBS has no API, so admin CSV upload is production truth – auditable, source-attributed</p>
          </div>
          <Button asChild variant="outline"><Link href="/dashboard/admin">Back</Link></Button>
        </div>

        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800"><FileText className="h-5 w-5" /> Why CSV Upload?</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-yellow-800">
            <p>KNBS per FAQ: "All data only available in PDF for download. No APIs." So we parse PDFs manually or use County Reports, then upload CSV. Each record stores source field (e.g., "KNBS 2025 Facts and Figures pg 12"). This is honest, auditable, compliant with Data Protection.</p>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" /> County GDP CSV</CardTitle>
              <CardDescription>Header: county,gdpMillionsKsh,gdpPerCapitaKsh,year,source</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea value={gdpCsv} onChange={e=>setGdpCsv(e.target.value)} rows={10} className="font-mono text-xs" />
              <div className="flex gap-2">
                <Button onClick={handleGdpIngest} disabled={isGdpLoading} className="flex-1">
                  {isGdpLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />} Ingest GDP ({gdpCsv.split('\n').length-1} records)
                </Button>
                <Button variant="outline" onClick={()=>setGdpCsv(SAMPLE_GDP_CSV)}><Download className="h-4 w-4 mr-2" /> Sample</Button>
              </div>
              {gdpResult && (
                <div className={`p-3 rounded text-sm ${gdpResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                  {gdpResult.message}{gdpResult.error && ` – ${gdpResult.error}`}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" /> Census CSV</CardTitle>
              <CardDescription>Header: county,totalPopulation,malePopulation,... year,source</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea value={censusCsv} onChange={e=>setCensusCsv(e.target.value)} rows={10} className="font-mono text-xs" />
              <div className="flex gap-2">
                <Button onClick={handleCensusIngest} disabled={isCensusLoading} className="flex-1">
                  {isCensusLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />} Ingest Census ({censusCsv.split('\n').length-1} records)
                </Button>
                <Button variant="outline" onClick={()=>setCensusCsv(SAMPLE_CENSUS_CSV)}><Download className="h-4 w-4 mr-2" /> Sample</Button>
              </div>
              {censusResult && (
                <div className={`p-3 rounded text-sm ${censusResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                  {censusResult.message}{censusResult.error && ` – ${censusResult.error}`}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>How to Get Real KNBS Data</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <ol className="list-decimal list-inside space-y-1">
              <li>Download PDF from <a href="https://www.knbs.or.ke" target="_blank" className="text-primary underline">knbs.or.ke</a> → "2025 Economic Survey" or "Facts and Figures"</li>
              <li>Use <code>pdf-parse</code> or manual copy table to Excel, save as CSV with header above</li>
              <li>Validate via preview, add source column with page number</li>
              <li>Upload via this page – generates deterministic ID `{`{county-year}`}` to avoid duplicates, `merge:true`</li>
              <li>Audit logged in `admin_audit` collection</li>
            </ol>
            <p className="text-muted-foreground">Future: openAfrica CKAN API proxy at <code>https://open.africa/api/3/action/package_search?q=county+gdp</code></p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
