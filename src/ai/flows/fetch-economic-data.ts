'use server';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { CountyGDP, CensusData } from '@/types';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

const USE_MOCK = process.env.USE_MOCK_AI_DATA === 'true' && process.env.NODE_ENV !== 'production';

export const FetchEconomicDataOutputSchema = z.object({
  gdpCount: z.number(),
  censusCount: z.number(),
  summary: z.string(),
  source: z.string().optional(),
});
export type FetchEconomicDataOutput = z.infer<typeof FetchEconomicDataOutputSchema>;

async function getLatestEconomicDataFromAPI(): Promise<{ gdp: Omit<CountyGDP, 'id'>[], census: Omit<CensusData, 'id'>[], source: string }> {
    if (!USE_MOCK) throw new Error("Real KNBS API not configured. Set USE_MOCK_AI_DATA=true for dev");
    console.warn("[MOCK] Fetching mock economic data");
    await new Promise(resolve => setTimeout(resolve, 500));
    const gdp: Omit<CountyGDP, 'id'>[] = [
        { county: 'Nairobi', gdpMillionsKsh: 2850000, gdpPerCapitaKsh: 640000, year: 2023 },
        { county: 'Mombasa', gdpMillionsKsh: 810000, gdpPerCapitaKsh: 670000, year: 2023 },
    ];
    const census: Omit<CensusData, 'id'>[] = [
         { county: 'Nairobi', totalPopulation: 4550000, malePopulation: 2275000, femalePopulation: 2275000, householdCount: 1620000, averageHouseholdSize: 2.8, populationDensity: 6500, year: 2023 },
    ];
    return { gdp, census, source: 'MOCK_DATA' };
}

export async function fetchEconomicData(): Promise<FetchEconomicDataOutput> {
  return fetchEconomicDataFlow();
}

const fetchEconomicDataFlow = ai.defineFlow(
  { name: 'fetchEconomicDataFlow', inputSchema: z.object({}), outputSchema: FetchEconomicDataOutputSchema },
  async () => {
    const { gdp: newGdpData, census: newCensusData, source } = await getLatestEconomicDataFromAPI();
    const { firestore } = initializeFirebase();
    const batch = writeBatch(firestore);
    const gdpCollection = collection(firestore, 'county_gdp');
    newGdpData.forEach(gdpRecord => {
        const docId = `${gdpRecord.county.toLowerCase().replace(/\s+/g, '-')}-${gdpRecord.year}`;
        batch.set(doc(gdpCollection, docId), gdpRecord, { merge: true });
    });
    const censusCollection = collection(firestore, 'census_data');
    newCensusData.forEach(censusRecord => {
        const docId = `${censusRecord.county.toLowerCase().replace(/\s+/g, '-')}-${censusRecord.year}`;
        batch.set(doc(censusCollection, docId), censusRecord, { merge: true });
    });
    await batch.commit();
    return { gdpCount: newGdpData.length, censusCount: newCensusData.length, summary: `Updated ${newGdpData.length} GDP and ${newCensusData.length} census`, source };
  }
);
