/**
 * Judiciary Checks on Executive – Kenya Law Scraper
 * Best proof executive not trustworthy: Judiciary strikes down executive action
 * Source: https://kenyalaw.org/caselaw/ – High Court, Court of Appeal, Supreme Court
 * Primary source 1.5x – independent Article 160
 */

import { z } from 'zod';
import { logger } from './logger';

export const JudiciaryCheckSchema = z.object({
  caseTitle: z.string().min(5), // "Petition 12 of 2024 – Omtatah vs Governor Sakaja"
  caseNumber: z.string().optional(),
  court: z.enum(['High Court', 'Court of Appeal', 'Supreme Court', 'Environment and Land Court', 'Employment Court']).default('High Court'),
  county: z.string().optional(),
  executive: z.string().min(2), // "Governor Sakaja Johnson" | "President William Ruto" | "Cabinet Secretary Health"
  executiveSlug: z.string().optional(),
  executivePosition: z.enum(['President', 'Deputy President', 'Governor', 'Cabinet Secretary', 'County Executive', 'MCA', 'MP']).default('Governor'),
  decision: z.enum(['Executive Action Upheld', 'Executive Action Struck Down', 'Executive Action Partially Struck Down', 'Pending']).default('Pending'),
  decisionDate: z.string(), // YYYY-MM-DD
  impact: z.enum(['Low', 'Medium', 'High']).default('Medium'),
  kenyaLawUrl: z.string().url(),
  summary: z.string().min(10).max(500),
  isUnconstitutional: z.boolean().default(false),
  unconstitutionalReason: z.string().optional(),
});

export type JudiciaryCheckInput = z.infer<typeof JudiciaryCheckSchema>;

export function parseJudiciaryCSV(csvText: string): JudiciaryCheckInput[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) throw new Error('CSV empty');

  const header = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s/g, ''));
  const headerMap: Record<string, string> = {
    'casetitle': 'caseTitle',
    'casenumber': 'caseNumber',
    'court': 'court',
    'county': 'county',
    'executive': 'executive',
    'executiveslug': 'executiveSlug',
    'executiveposition': 'executivePosition',
    'decision': 'decision',
    'decisiondate': 'decisionDate',
    'impact': 'impact',
    'kenyalawurl': 'kenyaLawUrl',
    'summary': 'summary',
    'isunconstitutional': 'isUnconstitutional',
    'unconstitutionalreason': 'unconstitutionalReason',
  };

  const checks: JudiciaryCheckInput[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') inQuotes = !inQuotes;
      else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else current += char;
    }
    values.push(current.trim().replace(/^"|"$/g, ''));

    const row: any = {};
    header.forEach((h, idx) => {
      const mapped = headerMap[h] || h;
      row[mapped] = values[idx];
    });

    const parsed = {
      caseTitle: row.caseTitle,
      caseNumber: row.caseNumber,
      court: row.court || 'High Court',
      county: row.county,
      executive: row.executive,
      executiveSlug: row.executiveSlug || row.executive?.toLowerCase().replace(/\s+/g, '-'),
      executivePosition: row.executivePosition || 'Governor',
      decision: row.decision || 'Pending',
      decisionDate: row.decisionDate,
      impact: row.impact || 'Medium',
      kenyaLawUrl: row.kenyaLawUrl,
      summary: row.summary,
      isUnconstitutional: row.isUnconstitutional?.toLowerCase() === 'true' || row.isUnconstitutional === '1',
      unconstitutionalReason: row.unconstitutionalReason,
    };

    const validated = JudiciaryCheckSchema.parse(parsed);
    checks.push(validated);
  }

  logger.info('Parsed judiciary checks CSV', { count: checks.length });
  return checks;
}

export function generateJudiciaryDocId(check: JudiciaryCheckInput): string {
  const clean = check.caseTitle.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 60);
  const year = new Date(check.decisionDate).getFullYear() || '2024';
  return `${clean}-${year}`.replace(/--+/g, '-');
}

export function calculateJudiciaryScoringImpact(check: JudiciaryCheckInput): { verifiedScandals: number; integrity: number } {
  let verifiedScandals = 0;
  let integrity = 0;

  if (check.decision === 'Executive Action Struck Down') {
    verifiedScandals += check.impact === 'High' ? 2 : 1;
    integrity -= check.impact === 'High' ? 10 : 5;
    if (check.isUnconstitutional) {
      verifiedScandals += 1;
      integrity -= 5;
    }
  } else if (check.decision === 'Executive Action Partially Struck Down') {
    verifiedScandals += 1;
    integrity -= 3;
  }

  return { verifiedScandals, integrity };
}

/**
 * Kenya Law scraper (best effort)
 * Real: fetch https://kenyalaw.org/caselaw/ with search "Governor" + "County Government"
 * For now, returns mock with log
 */
export async function fetchKenyaLawCases(): Promise<JudiciaryCheckInput[]> {
  logger.info('Attempting Kenya Law judiciary checks fetch – scraper not yet implemented, using mock with warning');
  return fetchMockJudiciaryChecks();
}

async function fetchMockJudiciaryChecks(): Promise<JudiciaryCheckInput[]> {
  logger.warn('[MOCK] Returning mock judiciary checks for dev');
  return parseJudiciaryCSV(SAMPLE_JUDICIARY_CSV);
}

export const SAMPLE_JUDICIARY_CSV = `caseTitle,caseNumber,court,county,executive,executivePosition,decision,decisionDate,impact,kenyaLawUrl,summary,isUnconstitutional,unconstitutionalReason
"Petition 12 of 2024 - Okiya Omtatah vs Governor Sakaja Johnson",Petition 12 of 2024,High Court,Nairobi,Governor Sakaja Johnson,Governor,Executive Action Struck Down,2024-03-15,High,https://kenyalaw.org/caselaw/cases/view/123456/,County Finance Bill 2023 declared unconstitutional for lack of public participation,True,No public participation per Article 196
"Judicial Review 45 of 2023 - County Assembly vs Governor Mandago",JR 45 of 2023,High Court,Uasin Gishu,Governor Mandago,Governor,Executive Action Partially Struck Down,2023-11-20,Medium,https://kenyalaw.org/caselaw/cases/view/789012/,Governor ignored County Assembly summons 3 times – court ordered compliance,False,
"Petition 8 of 2024 - Katiba Institute vs President William Ruto",Petition 8 of 2024,Supreme Court,,President William Ruto,President,Executive Action Struck Down,2024-02-10,High,https://kenyalaw.org/caselaw/cases/view/345678/,Executive Order No 1 of 2024 on Cabinet reorganization struck down for violating Article 152,True,Violates Article 152 on Cabinet composition
"County Assembly of Kiambu vs Governor Wamatangi",Petition 20 of 2023,High Court,Kiambu,Governor Wamatangi,Governor,Executive Action Struck Down,2023-09-05,Medium,https://kenyalaw.org/caselaw/cases/view/901234/,Governor's refusal to release bursary funds declared unlawful,False,
`;
