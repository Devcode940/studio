/**
 * Mzalendo + Parliament Data Pipeline
 * Real App: Scrapes or uses EveryPolitician archived data
 * Mzalendo has no official public API, but Pombola platform may expose JSON
 */

import { logger } from './logger';

export interface MzalendoMP {
  name: string;
  slug: string;
  county: string;
  constituency: string;
  party: string;
  position: 'MP' | 'Senator' | 'Governor' | 'Women Rep' | 'MCA';
  photoUrl?: string;
  attendance?: number;
  billsSponsored?: number;
}

const USE_MOCK = process.env.USE_MOCK_AI_DATA === 'true';

/**
 * Attempt to fetch from EveryPolitician archived Kenya data (open source)
 * https://everypolitician.org/kenya.html – archived but JSON still available via GitHub
 */
async function fetchEveryPoliticianKenya(): Promise<MzalendoMP[]> {
  try {
    logger.info('Fetching EveryPolitician Kenya data');
    
    // EveryPolitician GitHub: https://github.com/everypolitician/everypolitician-data/blob/master/data/Kenya/National_Assembly/ep-popolo-v1.0.json
    const url = 'https://raw.githubusercontent.com/everypolitician/everypolitician-data/master/data/Kenya/National_Assembly/ep-popolo-v1.0.json';
    
    const res = await fetch(url, { next: { revalidate: 86400 } }); // cache 24hr
    
    if (!res.ok) throw new Error(`EveryPolitician fetch failed: ${res.status}`);
    
    const data = await res.json();
    
    const mps: MzalendoMP[] = (data.persons || []).slice(0, 20).map((p: any) => ({
      name: p.name,
      slug: p.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      county: 'Unknown', // EveryPolitician doesn't have county easily, need enrich
      constituency: p.area || 'Unknown Constituency',
      party: p.party || 'Unknown',
      position: 'MP' as const,
      photoUrl: p.images?.[0]?.url,
    }));

    logger.info('EveryPolitician fetched', { count: mps.length });
    return mps;
  } catch (err) {
    logger.error('EveryPolitician fetch failed', err);
    if (USE_MOCK) {
      return fetchMockMPs();
    }
    throw err;
  }
}

async function fetchMockMPs(): Promise<MzalendoMP[]> {
  logger.warn('[MOCK] Returning mock MPs for dev');
  return [
    { name: 'John Doe', slug: 'john-doe', county: 'Nairobi', constituency: 'Westlands', party: 'UDA', position: 'MP', attendance: 85, billsSponsored: 3 },
    { name: 'Jane Wanjiku', slug: 'jane-wanjiku', county: 'Kiambu', constituency: 'Kiambaa', party: 'ODM', position: 'MP', attendance: 92, billsSponsored: 5 },
    { name: 'Peter Mwangi', slug: 'peter-mwangi', county: 'Nakuru', constituency: 'Nakuru Town East', party: 'Jubilee', position: 'MP' },
    { name: 'Amina Hassan', slug: 'amina-hassan', county: 'Mombasa', constituency: 'Nyali', party: 'ODM', position: 'Women Rep', attendance: 88 },
    { name: 'Kipchumba Murkomen', slug: 'kipchumba-murkomen', county: 'Elgeyo Marakwet', constituency: 'Elgeyo Marakwet', party: 'UDA', position: 'Senator', attendance: 78 },
  ];
}

/**
 * Main entry: Fetch MPs with fallback chain
 */
export async function fetchRepresentativesFromMzalendo(): Promise<MzalendoMP[]> {
  try {
    const mps = await fetchEveryPoliticianKenya();
    if (mps.length > 0) return mps;
    throw new Error('No MPs from EveryPolitician');
  } catch (err) {
    logger.warn('Falling back to mock MPs', { error: (err as Error).message });
    return fetchMockMPs();
  }
}

/**
 * Enrichment: Map constituency to county ( Kenya 47 counties mapping )
 * Real app should have full mapping CSV `data/constituency_to_county.csv`
 */
export const CONSTITUENCY_TO_COUNTY: Record<string, string> = {
  'Westlands': 'Nairobi',
  'Langata': 'Nairobi',
  'Kiambaa': 'Kiambu',
  'Nyali': 'Mombasa',
  'Nakuru Town East': 'Nakuru',
  // ... add 290 constituencies
};

export function enrichCounty(constituency: string): string {
  return CONSTITUENCY_TO_COUNTY[constituency] || 'Unknown';
}

/**
 * Sample CSV for MCA-first strategy (your moat)
 * Real app: Should seed 1450 MCAs from IEBC 2022 results Excel
 */
export const SAMPLE_MCA_CSV = `name,slug,county,constituency,ward,party,position
John Kamau,john-kamau,Nairobi,Westlands,Kitisuru,UDA,MCA
Jane Mwikali,jane-mwikali,Mombasa,Nyali,Kongowea,ODM,MCA
`;
