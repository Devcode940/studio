"use client";

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gavel, Scale, ExternalLink, AlertTriangle, Loader2 } from 'lucide-react';
import type { Representative } from '@/types';

interface JudiciaryCheck {
  id: string;
  caseTitle: string;
  caseNumber?: string;
  court: string;
  executive: string;
  executivePosition: string;
  decision: string;
  decisionDate: string;
  impact: string;
  kenyaLawUrl: string;
  summary: string;
  isUnconstitutional: boolean;
  unconstitutionalReason?: string;
}

interface JudiciaryChecksProps {
  representative: Representative;
}

export function JudiciaryChecks({ representative }: JudiciaryChecksProps) {
  const firestore = useFirestore();

  // Query judiciary checks where executiveSlug matches rep slug or name contains rep name
  const judiciaryQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // We search by executiveSlug == rep slug
    return query(
      collection(firestore, 'judiciary_checks'),
      where('executiveSlug', '==', representative.slug)
    );
  }, [firestore, representative.slug]);

  const { data: checks, isLoading } = useCollection<JudiciaryCheck>(judiciaryQuery);

  // Fallback: if no results by slug, try by executive name contains (client filter for now)
  // In production, would need composite query or Algolia

  if (isLoading) {
    return (
      <Card className="mt-6">
        <CardContent className="py-10 flex justify-center items-center">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading judiciary checks...
        </CardContent>
      </Card>
    );
  }

  if (!checks || checks.length === 0) {
    return (
      <Card className="mt-6 border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Gavel className="h-5 w-5 text-primary" /> Judiciary Checks – Cases Where Executive Lost (0)
          </CardTitle>
          <CardDescription>
            Independent Judiciary Article 160 – best proof executive not trustworthy. No cases found for {representative.name} yet.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          <p>Source: Kenya Law <code>kenyalaw.org/caselaw</code> – High Court, Court of Appeal, Supreme Court. Each struck down = +1-2 verified scandals, -5 to -10 integrity.</p>
          <p className="mt-2">Admin can ingest via <code>/dashboard/admin/judiciary</code> – sample: Petition 12 vs Governor Sakaja declared unconstitutional.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6 border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gavel className="h-5 w-5 text-purple-600" /> Judiciary Checks – Executive Lost {checks.length} Case(s) – Primary 1.5x
        </CardTitle>
        <CardDescription>
          Independent Judiciary Article 160 checks executive. Each struck down = verified scandal for {representative.name}. Source: Kenya Law, trust 1.5x vs executive 0.4x.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {checks.map((check) => (
          <div key={check.id} className="border rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-start">
              <h4 className="font-semibold text-sm">{check.caseTitle}</h4>
              <Badge className={check.decision === 'Executive Action Struck Down' ? 'bg-red-600 text-white' : check.decision === 'Executive Action Partially Struck Down' ? 'bg-yellow-600 text-white' : 'bg-gray-500 text-white'}>
                {check.decision}
              </Badge>
            </div>
            
            <div className="text-xs text-muted-foreground flex flex-wrap gap-2">
              <span>Case: {check.caseNumber || 'N/A'}</span>
              <span>• Court: {check.court}</span>
              <span>• Date: {new Date(check.decisionDate).toLocaleDateString()}</span>
              <span>• Impact: <Badge variant="outline" className={check.impact==='High'?'border-red-600 text-red-600':''}>{check.impact}</Badge></span>
            </div>

            <p className="text-sm bg-muted p-2 rounded">{check.summary}</p>

            {check.isUnconstitutional && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-2 rounded text-xs flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>⚠️ Unconstitutional:</strong> {check.unconstitutionalReason || 'Declared unconstitutional – violates Constitution'}
                  <div className="mt-1">Penalty: +1 verified scandal extra, -5 integrity</div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-xs">
              <div className="flex gap-2">
                <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded">Trust 1.5x Judiciary</span>
                <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded">vs Executive 0.4x Lowest</span>
                <span className="bg-gray-100 px-2 py-0.5 rounded">+{check.impact==='High'?2:1} verified scandals</span>
              </div>
              <a href={check.kenyaLawUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                Kenya Law Source <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        ))}

        <div className="bg-purple-50 p-3 rounded text-xs text-purple-800">
          <strong>Scoring Impact (v2.1):</strong> Struck Down = +1-2 verified scandals (High impact +2), -5 to -10 integrity. Partially Struck Down = +1 verified, -3 integrity. Unconstitutional extra +1 verified. Judiciary 1.5x primary vs Executive 0.4x lowest – executive lost cases are strongest integrity signal.
        </div>
      </CardContent>
    </Card>
  );
}
