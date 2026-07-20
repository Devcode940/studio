"use client";

import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAdmin } from '@/hooks/useAdmin';
import { SAMPLE_COB_CSV, parseCoBCSV, calculateCoBScoringImpact } from '@/lib/controller-of-budget';
import { ingestCoBCSVAction } from '@/app/actions/admin';
import { Loader2, Upload, FileText, Download, Scale, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function CoBPage() {
  const { isAuthorized } = useAdmin(true);
  const [csv, setCsv] = useState(SAMPLE_COB_CSV);
  const [preview, setPreview] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handlePreview = () => {
    try {
      const parsed = parseCoBCSV(csv);
      setPreview(parsed);
      toast({ title: 'CoB CSV Valid', description: `${parsed.length} reports parsed` });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Parse Failed', description: err.message });
    }
  };

  const handleIngest = async () => {
    setIsLoading(true);
    try {
      const res = await ingestCoBCSVAction(csv);
      toast({ title: res.success ? 'CoB Ingested – Independent Truth' : 'Failed', description: res.message, variant: res.success ? 'default' : 'destructive' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Ingest Failed', description: err.message });
    }
    setIsLoading(false);
  };

  if (!isAuthorized) return null;

  const chartData = preview?.map(r => ({
    name: r.county.substring(0,10),
    approved: r.approvedBudget / 1_000_000_000,
    actual: r.actualExpenditure / 1_000_000_000,
    pending: r.pendingBills / 1_000_000_000,
    variance: r.budgetVariance,
  })) || [];

  return (
    <MainLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-headline flex items-center gap-2"><Scale className="h-8 w-8 text-primary" /> Controller of Budget – Budget vs Actual (Don't Trust Executive)</h1>
            <p className="text-muted-foreground">Independent Article 228 – Checks executive spending. CoB actual = truth, Executive budget = claim. Gap = distrust.</p>
          </div>
          <Button asChild variant="outline"><Link href="/dashboard/admin">Back</Link></Button>
        </div>

        <Card className="border-blue-200 bg-blue-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800"><AlertTriangle className="h-5 w-5" /> Why CoB Independent Matters (Don't Trust Executive)</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-800 space-y-2">
            <p><strong>Executive says:</strong> "We approved KSh 40B budget, prudent spending"</p>
            <p><strong>CoB says (independent):</strong> Actual exchequer releases KSh 30B, actual expenditure KSh 28B, pending bills KSh 1.2B – Gap 30% variance</p>
            <p><strong>Trust Weights:</strong> CoB 1.5x (independent) vs Executive budget claim 0.4x (lowest). High variance &gt;15% = -5 integrity, pending bills &gt;1B = -10 integrity for Governor.</p>
            <p><strong>Source:</strong> <a href="https://cob.go.ke/reports/" target="_blank" className="underline">cob.go.ke/reports</a> – County Budget Implementation Review Reports (Quarterly), National Government BIRR</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>CoB Reports CSV Ingest</CardTitle>
            <CardDescription>Format: county,year,quarter,approvedBudget,exchequerReleases,actualExpenditure,pendingBills,travelSpend,developmentBudget,developmentActual,sourceUrl</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea value={csv} onChange={e=>setCsv(e.target.value)} rows={10} className="font-mono text-xs" />
            <div className="flex gap-2">
              <Button onClick={handlePreview} variant="outline" className="flex-1"><FileText className="h-4 w-4 mr-2" /> Preview</Button>
              <Button onClick={()=>setCsv(SAMPLE_COB_CSV)} variant="outline"><Download className="h-4 w-4 mr-2" /> Sample</Button>
              <Button onClick={handleIngest} disabled={isLoading || !preview} className="flex-1">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />} Ingest {preview?.length || 0} Reports
              </Button>
            </div>

            {preview && chartData.length > 0 && (
              <>
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-sm">Budget vs Actual – Visual Distrust (Executive Claim vs CoB Truth)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis label={{ value: 'KSh Billions', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="approved" name="Approved Budget (Executive Claim 0.4x)" fill="#94a3b8" />
                        <Bar dataKey="actual" name="Actual Expenditure (CoB Truth 1.5x)" fill="hsl(var(--primary))" />
                        <Bar dataKey="pending" name="Pending Bills" fill="#ef4444" />
                      </BarChart>
                    </ResponsiveContainer>
                    <p className="text-xs text-muted-foreground mt-2">Gap between approved and actual = executive not trustworthy. Pending bills red = citizenship burden.</p>
                  </CardContent>
                </Card>

                <div className="border rounded p-3 max-h-96 overflow-auto space-y-2">
                  <h4 className="font-semibold text-sm">Preview ({preview.length}) – Scoring Impact:</h4>
                  {preview.map((r, idx) => {
                    const scoring = calculateCoBScoringImpact(r);
                    return (
                      <div key={idx} className="text-xs border-b pb-2">
                        <div className="flex justify-between"><strong>{r.county} {r.year} {r.quarter}</strong> <Badge variant={scoring.isHighVariance ? 'destructive' : 'secondary'}>Variance {r.budgetVariance}%</Badge></div>
                        <div>Approved: {(r.approvedBudget/1e9).toFixed(1)}B | Actual: {(r.actualExpenditure/1e9).toFixed(1)}B | Pending: {(r.pendingBills/1e9).toFixed(1)}B | Absorption: {r.absorptionRate}%</div>
                        <div className="mt-1">
                          <span className={`px-1 rounded ${scoring.isHighVariance ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{scoring.isHighVariance ? '⚠️ High variance >15% → -5 integrity' : '✅ Variance OK'}</span>
                          <span className={`ml-2 px-1 rounded ${scoring.isHighPendingBills ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{scoring.isHighPendingBills ? '⚠️ Pending >1B → -10 integrity' : 'Pending OK'}</span>
                        </div>
                        <a href={r.sourceUrl} target="_blank" className="text-primary underline text-xs">Source PDF CoB</a>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">How to Get Real CoB Data</CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-1">
            <ol className="list-decimal list-inside space-y-1">
              <li>Go to <a href="https://cob.go.ke/reports/" target="_blank" className="text-primary underline">cob.go.ke/reports</a> → County Budget Implementation Review Reports (CBIRR) + National BIRR</li>
              <li>Download PDFs for Q1-Q4, e.g., Nairobi County BIRR Q1 2023-2024.pdf</li>
              <li>Find tables: Approved Budget, Exchequer Releases, Actual Expenditure, Pending Bills, Travel, Development Budget vs Actual</li>
              <li>Copy to CSV with sourceUrl = PDF URL</li>
              <li>Upload via this page → creates <code>cob_reports/{"{county-year-quarter}"}</code> + contributes to integrity scoring (high variance, pending bills) + performance (absorption rate)</li>
              <li>UI: County page will show BarChart Budget vs Actual – gap visual distrust</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
