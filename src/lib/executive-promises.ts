/**
 * Executive Promises vs Delivery Tracker
 * Principle: NEVER TRUST EXECUTIVE (0.4x weight) – Requires independent verification (OAG 1.5x, Citizen Photo 1.0x, CoB 1.5x)
 * Tracks promises by President, Deputy President, Governors, etc.
 */

import { z } from 'zod';
import { logger } from './logger';

export const PromiseStatusSchema = z.enum(['Not Started', 'In Progress', 'Completed', 'Broken', 'Overdue']);

export const ExecutivePromiseSchema = z.object({
  id: z.string().optional(),
  who: z.string().min(2), // "William Ruto" | "Governor Sakaja Johnson"
  whoSlug: z.string().optional(), // william-ruto
  whoPosition: z.enum(['President', 'Deputy President', 'Governor', 'Senator', 'MP', 'MCA', 'Cabinet Secretary']).default('President'),
  county: z.string().optional(), // for Governor promises
  promise: z.string().min(10).max(500), // "Build 5 new markets in Nairobi by 2027"
  category: z.enum(['Infrastructure', 'Health', 'Education', 'Water', 'Roads', 'Housing', 'Agriculture', 'Jobs', 'Other']).default('Other'),
  datePromised: z.string(), // ISO date or YYYY-MM-DD
  deadline: z.string().optional(), // YYYY-MM-DD
  sourceUrl: z.string().url(), // president.go.ke speech PDF, or citizen.digital reporting the promise (executive claim 0.4x)
  sourceType: z.enum(['executive', 'media', 'manifesto']).default('executive'),
  status: PromiseStatusSchema.default('Not Started'),
  progress: z.number().min(0).max(100).default(0), // 0-100%
  evidence: z.array(z.object({
    type: z.enum(['oag_report', 'cob_report', 'citizen_photo', 'media_report', 'judiciary', 'kbc', 'site_visit']),
    url: z.string().url().optional(),
    photoUrl: z.string().optional(),
    description: z.string(),
    verified: z.boolean().default(false),
    verifiedBy: z.string().optional(), // admin uid
    date: z.string().optional(),
  })).default([]),
  verifiedBy: z.string().optional(), // independent verification source type
  trustWeightUsed: z.number().default(0.4), // executive alone 0.4, with OAG verification 1.5
  scoringImpact: z.object({
    performance: z.number().default(0), // +5 if completed with OAG verification
    integrity: z.number().default(0), // -10 if broken
  }).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type ExecutivePromiseInput = z.infer<typeof ExecutivePromiseSchema>;

export function parsePromisesCSV(csvText: string): ExecutivePromiseInput[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) throw new Error('CSV empty');

  const header = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s/g, ''));
  const headerMap: Record<string, string> = {
    'who': 'who',
    'whoslug': 'whoSlug',
    'whoposition': 'whoPosition',
    'county': 'county',
    'promise': 'promise',
    'category': 'category',
    'datepromised': 'datePromised',
    'deadline': 'deadline',
    'sourceurl': 'sourceUrl',
    'sourcetype': 'sourceType',
    'status': 'status',
    'progress': 'progress',
  };

  const promises: ExecutivePromiseInput[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Handle quoted commas
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
      who: row.who,
      whoSlug: row.whoSlug || row.who?.toLowerCase().replace(/\s+/g, '-'),
      whoPosition: row.whoPosition || 'President',
      county: row.county,
      promise: row.promise,
      category: row.category || 'Other',
      datePromised: row.datePromised,
      deadline: row.deadline,
      sourceUrl: row.sourceUrl,
      sourceType: row.sourceType || 'executive',
      status: (row.status as any) || 'Not Started',
      progress: row.progress ? Number(row.progress) : 0,
      evidence: [],
      trustWeightUsed: row.sourceType === 'executive' ? 0.4 : 0.8,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const validated = ExecutivePromiseSchema.parse(parsed);
    promises.push(validated);
  }

  logger.info('Parsed executive promises CSV', { count: promises.length });
  return promises;
}

export function generatePromiseDocId(promise: ExecutivePromiseInput): string {
  const whoClean = promise.who.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const promiseClean = promise.promise.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 40);
  const year = new Date(promise.datePromised).getFullYear() || '2024';
  return `${whoClean}-${promiseClean}-${year}`.replace(/--+/g, '-');
}

/**
 * Calculate scoring impact based on status and verification
 * Principle: Executive claim alone = 0, verified by independent = points
 */
export function calculatePromiseScoringImpact(promise: ExecutivePromiseInput): { performance: number; integrity: number; trustWeight: number } {
  const hasIndependentVerification = promise.evidence.some(e => 
    (e.type === 'oag_report' || e.type === 'cob_report' || e.type === 'citizen_photo') && e.verified
  );

  const hasMediaVerification = promise.evidence.some(e => 
    e.type === 'media_report' && e.verified
  );

  let trustWeight = 0.4; // executive alone
  if (hasIndependentVerification) trustWeight = 1.5;
  else if (hasMediaVerification) trustWeight = 0.8;

  let performance = 0;
  let integrity = 0;

  switch (promise.status) {
    case 'Completed':
      performance = hasIndependentVerification ? 5 : hasMediaVerification ? 2 : 0; // only points if verified
      break;
    case 'In Progress':
      performance = hasIndependentVerification ? Math.round((promise.progress / 100) * 3) : 0;
      break;
    case 'Broken':
      integrity = -10; // broken promise always -10 integrity regardless of verification
      break;
    case 'Overdue':
      integrity = -5;
      break;
    case 'Not Started':
      if (promise.deadline && new Date(promise.deadline) < new Date()) {
        integrity = -5; // overdue not started
      }
      break;
  }

  return { performance, integrity, trustWeight };
}

export const SAMPLE_PROMISES_CSV = `who,whoPosition,county,promise,category,datePromised,deadline,sourceUrl,sourceType,status,progress
William Ruto,President,,Build 100km of Mau Mau roads by 2025,Infrastructure,2022-09-13,2025-12-31,https://president.go.ke/mau-mau-roads-speech-2022.pdf,executive,In Progress,40
William Ruto,President,,Deliver 5 million affordable housing units, Housing,2022-09-13,2027-12-31,https://president.go.ke/affordable-housing-manifesto.pdf,manifesto,In Progress,15
Sakaja Johnson,Governor,Nairobi,Build 20 new markets in Nairobi sub-counties,Infrastructure,2022-08-30,2027-08-30,https://nairobi.go.ke/governor-markets-promise-2022.pdf,executive,Not Started,0
Sakaja Johnson,Governor,Nairobi,Fix Nairobi County pending bills KSh 100B,Infrastructure,2022-09-10,2024-12-31,https://citizen.digital/news/sakaja-pending-bills-promise-2022,media,Broken,0
John Kiarie,MP,Dagoretti South,Build Dagoretti South ICT Hub,Education,2023-01-15,2024-06-30,https://www.parliament.go.ke/hansard/kiarie-ict-hub,executive,Completed,100
`;
