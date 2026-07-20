"use client";

import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAdmin } from '@/hooks/useAdmin';
import { SAMPLE_JUDICIARY_CSV, parseJudiciaryCSV, calculateJudiciaryScoringImpact } from '@/lib/judiciary';
import { ingestJudiciaryCSVAction } from '@/app/actions/admin';
import { Loader2, Upload, FileText, Download, Scale, Gavel } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export default function JudiciaryPage() {
  const { isAuthorized } = useAdmin(true);
  const [csv, setCsv] = useState(SAMPLE_JUDICIARY_CSV);
  const [preview, setPreview] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handlePreview = () => {
    try {
      const parsed = parseJudiciaryCSV(csv);
      setPreview(parsed);
      toast({ title: 'Judiciary CSV Valid', description: `${parsed.length} cases parsed` });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Parse Failed', description: err.message });
    }
  };

  const handleIngest = async () => {
    setIsLoading(true);
    try {
      const res = await ingestJudiciaryCSVAction(csv);
      toast({ title: res.success ? 'Judiciary Checks Ingested – Executive Lost' : 'Failed', description: res.message, variant: res.success ? 'default' : 'destructive' });
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
            <h1 className="text-3xl font-bold font-headline flex items-center gap-2"><Gavel className="h-8 w-8 text-primary" /> Judiciary Checks – Cases Where Executive Lost</h1>
            <p className="text-muted-foreground">Independent Article 160 – Best proof executive not trustworthy. Judiciary strikes down executive action → verified scandal.</p>
          </div>
          <Button asChild variant="outline"><Link href="/dashboard/admin">Back</Link></Button>
        </div>

        <Card className="border-purple-200 bg-purple-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-800"><Scale className="h-5 w-5" /> Why Judiciary is Primary (1.5x) vs Executive 0.4x</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-purple-800 space-y-2">
            <p><strong>Executive says:</strong> "Executive Order No 1 reorganizing Cabinet is lawful"</p>
            <p><strong>Judiciary says (Supreme Court):</strong> "Struck down – violates Article 152" – Source: kenyalaw.org/caselaw</p>
            <p><strong>Trust:</strong> Judiciary 1.5x independent vs Executive 0.4x. Each struck down = +1-2 verified scandals, -5 to -10 integrity for executive who issued order.</p>
            <p><strong>Examples:</strong> Governor Sakaja Finance Bill declared unconstitutional for lack of public participation, Governor Mandago ignored County Assembly summons – court ordered compliance, President Ruto Executive Order struck down.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Judiciary Checks CSV Ingest</CardTitle>
            <CardDescription>Format: caseTitle,caseNumber,court,county,executive,executivePosition,decision,decisionDate,impact,kenyaLawUrl,summary,isUnconstitutional,unconstitutionalReason</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea value={csv} onChange={e=>setCsv(e.target.value)} rows={12} className="font-mono text-xs" />
            <div className="flex gap-2">
              <Button onClick={handlePreview} variant="outline" className="flex-1"><FileText className="h-4 w-4 mr-2" /> Preview</Button>
              <Button onClick={()=>setCsv(SAMPLE_JUDICIARY_CSV)} variant="outline"><Download className="h-4 w-4 mr-2" /> Sample</Button>
              <Button onClick={handleIngest} disabled={isLoading || !preview} className="flex-1 bg-purple-600 hover:bg-purple-700">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />} Ingest {preview?.length || 0} Cases
              </Button>
            </div>

            {preview && (
              <div className="border rounded p-3 max-h-96 overflow-auto space-y-3">
                <h4 className="font-semibold text-sm">Preview ({preview.length}) – Scoring Impact:</h4>
                {preview.map((c, idx) => {
                  const scoring = calculateJudiciaryScoringImpact(c);
                  return (
                    <div key={idx} className="text-xs border-b pb-2">
                      <div className="font-medium">{c.caseTitle} <Badge className={c.decision==='Executive Action Struck Down'?'bg-red-600':'bg-yellow-600'}>{c.decision}</Badge></div>
                      <div>Executive: {c.executive} ({c.executivePosition}) – {c.county || 'National'} – Court: {c.court} – Date: {c.decisionDate}</div>
                      <div className="text-muted-foreground">Summary: {c.summary.slice(0,120)}...</div>
                      {c.isUnconstitutional && <div className="text-red-600">⚠️ Unconstitutional: {c.unconstitutionalReason}</div>}
                      <div className="mt-1">
                        <span className="bg-red-100 text-red-800 px-1 rounded">Verified scandals: +{scoring.verifiedScandals} | Integrity: {scoring.integrity}</span>
                        <span className="ml-2 bg-purple-100 text-purple-800 px-1 rounded">Impact: {c.impact} | Trust 1.5x Judiciary vs 0.4x Executive</span>
                      </div>
                      <a href={c.kenyaLawUrl} target="_blank" className="text-primary underline">Kenya Law Source</a>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">How to Get Real Kenya Law Data</CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-1">
            <ol className="list-decimal list-inside space-y-1">
              <li>Go to <a href="https://kenyalaw.org/caselaw/" target="_blank" className="text-primary underline">kenyalaw.org/caselaw</a> → Search "County Government" OR "Governor" OR "President" + filter High Court, 2023-2024</li>
              <li>Find cases where executive lost: e.g., "Petition 12 of 2024 – Okiya Omtatah vs Governor Sakaja" – read judgment, extract decision Struck Down, isUnconstitutional true, reason No public participation</li>
              <li>Copy to CSV with kenyaLawUrl = case URL</li>
              <li>Upload via this page → creates <code>judiciary_checks/{"{caseTitle-year}"}</code> + contributes to integrity: Struck Down = +1-2 verified scandals, -5 to -10 integrity for executive slug</li>
              <li>UI: Rep profile Integrity tab will show "Judiciary Checks: Lost 2 cases (Source: Kenya Law)" – trust Judiciary 1.5x</li>
              <li>Scraper: Future implement <code>src/lib/judiciary.ts fetchKenyaLawCases()</code> with cheerio – for now manual CSV is auditable and legal</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
