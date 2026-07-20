// Summarizes verified saga/scandal information from reputable news sources.
// SAFETY: Must not hallucinate. Requires source verification.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IntegrityReportInputSchema = z.object({
  name: z.string().min(2).describe('The name of the representative.'),
  newsSummary: z.string().min(10).describe('A summary of news articles about the representative pulled from reputable news sources. MUST include source URLs.'),
  sourceUrls: z.array(z.string().url()).optional().describe('List of reputable source URLs'),
});

export type IntegrityReportInput = z.infer<typeof IntegrityReportInputSchema>;

const IntegrityReportOutputSchema = z.object({
  integrityReport: z.string().describe('Neutral summary with disclaimer. If no verified scandals, state clearly.'),
  confidence: z.enum(['high','medium','low']).describe('Based on source quality'),
  sources: z.array(z.string().url()).optional(),
});

export type IntegrityReportOutput = z.infer<typeof IntegrityReportOutputSchema>;

export async function summarizeIntegrityReport(input: IntegrityReportInput): Promise<IntegrityReportOutput> {
  return summarizeIntegrityReportFlow(input);
}

const summarizeIntegrityReportPrompt = ai.definePrompt({
  name: 'summarizeIntegrityReportPrompt',
  input: {schema: IntegrityReportInputSchema},
  output: {schema: IntegrityReportOutputSchema},
  prompt: `You are a fact-checker for KenyaWatch, NOT a tabloid.

SAFETY RULES:
- ONLY use info from {{{newsSummary}}}. Do NOT invent scandals.
- If newsSummary contains no verified integrity issues from reputable sources, output: "No verified integrity concerns found in reputable sources searched for {{{name}}}."
- If allegation exists, use "Alleged" and cite source URL from {{{sourceUrls}}} if available.
- neutral, non-defamatory language. No emotive adjectives.
- Always add: "This is an AI-generated summary for informational purposes. Verify with original sources."
- Keep under 150 words.

Representative: {{{name}}}
News Summary (with sources):
{{{newsSummary}}}
Source URLs: {{#each sourceUrls}} - {{this}} {{/each}}
`,
});

const summarizeIntegrityReportFlow = ai.defineFlow(
  {
    name: 'summarizeIntegrityReportFlow',
    inputSchema: IntegrityReportInputSchema,
    outputSchema: IntegrityReportOutputSchema,
  },
  async (input): Promise<IntegrityReportOutput> => {
    // Basic validation: reject if no sources in prod
    if (process.env.NODE_ENV === 'production' && (!input.sourceUrls || input.sourceUrls.length === 0)) {
      return {
        integrityReport: `Insufficient verified sources to generate integrity report for ${input.name}. Please provide reputable news URLs. This is an AI-generated placeholder for informational purposes only.`,
        confidence: 'low' as const,
        sources: [],
      };
    }
    const {output} = await summarizeIntegrityReportPrompt(input);
    if (!output) throw new Error('AI produced no output');
    return output as IntegrityReportOutput;
  }
);
