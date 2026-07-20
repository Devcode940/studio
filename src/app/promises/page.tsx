import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AlertTriangle, CheckCircle, Clock, XCircle, Shield, Scale } from 'lucide-react';

export const metadata = {
  title: 'Executive Promises vs Delivery - Don\'t Trust Executive - KenyaWatch',
  description: 'Track promises by President, Governors, MPs. Executive 0.4x trust – requires OAG 1.5x or citizen photo verification. Broken = -10 integrity.',
};

const mockPromises = [
  {
    who: 'William Ruto',
    position: 'President',
    promise: 'Build 100km of Mau Mau roads by 2025',
    category: 'Infrastructure',
    datePromised: '2022-09-13',
    deadline: '2025-12-31',
    status: 'In Progress',
    progress: 40,
    trustWeight: '0.4x',
    verification: 'No independent verification yet – OAG audit pending',
    scoring: { performance: 0, integrity: 0 },
  },
  {
    who: 'Sakaja Johnson',
    position: 'Governor, Nairobi',
    promise: 'Fix Nairobi County pending bills KSh 100B',
    category: 'Infrastructure',
    datePromised: '2022-09-10',
    deadline: '2024-12-31',
    status: 'Broken',
    progress: 0,
    trustWeight: '0.4x → 1.5x after CoB verification',
    verification: 'CoB Q1 2023-2024 shows pending bills still KSh 1.2B – Broken verified by Controller of Budget 1.5x',
    scoring: { performance: 0, integrity: -10 },
  },
  {
    who: 'John Kiarie',
    position: 'MP, Dagoretti South',
    promise: 'Build Dagoretti South ICT Hub',
    category: 'Education',
    datePromised: '2023-01-15',
    deadline: '2024-06-30',
    status: 'Completed',
    progress: 100,
    trustWeight: '1.0x (citizen photo verified)',
    verification: 'Citizen geotagged photo of ICT Hub verified by admin – Completed +5 performance',
    scoring: { performance: 5, integrity: 0 },
  },
];

export default function PromisesPage() {
  return (
    <MainLayout>
      <div className="space-y-8 max-w-5xl mx-auto">
        <header className="text-center py-8 rounded-xl bg-gradient-to-r from-red-800 to-red-600 text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 kenya-flag-animate" />
          <h1 className="font-headline text-4xl font-bold">Executive Promises vs Delivery</h1>
          <p className="mt-3 text-lg opacity-90">Principle: <strong>Don't Trust Executive (0.4x lowest)</strong> – Requires OAG 1.5x, CoB 1.5x, Judiciary 1.5x, or citizen photo 1.0x verification to score</p>
          <div className="mt-4 flex justify-center gap-2 flex-wrap">
            <Badge className="bg-white text-red-800">Executive 0.4x Never Scores Alone</Badge>
            <Badge className="bg-white text-green-700">OAG 1.5x Primary Verifies</Badge>
            <Badge className="bg-white text-blue-700">CoB 1.5x Budget vs Actual</Badge>
            <Badge className="bg-white text-purple-700">Judiciary 1.5x Strikes Down</Badge>
          </div>
        </header>

        <Card className="border-red-200 bg-red-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800"><AlertTriangle className="h-5 w-5" /> Why Don't Trust Executive?</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-red-800 space-y-2">
            <p>Executive (President, Governors, Cabinet) controls information flow – State House press releases claim success. Independent checks show truth:</p>
            <ul className="list-disc list-inside ml-2">
              <li><strong>OAG (1.5x):</strong> Auditor General finds unsupported expenditure, Adverse opinion → +2 verified scandals</li>
              <li><strong>CoB (1.5x):</strong> Controller of Budget shows Budget Approved KSh 40B vs Actual KSh 28B – Gap 30% = executive not trustworthy</li>
              <li><strong>Judiciary (1.5x):</strong> Supreme Court strikes down executive order = +2 verified scandals for President</li>
              <li><strong>Citizen Photo (1.0x):</strong> Geotagged photo of claimed market/road – verified by admin</li>
              <li><strong>Executive alone (0.4x):</strong> Press release "Built 20 markets" = 0 points until verified. Broken after deadline = -10 integrity regardless.</li>
            </ul>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          {mockPromises.map((p, idx) => (
            <Card key={idx} className={`border-l-4 ${p.status==='Completed'?'border-l-green-600': p.status==='Broken'?'border-l-red-600': p.status==='In Progress'?'border-l-yellow-500':'border-l-gray-400'}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {p.who} <span className="text-sm font-normal text-muted-foreground">({p.position})</span>
                      <Badge className={p.status==='Completed'?'bg-green-600': p.status==='Broken'?'bg-red-600': 'bg-yellow-600'}>{p.status} {p.progress}%</Badge>
                    </CardTitle>
                    <CardDescription className="mt-1">{p.category} • Promised: {p.datePromised} • Deadline: {p.deadline}</CardDescription>
                  </div>
                  <Badge variant="outline" className={p.trustWeight.includes('0.4x')?'bg-red-50 text-red-700': 'bg-green-50 text-green-700'}>{p.trustWeight}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="font-medium">"{p.promise}"</p>
                <div className="bg-muted p-3 rounded text-xs">
                  <div className="flex items-center gap-2 font-semibold"><Shield className="h-4 w-4" /> Verification:</div>
                  <p className="mt-1">{p.verification}</p>
                </div>
                <div className="flex gap-2 text-xs">
                  <span className={`px-2 py-1 rounded ${p.scoring.performance>0?'bg-green-100 text-green-800':'bg-gray-100'}`}>Perf: {p.scoring.performance>=0?'+':''}{p.scoring.performance}</span>
                  <span className={`px-2 py-1 rounded ${p.scoring.integrity<0?'bg-red-100 text-red-800':'bg-gray-100'}`}>Integ: {p.scoring.integrity}</span>
                  {p.status==='Broken' && <span className="bg-red-100 text-red-800 px-2 py-1 rounded flex items-center gap-1"><XCircle className="h-3 w-3" /> Broken = -10 integrity always</span>}
                  {p.status==='Completed' && p.scoring.performance===0 && <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">⚠️ Completed but no independent verification – 0 points until OAG/photo</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Scoring Impact – Distrust Principle Enforced in Code</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 font-mono bg-muted p-4 rounded">
            <div>trustWeight = 0.4 executive alone</div>
            <div>trustWeight = 1.5 if OAG/CoB/Judiciary verified</div>
            <div>trustWeight = 1.0 if citizen photo verified</div>
            <div>trustWeight = 0.8 if media report verified</div>
            <div>performance = Completed ? (verified? 5 : media? 2 : 0) : InProgress ? progress/100*3 if verified else 0 : 0</div>
            <div>integrity = Broken ? -10 : Overdue ? -5 : 0 (always, regardless of verification)</div>
            <div>Executive claim alone never scores – requires independent verification</div>
          </CardContent>
        </Card>

        <Card className="bg-primary text-primary-foreground">
          <CardContent className="py-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="font-bold">Want to verify a promise?</h3>
              <p className="text-sm opacity-90">Upload geotagged photo of claimed project – admin will verify and update status</p>
            </div>
            <Button asChild variant="secondary"><Link href="/report">Verify Project Photo</Link></Button>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-muted-foreground">
          Data from executive_promises collection – stored with trustWeight, scoringImpact, evidence array (oag_report, cob_report, citizen_photo, media_report, judiciary). Admin manages via /dashboard/admin/promises<br/>
          Principle: Don't trust executive (0.4x lowest) – trust independent institutions: OAG 1.5x Art 229, CoB 1.5x Art 228, Judiciary 1.5x Art 160, citizen photo 1.0x
        </div>
      </div>
    </MainLayout>
  );
}
