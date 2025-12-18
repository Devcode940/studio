
'use server';
/**
 * @fileOverview Flow for fetching the latest economic data (GDP and Census) and writing it to Firestore.
 *
 * - fetchEconomicData - A function that simulates fetching data and updates the database.
 * - FetchEconomicDataOutput - The return type for the fetchEconomicData function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { CountyGDP, CensusData } from '@/types';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { getSdks } from '@/firebase'; // Assuming getSdks can be used on the server


// Define Zod schemas that match the data types, but without the 'id'
const CountyGDPSchema = z.object({
  county: z.string(),
  gdpMillionsKsh: z.number(),
  gdpPerCapitaKsh: z.number(),
  year: z.number(),
});

const CensusDataSchema = z.object({
  county: z.string(),
  totalPopulation: z.number(),
  malePopulation: z.number(),
  femalePopulation: z.number(),
  householdCount: z.number(),
  averageHouseholdSize: z.number(),
  populationDensity: z.number(),
  year: z.number(),
});


export const FetchEconomicDataOutputSchema = z.object({
  gdpCount: z.number().describe("Number of GDP records updated or created."),
  censusCount: z.number().describe("Number of Census records updated or created."),
  summary: z.string().describe("A brief summary of the data update operation.")
});
export type FetchEconomicDataOutput = z.infer<typeof FetchEconomicDataOutputSchema>;


// Mock function to simulate fetching data from an external API (e.g., KNBS)
async function getLatestEconomicDataFromAPI(): Promise<{ gdp: Omit<CountyGDP, 'id'>[], census: Omit<CensusData, 'id'>[] }> {
    console.log("Fetching latest economic data from external API...");
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

    const gdp: Omit<CountyGDP, 'id'>[] = [
        { county: 'Nairobi', gdpMillionsKsh: 2850000, gdpPerCapitaKsh: 640000, year: 2023 },
        { county: 'Mombasa', gdpMillionsKsh: 810000, gdpPerCapitaKsh: 670000, year: 2023 },
        { county: 'Kiambu', gdpMillionsKsh: 660000, gdpPerCapitaKsh: 270000, year: 2023 },
        { county: 'Nakuru', gdpMillionsKsh: 550000, gdpPerCapitaKsh: 250000, year: 2023 },
    ];

    const census: Omit<CensusData, 'id'>[] = [
         { county: 'Nairobi', totalPopulation: 4550000, malePopulation: 2275000, femalePopulation: 2275000, householdCount: 1620000, averageHouseholdSize: 2.8, populationDensity: 6500, year: 2023 },
         { county: 'Mombasa', totalPopulation: 1310000, malePopulation: 665000, femalePopulation: 645000, householdCount: 405000, averageHouseholdSize: 3.2, populationDensity: 6050, year: 2023 },
    ];

    return { gdp, census };
}


export async function fetchEconomicData(): Promise<FetchEconomicDataOutput> {
  return fetchEconomicDataFlow();
}

const fetchEconomicDataFlow = ai.defineFlow(
  {
    name: 'fetchEconomicDataFlow',
    inputSchema: z.object({}),
    outputSchema: FetchEconomicDataOutputSchema,
  },
  async () => {
    // Step 1: Fetch the data from the external source.
    const { gdp: newGdpData, census: newCensusData } = await getLatestEconomicDataFromAPI();
    
    // Step 2: Write the data to Firestore.
    // This requires Firestore to be available in the server environment where the flow runs.
    const { firestore } = getSdks(); // This needs to be configured to work on the server.
    const batch = writeBatch(firestore);

    // Update GDP data
    const gdpCollection = collection(firestore, 'county_gdp');
    newGdpData.forEach(gdpRecord => {
        // Create a predictable ID based on county and year to avoid duplicates.
        const docId = `${gdpRecord.county.toLowerCase().replace(/\s+/g, '-')}-${gdpRecord.year}`;
        const docRef = doc(gdpCollection, docId);
        batch.set(docRef, gdpRecord, { merge: true }); // Use merge to create or update.
    });

    // Update Census data
    const censusCollection = collection(firestore, 'census_data');
    newCensusData.forEach(censusRecord => {
        const docId = `${censusRecord.county.toLowerCase().replace(/\s+/g, '-')}-${censusRecord.year}`;
        const docRef = doc(censusCollection, docId);
        batch.set(docRef, censusRecord, { merge: true });
    });

    // Commit the batch write.
    await batch.commit();

    const summary = `Successfully updated ${newGdpData.length} GDP records and ${newCensusData.length} census records for the year 2023.`;
    
    // Step 3: Return a summary of the operation.
    return {
      gdpCount: newGdpData.length,
      censusCount: newCensusData.length,
      summary: summary,
    };
  }
);
