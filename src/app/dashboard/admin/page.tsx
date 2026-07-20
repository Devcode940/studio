"use client";

import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAdmin } from '@/hooks/useAdmin';
import { Loader2, ShieldCheck, Users, Database, BarChart3, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getPendingHighlightsAction, getAIUsageStatsAction, getAuditLogsAction } from '@/app/actions/admin';
import { getLeaderboardStatsAction } from '@/app/actions/leaderboard';

export default function AdminDashboardPage() {
  const { isAuthorized, loading, isAdmin } = useAdmin(true);
  const [stats, setStats] = useState<any>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [aiStats, setAiStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    async function loadStats() {
      setIsLoadingStats(true);
      const [lbStats, pending, ai] = await Promise.all([
        getLeaderboardStatsAction(),
        getPendingHighlightsAction(),
        getAIUsageStatsAction(),
      ]);
      if (lbStats.success) setStats(lbStats.data);
      if (pending.success) setPendingCount(pending.count);
      if (ai.success) setAiStats(ai.data);
      setIsLoadingStats(false);
    }
    if (isAuthorized) loadStats();
  }, [isAuthorized]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4">Checking admin access...</p>
        </div>
      </MainLayout>
    );
  }

  if (!isAuthorized) {
    return (
      <MainLayout>
        <div className="text-center py-20">
          <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-destructive">Admin Access Required</h1>
          <p className="mt-2 text-muted-foreground">You need admin privileges to access this dashboard.</p>
          <Button asChild className="mt-6"><Link href="/dashboard">Back to Dashboard</Link></Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        <header className="rounded-lg bg-gradient-to-r from-primary to-primary/80 p-8 text-primary-foreground">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-10 w-10" />
            <div>
              <h1 className="font-headline text-4xl font-bold">Admin Command Center</h1>
              <p className="mt-1 opacity-90">KenyaWatch Production Operations – Scoring v2.1</p>
            </div>
          </div>
        </header>

        {isLoadingStats ? (
          <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-l-4 border-l-primary">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center"><Users className="h-4 w-4 mr-2" />Total Representatives</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.total || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Last computed: {stats?.lastComputed ? new Date(stats.lastComputed.seconds*1000).toLocaleDateString() : 'Never'}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-yellow-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center"><Clock className="h-4 w-4 mr-2" />Pending Highlights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{pendingCount}</div>
                <p className="text-xs text-muted-foreground mt-1">Requires admin review</p>
                {pendingCount > 0 && <Button asChild size="sm" className="mt-2"><Link href="/dashboard/admin/pending">Review Now</Link></Button>}
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center"><BarChart3 className="h-4 w-4 mr-2" />AI Usage (Last Hour)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{aiStats?.lastHour || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Total: {aiStats?.total || 0} generations</p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-yellow-500">
            <CardHeader>
              <CardTitle className="flex items-center"><CheckCircle className="h-5 w-5 mr-2 text-primary" />Pending Review</CardTitle>
              <CardDescription>Approve AI-generated highlights</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full"><Link href="/dashboard/admin/pending">Manage Pending ({pendingCount})</Link></Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-green-600">
            <CardHeader>
              <CardTitle className="flex items-center"><ShieldCheck className="h-5 w-5 mr-2 text-green-600" />OAG & AG (Primary 1.5x)</CardTitle>
              <CardDescription>Auditor General + Attorney General</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full bg-green-600 hover:bg-green-700"><Link href="/dashboard/admin/oag">Manage OAG & Bills</Link></Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-red-600">
            <CardHeader>
              <CardTitle className="flex items-center"><AlertTriangle className="h-5 w-5 mr-2 text-red-600" />Promises (Don't Trust Exec)</CardTitle>
              <CardDescription>Executive 0.4x – requires OAG verification</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full bg-red-600 hover:bg-red-700"><Link href="/dashboard/admin/promises">Manage Promises</Link></Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-600">
            <CardHeader>
              <CardTitle className="flex items-center"><BarChart3 className="h-5 w-5 mr-2 text-blue-600" />CoB Budget vs Actual</CardTitle>
              <CardDescription>Controller of Budget 1.5x vs Executive 0.4x</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full bg-blue-600 hover:bg-blue-700"><Link href="/dashboard/admin/cob">Manage CoB Reports</Link></Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-purple-600">
            <CardHeader>
              <CardTitle className="flex items-center"><ShieldCheck className="h-5 w-5 mr-2 text-purple-600" />Judiciary Checks</CardTitle>
              <CardDescription>Cases where executive lost – 1.5x primary</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full bg-purple-600 hover:bg-purple-700"><Link href="/dashboard/admin/judiciary">Manage Judiciary</Link></Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center"><Users className="h-5 w-5 mr-2 text-primary" />Representatives</CardTitle>
              <CardDescription>CRUD reps, photos – MCA-first</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full"><Link href="/dashboard/admin/representatives">Manage Reps</Link></Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center"><Database className="h-5 w-5 mr-2 text-primary" />GDP & Census</CardTitle>
              <CardDescription>CSV ingest for KNBS data</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full"><Link href="/dashboard/admin/gdp">Ingest Data</Link></Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center"><BarChart3 className="h-5 w-5 mr-2 text-primary" />Leaderboard</CardTitle>
              <CardDescription>Recompute scores v2.1 with OAG primary</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full"><Link href="/dashboard/admin/recompute">Recompute Now</Link></Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center"><Clock className="h-5 w-5 mr-2 text-primary" />Audit & Monitoring</CardTitle>
              <CardDescription>AI usage + admin logs – immutable</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full"><Link href="/dashboard/admin/audit">View Audit</Link></Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common admin operations</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild variant="outline"><Link href="/dashboard/admin/audit">View Audit Logs</Link></Button>
            <Button asChild variant="outline"><Link href="/data/leaderboard">View Leaderboard</Link></Button>
            <Button asChild variant="outline"><Link href="/representatives">View All Reps</Link></Button>
          </CardContent>
        </Card>

        {stats && (
          <Card>
            <CardHeader>
              <CardTitle>Scoring v2.1 Breakdown</CardTitle>
              <CardDescription>Transparent algorithm – open source</CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p><strong>Performance (60% overall):</strong> Legislative 50% (bills log + attendance 60%) + Development 30% (CDF 70% + projects) + Community 20%</p>
              <p><strong>Integrity (30% overall):</strong> 100 - verified*15 - alleged*5 + cleanYears*2</p>
              <p><strong>Overall:</strong> perf*0.6 + integ*0.3 + community*0.1</p>
              <p className="text-muted-foreground">Version: {stats.version} | Avg Score: {stats.avgScore} | Top: {stats.top5?.[0]?.name || 'N/A'}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
