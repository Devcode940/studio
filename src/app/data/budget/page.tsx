"use client";

import { useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, type ColumnDefinition } from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Scale, AlertTriangle, Loader2, TrendingDown, DollarSign } from 'lucide-react';

interface CoBReport {
  id: string;
  county: string;
  year: string;
  quarter: string;
  approvedBudget: number;
  exchequerReleases: number;
  actualExpenditure: number;
  pendingBills: number;
  budgetVariance: number;
  absorptionRate?: number;
  sourceUrl: string;
}

const columns: ColumnDefinition<CoBReport>[] = [
  {
    accessorKey: 'county',
    header: 'County',
    enableSorting: true,
    cell: ({ value }) => <span className="font-medium">{value}</span>,
  },
  {
    accessorKey: 'year',
    header: 'Year',
    enableSorting: true,
  },
  {
    accessorKey: 'quarter',
    header: 'Quarter',
    enableSorting: true,
  },
  {
    accessorKey: 'approvedBudget',
    header: 'Approved (B)',
    enableSorting: true,
    cell: ({ value }) => <span>{(value / 1_000_000_000).toFixed(1)}B</span>,
  },
  {
    accessorKey: 'actualExpenditure',
    header: 'Actual (B) – CoB Truth 1.5x',
    enableSorting: true,
    cell: ({ value, row }) => {
      const variance = (row as CoBReport).budgetVariance || 0;
      return (
        <span className={variance > 15 ? 'text-red-600 font-bold' : 'text-green-700 font-semibold'}>
          {(value / 1_000_000_000).toFixed(1)}B
        </span>
      );
    },
  },
  {
    accessorKey: 'budgetVariance',
    header: 'Variance %',
    enableSorting: true,
    cell: ({ value }) => (
      <Badge className={value > 15 ? 'bg-red-600 text-white' : value > 5 ? 'bg-yellow-500 text-white' : 'bg-green-600 text-white'}>
        {value}% {value > 15 ? '⚠️ High' : ''}
      </Badge>
    ),
  },
  {
    accessorKey: 'pendingBills',
    header: 'Pending Bills – RED FLAG',
    enableSorting: true,
    cell: ({ value }) => {
      const isHigh = value > 1_000_000_000;
      return (
        <span className={`font-bold flex items-center gap-1 ${isHigh ? 'text-red-600' : 'text-muted-foreground'}`}>
          {isHigh && <AlertTriangle className="h-4 w-4" />}
          {(value / 1_000_000_000).toFixed(2)}B {isHigh ? '🔴' : ''}
        </span>
      );
    },
  },
  {
    accessorKey: 'absorptionRate',
    header: 'Absorption %',
    enableSorting: true,
    cell: ({ value }) => value ? `${value}%` : 'N/A',
  },
];

export default function BudgetPage() {
  const firestore = useFirestore();
  const [selectedCounty, setSelectedCounty] = useState<string>('All');

  const cobQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'cob_reports'), orderBy('county', 'asc'));
  }, [firestore]);

  const { data: cobData, isLoading } = useCollection<CoBReport>(cobQuery);

  const chartData = useMemo(() => {
    if (!cobData) return [];
    const filtered = selectedCounty === 'All' ? cobData : cobData.filter(c => c.county === selectedCounty);
    // Group by county – take latest quarter per county for chart simplicity, or sum?
    // For demo, take first 10
    return filtered.slice(0, 12).map(c => ({
      name: c.county.substring(0, 10),
      county: c.county,
      approved: c.approvedBudget / 1_000_000_000,
      actual: c.actualExpenditure / 1_000_000_000,
      pending: c.pendingBills / 1_000_000_000,
      variance: c.budgetVariance,
      absorption: c.absorptionRate || 0,
    }));
  }, [cobData, selectedCounty]);

  const counties = useMemo(() => {
    if (!cobData) return ['All'];
    return ['All', ...Array.from(new Set(cobData.map(c => c.county))).sort()];
  }, [cobData]);

  const highVarianceCount = cobData?.filter(c => (c.budgetVariance || 0) > 15).length || 0;
  const highPendingCount = cobData?.filter(c => c.pendingBills > 1_000_000_000).length || 0;
  const totalPending = cobData?.reduce((sum, c) => sum + c.pendingBills, 0) || 0;

  return (
    <MainLayout>
      <div className="space-y-8 max-w-6xl mx-auto">
        <header className="text-center relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-800 to-blue-600 text-white p-8">
          <div className="absolute top-0 left-0 w-full h-1 kenya-flag-animate" />
          <h1 className="font-headline text-4xl font-bold flex items-center justify-center gap-3">
            <Scale className="h-10 w-10" /> County Budget vs Actual – Don't Trust Executive
          </h1>
          <p className="mt-3 text-lg opacity-90 max-w-3xl mx-auto">
            Controller of Budget (CoB) independent Article 228 – <strong>Budget Approved (Executive claim 0.4x)</strong> vs <strong>Actual Expenditure (CoB Truth 1.5x)</strong>. Gap = executive not trustworthy. Pending bills red = citizen burden.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Badge className="bg-white text-blue-800">CoB 1.5x Primary</Badge>
            <Badge className="bg-white text-red-800">Executive 0.4x Lowest</Badge>
            <Badge className="bg-red-100 text-red-800">Pending Bills Red Flag</Badge>
            <Badge className="bg-yellow-100 text-yellow-800">Variance &gt;15% = -5 Integrity</Badge>
          </div>
        </header>

        <div className="grid md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-red-600">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-600" /> High Variance Counties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{highVarianceCount}</div>
              <p className="text-xs text-muted-foreground">Variance &gt;15% – Budget vs Actual gap – distrust executive</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-600">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><DollarSign className="h-4 w-4 text-red-600" /> High Pending Bills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{highPendingCount}</div>
              <p className="text-xs text-muted-foreground">Pending &gt;1B – citizen burden, -10 integrity</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-600">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><TrendingDown className="h-4 w-4 text-blue-600" /> Total Pending Bills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-700">{(totalPending / 1_000_000_000).toFixed(1)}B</div>
              <p className="text-xs text-muted-foreground">KSh Billions owed to suppliers – CoB truth</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Budget vs Actual – Visual Distrust (Executive Claim vs CoB Truth)</CardTitle>
            <CardDescription>Approved Budget (gray, executive claim 0.4x) vs Actual Expenditure (green, CoB truth 1.5x) vs Pending Bills (red). Gap = executive not trustworthy.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" /><p className="ml-3">Loading CoB reports...</p></div>
            ) : chartData.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <p>No CoB data yet. Admin upload via /dashboard/admin/cob – sample CSV provided.</p>
                <p className="text-xs mt-2">Source: https://cob.go.ke/reports/ – County Budget Implementation Review Reports</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-35} textAnchor="end" height={70} tick={{ fontSize: 11 }} interval={0} />
                  <YAxis label={{ value: 'KSh Billions', angle: -90, position: 'insideLeft' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'white', borderRadius: '8px' }}
                    formatter={(value: any, name: string) => [`${value.toFixed(2)}B KSh`, name]}
                    labelFormatter={(label, payload) => {
                      if (payload && payload[0]) {
                        const d = payload[0].payload as any;
                        return `${d.county} – Variance ${d.variance}% – Absorption ${d.absorption}%`;
                      }
                      return label;
                    }}
                  />
                  <Legend />
                  <Bar dataKey="approved" name="Approved Budget (Executive Claim 0.4x)" fill="#94a3b8" radius={[2,2,0,0]} />
                  <Bar dataKey="actual" name="Actual Expenditure (CoB Truth 1.5x)" fill="hsl(var(--primary))" radius={[2,2,0,0]} />
                  <Bar dataKey="pending" name="Pending Bills 🔴 (Red Flag)" fill="#ef4444" radius={[2,2,0,0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.pending > 1 ? '#dc2626' : '#f87171'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
            <div className="mt-4 text-xs text-muted-foreground space-y-1">
              <p><span className="inline-block w-3 h-3 bg-gray-400 mr-1"></span> Approved Budget = Executive claim (0.4x lowest trust) – what Governor said he would spend</p>
              <p><span className="inline-block w-3 h-3 bg-primary mr-1"></span> Actual Expenditure = CoB truth (1.5x primary independent Art 228) – what was actually released and spent</p>
              <p><span className="inline-block w-3 h-3 bg-red-600 mr-1"></span> Pending Bills = KSh owed to suppliers – red flag – &gt;1B = -10 integrity for Governor</p>
              <p><strong>Distrust Principle:</strong> Gap &gt;15% between approved and actual = executive budgeting not trustworthy = -5 integrity. Executive claim alone never scores, requires CoB verification.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>County Budget Implementation Data (CoB Primary Source)</CardTitle>
            <CardDescription>Source: Controller of Budget – independent Article 228 – checks executive spending. Admin upload via /dashboard/admin/cob</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : (
              <DataTable
                columns={columns}
                data={cobData || []}
                searchableColumn="county"
                searchPlaceholder="Search by county..."
                initialSortColumn="pendingBills"
                initialSortDirection="desc"
              />
            )}
          </CardContent>
        </Card>

        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="text-sm">How We Use CoB for Don't Trust Executive</CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-2">
            <ol className="list-decimal list-inside space-y-1">
              <li>Download PDF from <a href="https://cob.go.ke/reports/" target="_blank" className="text-primary underline">cob.go.ke/reports</a> → County BIRR Q1-Q4</li>
              <li>Extract: Approved, Exchequer Releases, Actual, Pending Bills, Travel, Development Budget vs Actual</li>
              <li>Upload CSV via /dashboard/admin/cob → creates cob_reports/{'{county-year-quarter}'} with scoringImpact (highVariance, highPending)</li>
              <li>Recompute leaderboard: CoB variance &gt;15% = -5 integrity, pending &gt;1B = -10 integrity for Governor, absorption &gt;80% = +3 performance</li>
              <li>Public page /data/budget shows BarChart Budget vs Actual – gap visual distrust – pending bills red flag</li>
              <li>Trust: CoB 1.5x primary independent vs Executive budget claim 0.4x lowest – executive claim alone never scores</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
