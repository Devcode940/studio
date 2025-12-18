
'use server';
/**
 * @fileOverview Fact-checks a representative by searching for news articles and summarizing them.
 *
 * - factCheckRepresentative - A function that handles the fact-checking process.
 * - FactCheckInput - The input type for the factCheckRepresentative function.
 * - FactCheckOutput - The return type for the factCheckRepresentative function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Mock function to simulate finding news articles.
// In a real application, this would use a news API.
async function findNewsArticles(query: string): Promise<string> {
  console.log(`Searching for news about: ${query}`);
  // Simulate finding a few articles and returning a summary.
  const mockSummaries = [
    `A recent investigation by The Daily Chronicle found that ${query} has been praised for their work on a new infrastructure bill, but questions were raised about the project's budget oversight.`,
    `The National Times reported that ${query} was involved in a heated debate over land use policies in their constituency. Supporters praise their firm stance, while opponents criticize a lack of compromise.`,
    `A feature in "Kenya Today" highlighted ${query}'s perfect attendance record in parliament for the last session, though it noted they have been less vocal in major debates.`,
  ];
  // Simple simulation of network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  return mockSummaries.join('\n\n');
}


const findNewsTool = ai.defineTool(
    {
      name: 'findNewsAboutRepresentative',
      description: 'Finds recent news articles about a political representative and provides a summary.',
      inputSchema: z.object({
        name: z.string().describe('The full name of the representative to search for.'),
      }),
      outputSchema: z.string().describe('A summary of the news articles found.'),
    },
    async (input) => await findNewsArticles(input.name)
  );
  

export const FactCheckInputSchema = z.object({
  name: z.string().describe('The name of the representative.'),
});
export type FactCheckInput = z.infer<typeof FactCheckInputSchema>;

export const FactCheckOutputSchema = z.object({
  integrityReport: z.string().describe('A short summary of any verified sagas/scandals or points of integrity concern associated with the representative based on the provided news articles.'),
});
export type FactCheckOutput = z.infer<typeof FactCheckOutputSchema>;


export async function factCheckRepresentative(input: FactCheckInput): Promise<FactCheckOutput> {
  return factCheckFlow(input);
}


const factCheckFlow = ai.defineFlow(
  {
    name: 'factCheckFlow',
    inputSchema: FactCheckInputSchema,
    outputSchema: FactCheckOutputSchema,
  },
  async (input) => {
    const llmResponse = await ai.generate({
      prompt: `You are an AI assistant that summarizes news articles to assess a political representative's integrity. 
      
      Your goal is to provide a neutral, fact-based summary of potential integrity issues, controversies, or scandals based *only* on the information provided by your tools. Do not invent information. If the provided articles show no significant integrity concerns, state that clearly.
      
      Fact-check the following representative: ${input.name}`,
      model: 'googleai/gemini-2.0-flash',
      tools: [findNewsTool],
      output: {
        schema: FactCheckOutputSchema,
      },
    });

    const output = llmResponse.output();
    if (!output) {
      throw new Error("The AI model did not produce any output.");
    }
    return output;
  }
);
