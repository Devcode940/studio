/**
 * Office of the Attorney General & Kenya Law (AG) Integration
 * Primary source for legislative activity – bills sponsored, assented, unconstitutional county laws
 * Sources: https://www.statelaw.go.ke/ + https://kenyalaw.org/kl/
 * Public domain, highest trust for bills
 */

import { z } from 'zod';
import { logger } from './logger';

export const BillSchema = z.object({
  title: z.string().min(5),
  sponsor: z.string().optional(), // MP name
  sponsorSlug: z.string().optional(),
  countyOrConstituency: z.string().optional(),
  year: z.number().int().min(2000).max(2030),
  status: z.enum(['Proposed', 'First Reading', 'Second Reading', 'Committee', 'Third Reading', 'Assented', 'Withdrawn', 'Unconstitutional']).default('Proposed'),
  type: z.enum(['National', 'County', 'Private Member']).default('National'),
  sourceUrl: z.string().url(),
  kenyaLawId: z.string().optional(),
  dateAssented: z.string().optional(), // ISO date
  isUnconstitutional: z.boolean().default(false),
  unconstitutionalReason: z.string().optional(),
});

export type BillInput = z.infer<typeof BillSchema>;

export interface AGFetchResult {
  bills: BillInput[];
  summary: string;
  sources: string[];
}

/**
 * CSV format for admin upload:
 * title,sponsor,year,status,type,sourceUrl,kenyaLawId,dateAssented,isUnconstitutional,unconstitutionalReason
 */

export function parseBillsCSV(csvText: string): BillInput[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) throw new Error('CSV empty');

  const header = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s/g, ''));
  const headerMap: Record<string, string> = {
    'title': 'title',
    'sponsor': 'sponsor',
    'sponsorslug': 'sponsorSlug',
    'year': 'year',
    'status': 'status',
    'type': 'type',
    'sourceurl': 'sourceUrl',
    'kenyalawid': 'kenyaLawId',
    'dateassented': 'dateAssented',
    'isunconstitutional': 'isUnconstitutional',
    'unconstitutionalreason': 'unconstitutionalReason',
  };

  const bills: BillInput[] = [];

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
      title: row.title,
      sponsor: row.sponsor,
      sponsorSlug: row.sponsorSlug || row.sponsor?.toLowerCase().replace(/\s+/g, '-'),
      year: Number(row.year),
      status: row.status || 'Proposed',
      type: row.type || 'National',
      sourceUrl: row.sourceUrl,
      kenyaLawId: row.kenyaLawId,
      dateAssented: row.dateAssented,
      isUnconstitutional: row.isUnconstitutional?.toLowerCase() === 'true' || row.isUnconstitutional === '1',
      unconstitutionalReason: row.unconstitutionalReason,
    };

    const validated = BillSchema.parse(parsed);
    bills.push(validated);
  }

  logger.info('Parsed AG bills CSV', { count: bills.length });
  return bills;
}

export function generateBillDocId(bill: BillInput): string {
  const clean = bill.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 60);
  return `${clean}-${bill.year}`.replace(/--+/g, '-');
}

/**
 * Calculate legislative activity from bills
 */
export function calculateFromBills(bills: BillInput[]): {
  billsSponsored: number;
  billsAssented: number;
  unconstitutionalCount: number;
} {
  const billsSponsored = bills.length;
  const billsAssented = bills.filter(b => b.status === 'Assented').length;
  const unconstitutionalCount = bills.filter(b => b.isUnconstitutional).length;

  return { billsSponsored, billsAssented, unconstitutionalCount };
}

export const SAMPLE_BILLS_CSV = `title,sponsor,year,status,type,sourceUrl,kenyaLawId,dateAssented,isUnconstitutional,unconstitutionalReason
The Finance Bill 2024,Ndindi Nyoro,2024,Assented,National,https://kenyalaw.org/kl/fileadmin/pdfdownloads/Bills/2024/Finance_Bill_2024.pdf,Finance-2024,2024-06-26,false,
The Affordable Housing Bill 2023,Opiyo Wandayi,2023,Assented,National,https://kenyalaw.org/kl/fileadmin/pdfdownloads/Bills/2023/Affordable_Housing_Bill_2023.pdf,Housing-2023,2024-03-19,false,
Kiambu County Alcoholic Drinks Control Bill 2023,John Kamau,2023,Unconstitutional,County,https://www.statelaw.go.ke/resources/county-bills/kiambu-alcohol-2023.pdf,Kiambu-Alcohol-2023,,true,Declared unconstitutional by High Court for public participation violation
The Climate Change Amendment Bill 2023,Millie Odhiambo,2023,Second Reading,National,https://kenyalaw.org/kl/fileadmin/pdfdownloads/Bills/2023/Climate_Change_Amendment_Bill_2023.pdf,Climate-2023,,false,
`;

/**
 * Mock fetch for dev
 */
export async function fetchMockBills(): Promise<BillInput[]> {
  return parseBillsCSV(SAMPLE_BILLS_CSV);
}

/**
 * Real Kenya Law scraper (best effort) – fetches bills list page
 * Note: Kenya Law site structure may change – keep fallback mock
 */
export async function fetchKenyaLawBills(): Promise<BillInput[]> {
  try {
    logger.info('Attempting Kenya Law bills fetch');

    // Kenya Law bills page: https://kenyalaw.org/kl/index.php?id=TitleSearch&category=Bills
    // For real: would need cheerio scrape – simplified to mock for now with log
    // In production, implement:
    // const res = await fetch('https://kenyalaw.org/kl/index.php?id=TitleSearch&category=Bills', { next: { revalidate: 86400 } });
    // ... parse ...

    throw new Error('Kenya Law scraper not yet implemented – use CSV upload');
  } catch (err) {
    logger.warn('Kenya Law fetch failed, using mock', { error: (err as Error).message });
    return fetchMockBills();
  }
}
