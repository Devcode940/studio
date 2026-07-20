'use server';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { fetchNewsForRepresentative } from '@/lib/news';
import { logger } from '@/lib/logger';

const USE_MOCK = process.env.USE_MOCK_AI_DATA === 'true' && process.env.NODE_ENV !== 'production';

async function findNewsArticles(query: string): Promise<string> {
  try {
    const result = await fetchNewsForRepresentative(query);
    // Return summary with sources for tool
    return result.summary;
  } catch (err) {
    logger.error('News fetch failed in fact-check tool', err, { query });
    if (USE_MOCK) {
      return `Mock news for ${query}: praised for CDF utilization 85% (Source: https://example.com)`;
    }
    throw err;
  }
}

const findNewsTool = ai.defineTool(
  {
    name: 'findNewsAboutRepresentative',
    description: 'Finds recent news articles about a political representative from reputable Kenyan sources (Nation, Standard, Star, Mzalendo) with source URLs.',
    inputSchema: z.object({ name: z.string().describe('Full name of representative') }),
    outputSchema: z.string(),
  },
  async (input) => await findNewsArticles(input.name)
);

export const FactCheckInputSchema = z.object({ name: z.string().min(2) });
export type FactCheckInput = z.infer<typeof FactCheckInputSchema>;

export const FactCheckOutputSchema = z.object({
  integrityReport: z.string(),
  sources: z.array(z.string().url()).optional(),
  confidence: z.enum(['high', 'medium', 'low']),
});
export type FactCheckOutput = z.infer<typeof FactCheckOutputSchema>;

export async function factCheckRepresentative(input: FactCheckInput): Promise<FactCheckOutput> {
  return factCheckFlow(input);
}

const factCheckFlow = ai.defineFlow(
  { name: 'factCheckFlow', inputSchema: FactCheckInputSchema, outputSchema: FactCheckOutputSchema },
  async (input) => {
    const llmResponse = await ai.generate({
      prompt: `You are a Fact-Checker for KenyaWatch. CRITICAL: ONLY summarize tools. If no reputable sources → "No verified integrity concerns found in reputable sources searched for ${input.name}". Add disclaimer: "AI-generated summary for informational purposes. Verify with original sources." Include confidence high/medium/low based on source count and reputation. Fact-check: ${input.name}`,
      model: 'googleai/gemini-2.0-flash',
      tools: [findNewsTool],
      output: { schema: FactCheckOutputSchema },
    });
    const output = llmResponse.output as FactCheckOutput | undefined;
    if (!output) throw new Error("No output");
    // Enrich sources from news result if missing
    try {
      const newsResult = await fetchNewsForRepresentative(input.name);
      if (!output.sources || output.sources.length === 0) {
        output.sources = newsResult.sources;
      }
    } catch {}
    return output;
  }
);
