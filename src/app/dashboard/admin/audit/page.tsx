"use client";

import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAdmin } from '@/hooks/useAdmin';
import { getAuditLogsAction, getAIUsageStatsAction } from '@/app/actions/admin';
import { Loader2, Shield, Activity, Clock } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export default function AuditPage() {
  const { isAuthorized } = useAdmin(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [aiStats, setAiStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const [auditRes, aiRes] = await Promise.all([getAuditLogsAction(50), getAIUsageStatsAction()]);
      if (auditRes.success) setLogs(auditRes.data);
      if (aiRes.success) setAiStats(aiRes.data);
      setIsLoading(false);
    }
    if (isAuthorized) load();
  }, [isAuthorized]);

  if (!isAuthorized) return null;

  return (
    <MainLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-headline flex items-center gap-2"><Shield className="h-8 w-8 text-primary" /> Audit & Monitoring</h1>
            <p className="text-muted-foreground">Access control, AI usage, admin actions – for incident response & compliance</p>
          </div>
          <Button asChild variant="outline"><Link href="/dashboard/admin">Back</Link></Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" /> AI Usage Stats</CardTitle>
              <CardDescription>Rate limiting audit – who triggered AI</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : aiStats ? (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span>Total generations:</span><strong>{aiStats.total}</strong></div>
                  <div className="flex justify-between"><span>Last hour:</span><strong className={aiStats.lastHour > 20 ? 'text-red-600' : ''}>{aiStats.lastHour}</strong></div>
                  <div>
                    <strong>By Type:</strong>
                    <ul className="list-disc list-inside mt-1">
                      {Object.entries(aiStats.byType).map(([type, count]) => <li key={type}>{type}: {count as number}</li>)}
                    </ul>
                  </div>
                  <div>
                    <strong>Top Users (by UID):</strong>
                    <ul className="list-disc list-inside mt-1 max-h-32 overflow-auto">
                      {Object.entries(aiStats.byUser).slice(0,5).map(([uid, count]) => <li key={uid} className="truncate">{uid}: {count as number}</li>)}
                    </ul>
                  </div>
                  {aiStats.lastHour > 20 && <div className="bg-red-50 text-red-800 p-2 rounded text-xs">⚠️ High usage last hour – possible abuse. Review AI Governance controls.</div>}
                </div>
              ) : <p>No data</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monitoring Checklist</CardTitle>
              <CardDescription>Per Control Area: Monitoring & Incident Support</CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <label className="flex items-center gap-2"><input type="checkbox" checked readOnly /> Logs avoid PII (only uid, repId)</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked readOnly /> ai_usage collection audit trail</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked readOnly /> Admin audit logs</label>
              <label className="flex items-center gap-2"><input type="checkbox" /> GCP Monitoring dashboard provisioned – TODO</label>
              <label className="flex items-center gap-2"><input type="checkbox" /> Alerts assigned to @Devcode940 – TODO</label>
              <label className="flex items-center gap-2"><input type="checkbox" /> Cloud Logging sink – default via App Hosting</label>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" /> Admin Audit Logs (Last 50)</CardTitle>
            <CardDescription>All privileged actions – approve/reject highlights, GDP ingest, leaderboard recompute</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : logs.length === 0 ? (
              <p className="text-muted-foreground text-center py-10">No audit logs yet. Actions will appear here.</p>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-auto">
                {logs.map((log) => (
                  <div key={log.id} className="border rounded p-3 text-sm flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant={log.type?.includes('approved') ? 'default' : log.type?.includes('rejected') ? 'destructive' : 'secondary'}>{log.type}</Badge>
                        <span className="text-muted-foreground">{log.timestamp ? new Date(log.timestamp.seconds*1000).toLocaleString() : 'No timestamp'}</span>
                      </div>
                      <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-w-[600px]">{JSON.stringify(log, null, 2)}</pre>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Incident Response Procedure</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <ol className="list-decimal list-inside space-y-1">
              <li><strong>Detect:</strong> Monitor ai_usage lastHour spike, rule denials in Firestore usage, [MOCK] in prod logs</li>
              <li><strong>Triage:</strong> Create GitHub Issue label:incident, assign owner @Devcode940</li>
              <li><strong>Mitigate:</strong> git revert + firebase deploy --only firestore:rules + disable AI flow via env</li>
              <li><strong>Post-mortem:</strong> Add to docs/compliance/05_MONITORING_INCIDENT.md, update exception register</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
