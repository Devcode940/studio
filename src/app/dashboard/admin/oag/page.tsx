"use client";

import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdmin } from '@/hooks/useAdmin';
import { SAMPLE_OAG_CSV, parseOAGCSV } from '@/lib/auditor-general';
import { SAMPLE_BILLS_CSV, parseBillsCSV } from '@/lib/attorney-general';
import { ingestOAGCSVAction, ingestBillsCSVAction } from '@/app/actions/admin';
import { Loader2, Upload, FileText, Download, Shield, Scale, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function OAGAdminPage() {
  const { isAuthorized } = useAdmin(true);
  const [oagCsv, setOagCsv] = useState(SAMPLE_OAG_CSV);
  const [billsCsv, setBillsCsv] = useState(SAMPLE_BILLS_CSV);
  const [isOagLoading, setIsOagLoading] = useState(false);
  const [isBillsLoading, setIsBillsLoading] = useState(false);
  const [oagPreview, setOagPreview] = useState<any[] | null>(null);
  const [billsPreview, setBillsPreview] = useState<any[] | null>(null);
  const { toast } = useToast();

  const handleOagPreview = () => {
    try {
      const parsed = parseOAGCSV(oagCsv);
      setOagPreview(parsed);
      toast({ title: 'OAG CSV Valid', description: `${parsed.length} reports parsed, ready to ingest` });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'OAG Parse Failed', description: err.message });
    }
  };

  const handleBillsPreview = () => {
    try {
      const parsed = parseBillsCSV(billsCsv);
      setBillsPreview(parsed);
      toast({ title: 'Bills CSV Valid', description: `${parsed.length} bills parsed` });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Bills Parse Failed', description: err.message });
    }
  };

  const handleOagIngest = async () => {
    setIsOagLoading(true);
    try {
      const res = await ingestOAGCSVAction(oagCsv);
      toast({ title: res.success ? 'OAG Ingested – Primary Source' : 'Failed', description: res.message, variant: res.success ? 'default' : 'destructive' });
      if (res.success) setOagPreview(parseOAGCSV(oagCsv));
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'OAG Ingest Failed', description: err.message });
    }
    setIsOagLoading(false);
  };

  const handleBillsIngest = async () => {
    setIsBillsLoading(true);
    try {
      const res = await ingestBillsCSVAction(billsCsv);
      toast({ title: res.success ? 'Bills Ingested – AG Primary' : 'Failed', description: res.message, variant: res.success ? 'default' : 'destructive' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Bills Ingest Failed', description: err.message });
    }
    setIsBillsLoading(false);
  };

  if (!isAuthorized) return null;

  return (
    <MainLayout>
      <div className="space-y-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" /> Office of Auditor General & Attorney General
            </h1>
            <p className="text-muted-foreground">Primary sources for integrity (OAG) & legislative activity (AG) – weight 1.5x in scoring v2.1</p>
          </div>
          <Button asChild variant="outline"><Link href="/dashboard/admin">Back</Link></Button>
        </div>

        <Card className="border-green-200 bg-green-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800"><Shield className="h-5 w-5" /> Why OAG & AG are Primary (Not Citizen/NTV)</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-green-800 space-y-2">
            <p><strong>Auditor General (oagkenya.go.ke):</strong> Audits NG-CDF (290 constituencies), 47 county executives, 47 county assemblies. Each PDF has audit opinion (Unqualified/Qualified/Adverse), unsupported expenditure, irregular procurement, pending bills. This is <strong>verifiable scandal</strong> for integrity score, and <strong>CDF utilization %</strong> for performance. Weight 1.5x vs user-submitted 0.8x.</p>
            <p><strong>Attorney General (statelaw.go.ke + kenyalaw.org):</strong> Reviews all bills before President assent, legal advisories on unconstitutional county laws. Source for <strong>billsSponsored, billsAssented, unconstitutionalCount</strong>. Weight 1.5x.</p>
            <p><strong>Media (Citizen, NTV, KTN):</strong> Secondary 0.8x – they republish OAG press releases but with interpretation. Use for cross-check, not primary scoring.</p>
          </CardContent>
        </Card>

        <Tabs defaultValue="oag" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="oag" className="flex items-center gap-2"><Shield className="h-4 w-4" /> Auditor General (OAG)</TabsTrigger>
            <TabsTrigger value="ag" className="flex items-center gap-2"><Scale className="h-4 w-4" /> Attorney General (AG) / Kenya Law</TabsTrigger>
          </TabsList>

          <TabsContent value="oag" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>OAG Audit Reports CSV Ingest</CardTitle>
                <CardDescription>Format: countyOrConstituency,year,auditOpinion,unsupportedExpenditure,irregularProcurement,pendingBills,cdfUtilization,keyIssues,sourceUrl,reportType</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea value={oagCsv} onChange={e=>setOagCsv(e.target.value)} rows={12} className="font-mono text-xs" />
                <div className="flex gap-2">
                  <Button onClick={handleOagPreview} variant="outline" className="flex-1"><FileText className="h-4 w-4 mr-2" /> Preview & Validate</Button>
                  <Button onClick={()=>setOagCsv(SAMPLE_OAG_CSV)} variant="outline"><Download className="h-4 w-4 mr-2" /> Sample</Button>
                  <Button onClick={handleOagIngest} disabled={isOagLoading || !oagPreview} className="flex-1">
                    {isOagLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />} Ingest {oagPreview?.length || 0} Reports
                  </Button>
                </div>

                {oagPreview && (
                  <div className="border rounded p-3 max-h-96 overflow-auto">
                    <h4 className="font-semibold text-sm mb-2">Preview ({oagPreview.length} reports):</h4>
                    <div className="space-y-2">
                      {oagPreview.map((r, idx) => (
                        <div key={idx} className="text-xs border-b pb-2">
                          <div className="flex justify-between"><strong>{r.countyOrConstituency}</strong> <span className={`px-2 py-0.5 rounded text-xs ${r.auditOpinion==='Unqualified'?'bg-green-100 text-green-800': r.auditOpinion==='Qualified'?'bg-yellow-100 text-yellow-800':'bg-red-100 text-red-800'}`}>{r.auditOpinion}</span></div>
                          <div>Year: {r.year} | CDF: {r.cdfUtilization ?? 'N/A'}% | Unsupported: KSh {(r.unsupportedExpenditure/1_000_000).toFixed(1)}M</div>
                          <div className="text-muted-foreground">Issues: {r.keyIssues.join('; ').slice(0,100)}...</div>
                          <a href={r.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">PDF Source <ExternalLink className="h-3 w-3" /></a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">How to Get Real OAG Reports</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-2">
                <ol className="list-decimal list-inside space-y-1">
                  <li>Go to <a href="https://www.oagkenya.go.ke/audit-reports/" target="_blank" className="text-primary underline">oagkenya.go.ke/audit-reports</a> → Categories: NG-CDF, County Governments, County Assemblies</li>
                  <li>Download PDFs (e.g., Westlands NG-CDF 2022-2023.pdf)</li>
                  <li>Open PDF, find: Audit Opinion (page 1), Unsupported Expenditure (Financial Statements notes), CDF Utilization (performance table)</li>
                  <li>Copy to CSV row with sourceUrl = PDF URL</li>
                  <li>Upload via this page → creates <code>audit_reports/{'{countyOrConstituency-year-reportType}'}</code> + updates representative's <code>performance_metrics</code> CDF metric + contributes to integrity score (Adverse = +2 verified scandals)</li>
                  <li>Audit logged in <code>admin_audit</code> collection</li>
                </ol>
                <p className="text-muted-foreground">For scale: Hire intern to parse 290 NG-CDF reports = 290 rows = 1 week work. That's your moat – no one else has structured OAG data.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ag" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>AG / Kenya Law Bills CSV Ingest</CardTitle>
                <CardDescription>Format: title,sponsor,year,status,type,sourceUrl,kenyaLawId,dateAssented,isUnconstitutional,unconstitutionalReason</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea value={billsCsv} onChange={e=>setBillsCsv(e.target.value)} rows={12} className="font-mono text-xs" />
                <div className="flex gap-2">
                  <Button onClick={handleBillsPreview} variant="outline" className="flex-1"><FileText className="h-4 w-4 mr-2" /> Preview & Validate</Button>
                  <Button onClick={()=>setBillsCsv(SAMPLE_BILLS_CSV)} variant="outline"><Download className="h-4 w-4 mr-2" /> Sample</Button>
                  <Button onClick={handleBillsIngest} disabled={isBillsLoading || !billsPreview} className="flex-1">
                    {isBillsLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />} Ingest {billsPreview?.length || 0} Bills
                  </Button>
                </div>

                {billsPreview && (
                  <div className="border rounded p-3 max-h-96 overflow-auto">
                    <h4 className="font-semibold text-sm mb-2">Preview ({billsPreview.length} bills):</h4>
                    {billsPreview.map((b, idx) => (
                      <div key={idx} className="text-xs border-b pb-2 mb-2">
                        <div className="font-medium">{b.title} <span className="text-muted-foreground">({b.year})</span> {b.isUnconstitutional && <span className="bg-red-100 text-red-800 px-1 rounded ml-2">Unconstitutional</span>}</div>
                        <div>Sponsor: {b.sponsor} | Status: {b.status} | Type: {b.type}</div>
                        {b.unconstitutionalReason && <div className="text-red-600">Reason: {b.unconstitutionalReason}</div>}
                        <a href={b.sourceUrl} target="_blank" className="text-primary hover:underline flex items-center gap-1">Source PDF <ExternalLink className="h-3 w-3" /></a>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">How to Get Real AG / Kenya Law Data</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-2">
                <ol className="list-decimal list-inside space-y-1">
                  <li>Kenya Law: <a href="https://kenyalaw.org/kl/index.php?id=TitleSearch&category=Bills" target="_blank" className="text-primary underline">kenyalaw.org Bills search</a> → filter by year 2023/2024 → download PDFs</li>
                  <li>State Law Office: <a href="https://www.statelaw.go.ke/resources/" target="_blank" className="text-primary underline">statelaw.go.ke/resources</a> → County bills that were declared unconstitutional (e.g., Kiambu Alcohol Bill) – high integrity value for Governor/MCA</li>
                  <li>For each bill, extract sponsor (MP name), status (Assented = high legislative score), isUnconstitutional (true = +1 verified scandal for sponsor)</li>
                  <li>Upload CSV → creates <code>bills/{'{title-year}'}</code> + updates rep's <code>billsSponsored</code> metric (weight 1.5x vs user metric 0.8x)</li>
                </ol>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="text-sm">Scoring Impact (v2.1) – OAG & AG as Primary Sources</CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-1 font-mono">
            <div>cdfUtilization = OAG 70% + other metrics 30% (OAG weight 1.5x)</div>
            <div>billsSponsored = count from AG bills (primary, overwrites user metric)</div>
            <div>verifiedScandals = integrity_reports + OAG Adverse/Qualified + AG unconstitutional</div>
            <div>Example: Westlands OAG Qualified + unsupported KSh 12M → +1 verified, CDF 67% vs user 85% → final CDF = 67*0.7 + 85*0.3 = 72%</div>
            <div>Transparency: Leaderboard entry stores scoringVersion + auditOpinionScore for audit</div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
