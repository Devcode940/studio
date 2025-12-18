
'use server';
/**
 * @fileOverview Flow for fetching the latest economic data (GDP and Census).
 *
 * - fetchEconomicData - A function that simulates fetching data and returns it.
 * - FetchEconomicDataOutput - The return type for the fetchEconomicData function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { CountyGDP, CensusData } from '@/types';


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
  newGdpData: z.array(CountyGDPSchema).describe("Array of new county GDP data points."),
  newCensusData: z.array(CensusDataSchema).describe("Array of new county census data points."),
  summary: z.string().describe("A brief summary of the data fetching operation.")
});
export type FetchEconomicDataOutput = z.infer<typeof FetchEconomicDataOutputSchema>;


// Mock function to simulate fetching data from an external API
async function getLatestEconomicData(): Promise<{ gdp: Omit<CountyGDP, 'id'>[], census: Omit<CensusData, 'id'>[] }> {
    console.log("Fetching latest economic data from external API...");
    // In a real application, you would make an API call to KNBS or another data source.
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay

    // Return some new, slightly updated mock data for demonstration
    const gdp: Omit<CountyGDP, 'id'>[] = [
        { county: 'Nairobi', gdpMillionsKsh: 2800000, gdpPerCapitaKsh: 630000, year: 2023 },
        { county: 'Mombasa', gdpMillionsKsh: 800000, gdpPerCapitaKsh: 660000, year: 2023 },
        { county: 'Kiambu', gdpMillionsKsh: 650000, gdpPerCapitaKsh: 265000, year: 2023 },
    ];

    const census: Omit<CensusData, 'id'>[] = [
         { county: 'Nairobi', totalPopulation: 4500000, malePopulation: 2250000, femalePopulation: 2250000, householdCount: 1600000, averageHouseholdSize: 2.8, populationDensity: 6450, year: 2023 },
         { county: 'Mombasa', totalPopulation: 1300000, malePopulation: 660000, femalePopulation: 640000, householdCount: 400000, averageHouseholdSize: 3.2, populationDensity: 6000, year: 2023 },
    ];

    return { gdp, census };
}


const fetchEconomicDataTool = ai.defineTool(
    {
      name: 'fetchLatestEconomicData',
      description: 'Fetches the most recent GDP and Census data for Kenyan counties from the official statistics bureau.',
      inputSchema: z.object({}), // No input needed to fetch latest data
      outputSchema: z.object({
          gdp: z.array(CountyGDPSchema),
          census: z.array(CensusDataSchema)
      }),
    },
    async () => await getLatestEconomicData()
  );


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

    const llmResponse = await ai.generate({
      prompt: `You are a data management assistant for the KenyaWatch platform. Your task is to fetch the latest economic data. Use the available tool to get the most recent county GDP and census figures.
      
      Once you have the data, present it in the structured output format. Also, provide a brief, human-readable summary of what was fetched, for example: "Successfully fetched 3 new GDP records and 2 new census records for the year 2023."`,
      model: 'googleai/gemini-2.0-flash',
      tools: [fetchEconomicDataTool],
      output: {
        schema: FetchEconomicDataOutputSchema,
      },
    });

    const output = llmResponse.output();
    if (!output) {
        throw new Error("The AI model did not produce any output.");
    }
    
    // In a real application, you would now take `output.newGdpData` and `output.newCensusData`
    // and write it to your Firestore database, likely using the Firebase Admin SDK in a secure backend environment.
    // For this demo, we are just returning the data to the client.
    console.log("Simulating database update with new data...");

    return output;
  }
);
