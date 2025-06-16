// Summarizes verified saga/scandal information from reputable news sources.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IntegrityReportInputSchema = z.object({
  name: z.string().describe('The name of the representative.'),
  newsSummary: z.string().describe('A summary of news articles about the representative pulled from reputable news sources.'),
});

export type IntegrityReportInput = z.infer<typeof IntegrityReportInputSchema>;

const IntegrityReportOutputSchema = z.object({
  integrityReport: z.string().describe('A short summary of any verified sagas/scandals associated with the representative.'),
});

export type IntegrityReportOutput = z.infer<typeof IntegrityReportOutputSchema>;

export async function summarizeIntegrityReport(input: IntegrityReportInput): Promise<IntegrityReportOutput> {
  return summarizeIntegrityReportFlow(input);
}

const summarizeIntegrityReportPrompt = ai.definePrompt({
  name: 'summarizeIntegrityReportPrompt',
  input: {schema: IntegrityReportInputSchema},
  output: {schema: IntegrityReportOutputSchema},
  prompt: `You are an AI assistant that summarizes news articles.

  Given the following information about a representative, summarize any verified sagas or scandals associated with them. Focus on information relevant to the representative's integrity and ethical conduct.

  Representative Name: {{{name}}}
  News Summary: {{{newsSummary}}}
  `,
});

const summarizeIntegrityReportFlow = ai.defineFlow(
  {
    name: 'summarizeIntegrityReportFlow',
    inputSchema: IntegrityReportInputSchema,
    outputSchema: IntegrityReportOutputSchema,
  },
  async input => {
    const {output} = await summarizeIntegrityReportPrompt(input);
    return output!;
  }
);
