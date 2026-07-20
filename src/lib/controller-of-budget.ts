/**
 * Controller of Budget (CoB Kenya) Integration
 * Independent Article 228 – Checks executive spending
 * Source: https://cob.go.ke/reports/ – County Budget Implementation Review Reports (Quarterly)
 * Primary source for Budget vs Actual – weight 1.5x
 */

import { z } from 'zod';
import { logger } from './logger';

export const CoBReportSchema = z.object({
  county: z.string().min(2),
  year: z.string().regex(/^\d{4}-\d{4}$/), // 2023-2024
  quarter: z.enum(['Q1', 'Q2', 'Q3', 'Q4']),
  approvedBudget: z.number().min(0), // KSh millions
  exchequerReleases: z.number().min(0), // Actual released by Treasury
  actualExpenditure: z.number().min(0),
  pendingBills: z.number().min(0),
  budgetVariance: z.number().optional(), // calculated
  absorptionRate: z.number().min(0).max(100).optional(), // actual/budget *100
  stateHouseSpend: z.number().optional(), // for national
  travelSpend: z.number().optional(),
  developmentBudget: z.number().optional(),
  developmentActual: z.number().optional(),
  sourceUrl: z.string().url(),
  sourceType: z.literal('cob').default('cob'),
});

export type CoBReportInput = z.infer<typeof CoBReportSchema>;

export function parseCoBCSV(csvText: string): CoBReportInput[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) throw new Error('CSV empty');

  const header = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s/g, ''));
  const headerMap: Record<string, string> = {
    'county': 'county',
    'year': 'year',
    'quarter': 'quarter',
    'approvedbudget': 'approvedBudget',
    'exchequerreleases': 'exchequerReleases',
    'actualexpenditure': 'actualExpenditure',
    'pendingbills': 'pendingBills',
    'statehousespend': 'stateHouseSpend',
    'travelspend': 'travelSpend',
    'developmentbudget': 'developmentBudget',
    'developmentactual': 'developmentActual',
    'sourceurl': 'sourceUrl',
  };

  const reports: CoBReportInput[] = [];

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

    const approved = Number(row.approvedBudget) || 0;
    const actual = Number(row.actualExpenditure) || 0;
    const budgetVariance = approved > 0 ? Math.round(((approved - actual) / approved) * 100) : 0;
    const absorptionRate = approved > 0 ? Math.round((actual / approved) * 100) : 0;

    const parsed = {
      county: row.county,
      year: row.year,
      quarter: row.quarter || 'Q1',
      approvedBudget: approved,
      exchequerReleases: Number(row.exchequerReleases) || 0,
      actualExpenditure: actual,
      pendingBills: Number(row.pendingBills) || 0,
      budgetVariance,
      absorptionRate,
      stateHouseSpend: row.stateHouseSpend ? Number(row.stateHouseSpend) : undefined,
      travelSpend: row.travelSpend ? Number(row.travelSpend) : undefined,
      developmentBudget: row.developmentBudget ? Number(row.developmentBudget) : undefined,
      developmentActual: row.developmentActual ? Number(row.developmentActual) : undefined,
      sourceUrl: row.sourceUrl,
      sourceType: 'cob' as const,
    };

    const validated = CoBReportSchema.parse(parsed);
    reports.push(validated);
  }

  logger.info('Parsed CoB CSV', { count: reports.length });
  return reports;
}

export function generateCoBDocId(report: CoBReportInput): string {
  const clean = report.county.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return `${clean}-${report.year}-${report.quarter}`.replace(/--+/g, '-');
}

export function calculateCoBScoringImpact(report: CoBReportInput): { integrity: number; performance: number; isHighVariance: boolean; isHighPendingBills: boolean } {
  let integrity = 0;
  let performance = 0;

  const isHighVariance = (report.budgetVariance || 0) > 15; // >15% variance = executive not trustworthy
  const isHighPendingBills = report.pendingBills > 1_000_000000; // >1B pending bills

  if (isHighVariance) integrity -= 5;
  if (isHighPendingBills) integrity -= 10;

  // Travel > 10% of development = -5
  if (report.travelSpend && report.developmentBudget) {
    if (report.travelSpend > report.developmentBudget * 0.1) integrity -= 5;
  }

  // Absorption rate high = good performance
  if ((report.absorptionRate || 0) > 80) performance += 3;
  else if ((report.absorptionRate || 0) < 50) performance -= 2;

  return { integrity, performance, isHighVariance, isHighPendingBills };
}

export const SAMPLE_COB_CSV = `county,year,quarter,approvedBudget,exchequerReleases,actualExpenditure,pendingBills,travelSpend,developmentBudget,developmentActual,sourceUrl
Nairobi,2023-2024,Q1,40000000000,30000000000,28000000000,1200000000,50000000,15000000000,12000000000,https://cob.go.ke/wp-content/uploads/2024/02/Nairobi-County-BIRR-Q1-2023-2024.pdf
Kiambu,2023-2024,Q1,15000000000,12000000000,10000000000,800000000,30000000,6000000000,4000000000,https://cob.go.ke/wp-content/uploads/2024/02/Kiambu-County-BIRR-Q1-2023-2024.pdf
Mombasa,2023-2024,Q1,13000000000,10000000000,9500000000,600000000,25000000,5000000000,4500000000,https://cob.go.ke/wp-content/uploads/2024/02/Mombasa-County-BIRR-Q1-2023-2024.pdf
National Executive (State House),2023-2024,Q1,5000000000,4000000000,3800000000,0,200000000,0,0,https://cob.go.ke/wp-content/uploads/2024/02/National-Government-BIRR-Q1-2023-2024.pdf
`;
