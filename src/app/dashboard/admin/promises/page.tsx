"use client";

import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAdmin } from '@/hooks/useAdmin';
import { SAMPLE_PROMISES_CSV, parsePromisesCSV, calculatePromiseScoringImpact } from '@/lib/executive-promises';
import { ingestPromisesCSVAction } from '@/app/actions/admin';
import { Loader2, Upload, FileText, Download, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export default function PromisesPage() {
  const { isAuthorized } = useAdmin(true);
  const [csv, setCsv] = useState(SAMPLE_PROMISES_CSV);
  const [preview, setPreview] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handlePreview = () => {
    try {
      const parsed = parsePromisesCSV(csv);
      setPreview(parsed);
      toast({ title: 'Promises CSV Valid', description: `${parsed.length} promises parsed` });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Parse Failed', description: err.message });
    }
  };

  const handleIngest = async () => {
    setIsLoading(true);
    try {
      const res = await ingestPromisesCSVAction(csv);
      toast({ title: res.success ? 'Promises Ingested – Don\'t Trust Executive' : 'Failed', description: res.message, variant: res.success ? 'default' : 'destructive' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Ingest Failed', description: err.message });
    }
    setIsLoading(false);
  };

  if (!isAuthorized) return null;

  return (
    <MainLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-headline">Executive Promises vs Delivery (Don't Trust Executive)</h1>
            <p className="text-muted-foreground">Principle: Executive claim 0.4x (lowest) – requires OAG 1.5x or citizen photo 1.0x verification to score. Broken = -10 integrity.</p>
          </div>
          <Button asChild variant="outline"><Link href="/dashboard/admin">Back</Link></Button>
        </div>

        <Card className="border-red-200 bg-red-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800"><AlertTriangle className="h-5 w-5" /> Why Don't Trust Executive?</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-red-800 space-y-2">
            <p><strong>Executive controls information flow</strong> – State House, County Executive press releases claim success. Independent verification via OAG (audit), CoB (budget actual), citizen photo, Judiciary checks shows truth.</p>
            <p><strong>Trust Weights:</strong> Executive 0.4x (lowest, never scores alone) vs OAG 1.5x primary + citizen photo 1.0x + media 0.8x. Completed promise only +5 performance if verified by independent source.</p>
            <p><strong>Example:</strong> Governor says "Built 20 markets" (0.4x) – No points until OAG report or citizen geotagged photo verifies. If broken after deadline, -10 integrity.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Executive Promises CSV Ingest</CardTitle>
            <CardDescription>Format: who,whoPosition,county,promise,category,datePromised,deadline,sourceUrl,sourceType,status,progress</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea value={csv} onChange={e=>setCsv(e.target.value)} rows={12} className="font-mono text-xs" />
            <div className="flex gap-2">
              <Button onClick={handlePreview} variant="outline" className="flex-1"><FileText className="h-4 w-4 mr-2" /> Preview</Button>
              <Button onClick={()=>setCsv(SAMPLE_PROMISES_CSV)} variant="outline"><Download className="h-4 w-4 mr-2" /> Sample</Button>
              <Button onClick={handleIngest} disabled={isLoading || !preview} className="flex-1 bg-red-600 hover:bg-red-700">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />} Ingest {preview?.length || 0} Promises
              </Button>
            </div>

            {preview && (
              <div className="border rounded p-3 max-h-96 overflow-auto space-y-3">
                <h4 className="font-semibold text-sm">Preview ({preview.length}) – Scoring Impact with Distrust Principle:</h4>
                {preview.map((p, idx) => {
                  const scoring = calculatePromiseScoringImpact(p);
                  return (
                    <div key={idx} className="text-xs border-b pb-2">
                      <div className="flex justify-between items-start">
                        <strong>{p.who} ({p.whoPosition}) – {p.promise.slice(0,60)}...</strong>
                        <Badge className={p.status==='Completed'?'bg-green-600': p.status==='Broken'?'bg-red-600': p.status==='In Progress'?'bg-yellow-600':'bg-gray-500'}>{p.status} {p.progress}%</Badge>
                      </div>
                      <div className="text-muted-foreground">Category: {p.category} | County: {p.county || 'National'} | Deadline: {p.deadline || 'N/A'}</div>
                      <div className="mt-1 flex gap-2">
                        <span className="bg-red-100 text-red-800 px-1 rounded">Executive 0.4x: {p.sourceType}</span>
                        <span className="bg-green-100 text-green-800 px-1 rounded">Trust Used: {scoring.trustWeight}x</span>
                        <span className="bg-blue-100 text-blue-800 px-1 rounded">Perf: {scoring.performance>=0?'+':''}{scoring.performance} | Integ: {scoring.integrity}</span>
                      </div>
                      <div className="text-xs mt-1">Source: <a href={p.sourceUrl} target="_blank" className="text-primary underline">{p.sourceUrl.slice(0,50)}...</a></div>
                      {p.status==='Broken' && <div className="text-red-600 font-medium">⚠️ Broken = -10 integrity regardless of verification</div>}
                      {p.status==='Completed' && scoring.performance===0 && <div className="text-yellow-600">⚠️ Completed but no independent verification (OAG/photo) – 0 points until verified. Don't trust executive alone.</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">How to Get Real Promises Data</CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-1">
            <ol className="list-decimal list-inside space-y-1">
              <li>Manifesto: President Ruto 2022 manifesto PDF → extract 100 promises → CSV</li>
              <li>State House speeches: <a href="https://www.president.go.ke/" target="_blank" className="text-primary underline">president.go.ke</a> – speech transcripts – promise extraction</li>
              <li>Governor speeches: County websites – Google "Governor Sakaja promises" → Citizen/NTV reporting promise (media 0.8x) → capture sourceUrl</li>
              <li>Upload CSV → creates <code>executive_promises/{"{who-promise-year}"}</code> – public can view at <code>/promises</code> (to be built)</li>
              <li>Citizen verification: Upload geotagged photo of claimed market/road → admin verifies evidence → updates promise status to Completed with trustWeight 1.0x (photo) or 1.5x (OAG)</li>
              <li>Scoring: Broken always -10 integrity. Completed only +5 if verified by OAG/CoB/photo, else 0. Distrust principle enforced in code.</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
