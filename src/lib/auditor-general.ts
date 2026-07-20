/**
 * Office of the Auditor General (OAG Kenya) Integration
 * Primary source for integrity & CDF utilization – weight 1.5x in scoring
 * Source: https://www.oagkenya.go.ke/audit-reports/
 * Docs are public domain, auditable, highest trust
 */

import { z } from 'zod';
import { logger } from './logger';

export const AuditReportSchema = z.object({
  countyOrConstituency: z.string().min(2),
  county: z.string().optional(), // derived
  year: z.string().regex(/^\d{4}-\d{4}$/), // e.g., 2022-2023
  auditOpinion: z.enum(['Unqualified', 'Qualified', 'Adverse', 'Disclaimer']),
  unsupportedExpenditure: z.number().min(0).default(0),
  irregularProcurement: z.number().min(0).default(0),
  pendingBills: z.number().min(0).optional(),
  cdfUtilization: z.number().min(0).max(100).optional(), // 0-100% for NG-CDF
  keyIssues: z.array(z.string()).default([]),
  sourceUrl: z.string().url(),
  sourceType: z.literal('oag').default('oag'),
  reportType: z.enum(['ng-cdf', 'county-executive', 'county-assembly', 'national-government']).default('ng-cdf'),
});

export type AuditReportInput = z.infer<typeof AuditReportSchema>;

export interface OAGFetchResult {
  reports: AuditReportInput[];
  summary: string;
  sources: string[];
}

/**
 * CSV format for admin upload:
 * countyOrConstituency,year,auditOpinion,unsupportedExpenditure,irregularProcurement,pendingBills,cdfUtilization,keyIssues,sourceUrl,reportType
 * Example:
 * Westlands,2022-2023,Qualified,12000000,5000000,0,67,"Unsupported KSh 12M travel; Irregular procurement KSh 5M",https://www.oagkenya.go.ke/wp-content/uploads/2024/03/Westlands-NG-CDF-2022-2023.pdf,ng-cdf
 */

export function parseOAGCSV(csvText: string): AuditReportInput[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) throw new Error('CSV empty or only header');

  const header = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s/g, ''));
  // Normalize header mapping
  const headerMap: Record<string, string> = {
    'countyorconstituency': 'countyOrConstituency',
    'county': 'county',
    'year': 'year',
    'auditopinion': 'auditOpinion',
    'unsupportedexpenditure': 'unsupportedExpenditure',
    'irregularprocurement': 'irregularProcurement',
    'pendingbills': 'pendingBills',
    'cdfutilization': 'cdfUtilization',
    'keyissues': 'keyIssues',
    'sourceurl': 'sourceUrl',
    'reporttype': 'reportType',
  };

  const reports: AuditReportInput[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple CSV parser handling quoted commas
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"' ) {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^"|"$/g, ''));

    const row: any = {};
    header.forEach((h, idx) => {
      const mapped = headerMap[h] || h;
      row[mapped] = values[idx];
    });

    // Parse keyIssues as semicolon separated
    const keyIssues = row.keyIssues ? row.keyIssues.split(';').map((s: string) => s.trim()).filter(Boolean) : [];

    const parsed = {
      countyOrConstituency: row.countyOrConstituency || row.county,
      county: row.county,
      year: row.year,
      auditOpinion: row.auditOpinion,
      unsupportedExpenditure: Number(row.unsupportedExpenditure) || 0,
      irregularProcurement: Number(row.irregularProcurement) || 0,
      pendingBills: row.pendingBills ? Number(row.pendingBills) : undefined,
      cdfUtilization: row.cdfUtilization ? Number(row.cdfUtilization) : undefined,
      keyIssues,
      sourceUrl: row.sourceUrl,
      reportType: row.reportType || 'ng-cdf',
      sourceType: 'oag' as const,
    };

    const validated = AuditReportSchema.parse(parsed);
    reports.push(validated);
  }

  logger.info('Parsed OAG CSV', { count: reports.length });
  return reports;
}

export function generateOAGDocId(report: AuditReportInput): string {
  const clean = report.countyOrConstituency.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return `${clean}-${report.year}-${report.reportType}`.replace(/--+/g, '-');
}

/**
 * Calculate integrity & performance from OAG reports
 * Used in scoring.ts
 */
export function calculateFromOAGReports(reports: AuditReportInput[]): {
  verifiedScandals: number;
  allegedScandals: number;
  cdfUtilization: number;
  totalUnsupported: number;
  auditOpinionScore: number; // 0-100 where Unqualified=100, Adverse=0
} {
  let verifiedScandals = 0;
  let allegedScandals = 0;
  let totalUnsupported = 0;
  let cdfSum = 0;
  let cdfCount = 0;
  let opinionScoreSum = 0;

  for (const r of reports) {
    totalUnsupported += r.unsupportedExpenditure + r.irregularProcurement;

    // Opinion scoring
    switch (r.auditOpinion) {
      case 'Unqualified': opinionScoreSum += 100; break;
      case 'Qualified': opinionScoreSum += 60; verifiedScandals += 1; break;
      case 'Adverse': opinionScoreSum += 20; verifiedScandals += 2; break;
      case 'Disclaimer': opinionScoreSum += 0; verifiedScandals += 2; break;
    }

    // Key issues containing certain keywords = additional scandals
    for (const issue of r.keyIssues) {
      const lower = issue.toLowerCase();
      if (lower.includes('unsupported') && r.unsupportedExpenditure > 10_000_000) verifiedScandals += 1;
      if (lower.includes('irregular') && r.irregularProcurement > 5_000_000) verifiedScandals += 1;
      if (lower.includes('pending bills') && (r.pendingBills || 0) > 1_000_000_000) allegedScandals += 1;
    }

    if (r.cdfUtilization !== undefined) {
      cdfSum += r.cdfUtilization;
      cdfCount++;
    }
  }

  const cdfUtilization = cdfCount > 0 ? Math.round(cdfSum / cdfCount) : 50; // default 50 if none
  const auditOpinionScore = reports.length > 0 ? Math.round(opinionScoreSum / reports.length) : 50;

  return {
    verifiedScandals: Math.min(10, verifiedScandals), // cap
    allegedScandals: Math.min(10, allegedScandals),
    cdfUtilization,
    totalUnsupported,
    auditOpinionScore,
  };
}

export const SAMPLE_OAG_CSV = `countyOrConstituency,year,auditOpinion,unsupportedExpenditure,irregularProcurement,pendingBills,cdfUtilization,keyIssues,sourceUrl,reportType
Westlands,2022-2023,Qualified,12000000,5000000,0,67,"Unsupported KSh 12M travel; Irregular procurement KSh 5M for office furniture",https://www.oagkenya.go.ke/wp-content/uploads/2024/03/Westlands-NG-CDF-2022-2023.pdf,ng-cdf
Langata,2022-2023,Unqualified,0,0,0,85,"No major issues; CDF absorption 85%",https://www.oagkenya.go.ke/wp-content/uploads/2024/03/Langata-NG-CDF-2022-2023.pdf,ng-cdf
Kiambu County Executive,2022-2023,Adverse,45000000,20000000,1200000000,0,"Adverse opinion; Pending bills KSh 1.2B; Unsupported expenditure KSh 45M",https://www.oagkenya.go.ke/wp-content/uploads/2024/03/Kiambu-County-Executive-2022-2023.pdf,county-executive
Nairobi County Assembly,2022-2023,Qualified,8000000,3000000,500000000,0,"Qualified due to unsupported allowances KSh 8M",https://www.oagkenya.go.ke/wp-content/uploads/2024/03/Nairobi-County-Assembly-2022-2023.pdf,county-assembly
`;

/**
 * Mock fetch for dev (when no CSV uploaded) – returns sample
 */
export async function fetchMockOAGReports(): Promise<AuditReportInput[]> {
  return parseOAGCSV(SAMPLE_OAG_CSV);
}
