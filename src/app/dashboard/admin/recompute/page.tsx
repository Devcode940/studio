"use client";

import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAdmin } from '@/hooks/useAdmin';
import { recomputeLeaderboardAction, getLeaderboardStatsAction } from '@/app/actions/leaderboard';
import { Loader2, BarChart3, RefreshCw, Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function RecomputePage() {
  const { isAuthorized } = useAdmin(true);
  const [isRecomputing, setIsRecomputing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const { toast } = useToast();

  const handleRecompute = async () => {
    setIsRecomputing(true);
    setResult(null);
    const res = await recomputeLeaderboardAction();
    setResult(res);
    setIsRecomputing(false);
    
    if (res.success) {
      toast({ title: 'Leaderboard Recomputed', description: `Scored ${res.count} representatives with ${res.version}` });
      // Refresh stats
      const s = await getLeaderboardStatsAction();
      if (s.success) setStats(s.data);
    } else {
      toast({ variant: 'destructive', title: 'Recompute Failed', description: res.error });
    }
  };

  if (!isAuthorized) return null;

  return (
    <MainLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-primary" /> Recompute Leaderboard
            </h1>
            <p className="text-muted-foreground">Run scoring algorithm v2.1 – transparent, auditable, reproducible</p>
          </div>
          <Button asChild variant="outline"><Link href="/dashboard/admin">Back</Link></Button>
        </div>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>Scoring Algorithm v2.1 (Current)</CardTitle>
            <CardDescription>Open-source, no partisan bias – see src/lib/scoring.ts</CardDescription>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            <div className="bg-muted p-4 rounded-lg font-mono text-xs">
              <div>performanceScore = legislative*0.5 + development*0.3 + community*0.2</div>
              <div>legislative = log10(bills+1)*40*0.4 + attendance*0.6</div>
              <div>development = cdf*0.7 + min(100, projects*10)*0.3</div>
              <div>integrityScore = 100 - verified*15 - alleged*5 + cleanYears*2</div>
              <div>overall = perf*0.6 + integ*0.3 + community*0.1</div>
            </div>
            <p><strong>Transparency:</strong> Formula version stored in each leaderboard entry for audit. Bias test: UDA/ODM same metrics → same score.</p>
            <p className="text-muted-foreground">Last computed: {stats?.lastComputed ? new Date(stats.lastComputed.seconds*1000).toLocaleString() : 'Never'} | Version: {stats?.version || 'v2.1'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><RefreshCw className="h-5 w-5" /> Trigger Recompute</CardTitle>
            <CardDescription>This will score all representatives and update rankings. Takes ~5-30 seconds for 3K reps.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleRecompute} disabled={isRecomputing} size="lg" className="w-full">
              {isRecomputing ? <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Recomputing... Please wait</> : <><BarChart3 className="h-5 w-5 mr-2" /> Recompute Leaderboard Now</>}
            </Button>

            {result && (
              <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <h4 className={`font-semibold ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                  {result.success ? `✅ Success – ${result.count} reps scored` : `❌ Failed: ${result.error}`}
                </h4>
                {result.success && result.details && (
                  <div className="mt-3">
                    <p className="text-sm font-medium flex items-center gap-1"><Trophy className="h-4 w-4" /> Top 5:</p>
                    <ol className="list-decimal list-inside text-sm mt-1">
                      {result.details.map((d: any) => <li key={d.name}>{d.name} – {d.score} pts (Rank #{d.rank})</li>)}
                    </ol>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">Version: {result.version}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {stats && (
          <Card>
            <CardHeader>
              <CardTitle>Current Leaderboard Stats</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div><strong>Total:</strong> {stats.total}</div>
              <div><strong>Avg Score:</strong> {stats.avgScore}</div>
              <div><strong>Version:</strong> {stats.version}</div>
              <div className="col-span-full">
                <strong>By Position:</strong> {Object.entries(stats.byPosition).map(([pos, count]) => `${pos}: ${count}`).join(', ')}
              </div>
              <div className="col-span-full">
                <strong>By County (top 3):</strong> {Object.entries(stats.byCounty).sort((a,b)=> (b[1] as number)-(a[1] as number)).slice(0,3).map(([c,n])=>`${c}: ${n}`).join(', ')}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Production Readiness Checklist</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <label className="flex items-center gap-2"><input type="checkbox" checked readOnly /> Typecheck + build green</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked readOnly /> Firestore indexes deployed</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked readOnly /> Scoring versioned (v2.1)</label>
            <label className="flex items-center gap-2"><input type="checkbox" /> Scheduler enabled (daily 2am EAT) – TODO</label>
            <label className="flex items-center gap-2"><input type="checkbox" /> App Check enabled – TODO</label>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
