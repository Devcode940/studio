/**
 * KNBS (Kenya National Bureau of Statistics) Data Pipeline
 * Reality: KNBS has NO public API (per FAQ). Data only in PDFs.
 * Real App Solution: Admin CSV upload + PDF parsing fallback + openAfrica CKAN
 */

import { z } from 'zod';
import { logger } from './logger';

export const CountyGDPSchema = z.object({
  county: z.string().min(2),
  gdpMillionsKsh: z.number().positive(),
  gdpPerCapitaKsh: z.number().positive().optional(),
  year: z.number().int().min(2000).max(2030),
  source: z.string().optional().default('KNBS Facts and Figures'),
});

export const CensusDataSchema = z.object({
  county: z.string().min(2),
  totalPopulation: z.number().int().positive(),
  malePopulation: z.number().int().positive(),
  femalePopulation: z.number().int().positive(),
  householdCount: z.number().int().positive(),
  averageHouseholdSize: z.number().positive(),
  populationDensity: z.number().positive(),
  year: z.number().int().min(2000).max(2030),
  source: z.string().optional(),
});

export type CountyGDPInput = z.infer<typeof CountyGDPSchema>;
export type CensusDataInput = z.infer<typeof CensusDataSchema>;

/**
 * Parse CSV text (from admin upload) to GDP records
 * Expected header: county,gdpMillionsKsh,gdpPerCapitaKsh,year,source
 */
export function parseCountyGDPCSV(csvText: string): CountyGDPInput[] {
  const lines = csvText.trim().split('\n');
  const header = lines[0].split(',').map(h => h.trim().toLowerCase());
  
  const required = ['county', 'gdpmillionsksh', 'year'];
  for (const r of required) {
    if (!header.includes(r)) throw new Error(`CSV missing required column: ${r}`);
  }

  const records: CountyGDPInput[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = line.split(',').map(v => v.trim());
    const row: any = {};
    header.forEach((h, idx) => {
      row[h] = values[idx];
    });

    const parsed = {
      county: row['county'],
      gdpMillionsKsh: Number(row['gdpmillionsksh']),
      gdpPerCapitaKsh: row['gdppercapitaksh'] ? Number(row['gdppercapitaksh']) : undefined,
      year: Number(row['year']),
      source: row['source'] || 'Admin CSV Upload',
    };

    const validated = CountyGDPSchema.parse(parsed);
    records.push(validated);
  }

  logger.info('Parsed county GDP CSV', { count: records.length });
  return records;
}

export function parseCensusCSV(csvText: string): CensusDataInput[] {
  const lines = csvText.trim().split('\n');
  const header = lines[0].split(',').map(h => h.trim().toLowerCase());

  const records: CensusDataInput[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = line.split(',').map(v => v.trim());
    const row: any = {};
    header.forEach((h, idx) => { row[h] = values[idx]; });

    const parsed = {
      county: row['county'],
      totalPopulation: Number(row['totalpopulation']),
      malePopulation: Number(row['malepopulation']),
      femalePopulation: Number(row['femalepopulation']),
      householdCount: Number(row['householdcount']),
      averageHouseholdSize: Number(row['averagehouseholdsize']),
      populationDensity: Number(row['populationdensity']),
      year: Number(row['year']),
      source: row['source'] || 'Admin CSV Upload',
    };

    const validated = CensusDataSchema.parse(parsed);
    records.push(validated);
  }

  logger.info('Parsed census CSV', { count: records.length });
  return records;
}

/**
 * Generate deterministic doc ID to avoid duplicates: nairobi-2023
 */
export function generateGDPDocId(county: string, year: number): string {
  return `${county.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${year}`;
}

/**
 * Sample CSV templates for admin download
 */
export const SAMPLE_GDP_CSV = `county,gdpMillionsKsh,gdpPerCapitaKsh,year,source
Nairobi,2850000,640000,2023,KNBS 2025 Facts and Figures pg 12
Mombasa,810000,670000,2023,KNBS 2025 Facts and Figures
Kiambu,660000,270000,2023,KNBS County GDP 2023
Nakuru,550000,250000,2023,Agreed value
`;

export const SAMPLE_CENSUS_CSV = `county,totalPopulation,malePopulation,femalePopulation,householdCount,averageHouseholdSize,populationDensity,year,source
Nairobi,4550000,2275000,2275000,1620000,2.8,6500,2023,KNBS 2019 Census + Projections
Mombasa,1310000,665000,645000,405000,3.2,6050,2023,KNBS
`;
