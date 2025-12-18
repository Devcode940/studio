
'use server';
/**
 * @fileOverview Flow for generating social media highlights for a representative.
 *
 * - generateSocialHighlights - Simulates fetching social media posts and generates highlights.
 * - SocialHighlightsInput - Input schema for the flow.
 * - SocialHighlightsOutput - Output schema for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { getSdks } from '@/firebase';
import { Highlight } from '@/types';
import { formatISO } from 'date-fns';


const HighlightSchema = z.object({
    title: z.string().describe("A concise, compelling title for the highlight (max 10 words)."),
    date: z.string().describe("The estimated date of the post or event, in YYYY-MM-DD format."),
    description: z.string().describe("A neutral, one-sentence summary of the highlight."),
    category: z.enum(['Achievement', 'Significant Vote', 'Important Statement', 'Project Launch']).describe("The most fitting category for the highlight."),
    sourceUrl: z.string().url().optional().describe("A direct link to a news article or official source, if available from the post.")
});


export const SocialHighlightsInputSchema = z.object({
  representativeId: z.string().describe("The Firestore document ID of the representative."),
  representativeName: z.string().describe("The full name of the representative."),
  twitterHandle: z.string().optional().describe("The representative's X (Twitter) handle, e.g., @username."),
});
export type SocialHighlightsInput = z.infer<typeof SocialHighlightsInputSchema>;

export const SocialHighlightsOutputSchema = z.object({
  highlightsAdded: z.number().describe("The number of new highlight records created."),
  summary: z.string().describe("A brief summary of the operation."),
});
export type SocialHighlightsOutput = z.infer<typeof SocialHighlightsOutputSchema>;


// Mock function to simulate fetching tweets from the X API
async function getSimulatedTweets(twitterHandle?: string): Promise<string> {
    if (!twitterHandle) {
        return "No social media activity found (no handle provided).";
    }
    console.log(`Simulating fetching tweets for: ${twitterHandle}`);
    await new Promise(resolve => setTimeout(resolve, 1200)); // Simulate network delay

    const mockTweets = [
        `Just launched the new community library in Webuye! Grateful for the support from @CDF_Kenya. #EducationForAll`,
        `Today in Parliament, I voted YES on the Climate Action Bill. A crucial step for our future. #ClimateAction`,
        `Meeting with small-scale farmers in Kimilili to discuss fertilizer subsidies. Your voices matter.`,
        `Proud to announce the completion of the Kamukuywa-Kibwezi road project. This will boost trade and connect our communities. #Infrastructure`,
        `Statement on the recent budget: We must prioritize healthcare spending and ensure our hospitals are well-equipped. Read my full statement here: https://example.com/statement`,
    ];
    return mockTweets.join('\n\n---\n\n');
}


export async function generateSocialHighlights(input: SocialHighlightsInput): Promise<SocialHighlightsOutput> {
  return generateSocialHighlightsFlow(input);
}


const generateSocialHighlightsFlow = ai.defineFlow(
  {
    name: 'generateSocialHighlightsFlow',
    inputSchema: SocialHighlightsInputSchema,
    outputSchema: SocialHighlightsOutputSchema,
  },
  async (input) => {
    // Step 1: Simulate fetching social media data.
    const simulatedTweets = await getSimulatedTweets(input.twitterHandle);

    // Step 2: Use an LLM to analyze the text and extract highlights in a structured format.
    const llmResponse = await ai.generate({
        prompt: `You are an expert political analyst. Your task is to identify key professional highlights from a representative's social media posts.
        Analyze the following posts from ${input.representativeName}.
        Extract up to 5 significant highlights. For each highlight, provide a title, date, description, category, and a source URL if mentioned.
        Focus on concrete achievements, policy stances, and significant announcements. Ignore personal content.

        Social Media Posts:
        ${simulatedTweets}`,
        model: 'googleai/gemini-2.0-flash',
        output: {
            schema: z.object({
                highlights: z.array(HighlightSchema),
            })
        }
    });

    const generatedHighlights = llmResponse.output()?.highlights;

    if (!generatedHighlights || generatedHighlights.length === 0) {
        return { highlightsAdded: 0, summary: 'No new highlights were generated from the social media posts.' };
    }
    
    // Step 3: Write the generated highlights to Firestore.
    const { firestore } = getSdks();
    const batch = writeBatch(firestore);
    const highlightsCollection = collection(firestore, 'representatives', input.representativeId, 'highlights');

    generatedHighlights.forEach(highlight => {
        const docRef = doc(highlightsCollection); // Create a new document with a random ID
        const highlightData: Omit<Highlight, 'id'> = {
            ...highlight,
            date: formatISO(new Date(highlight.date)), // Ensure date is in ISO format
        };
        batch.set(docRef, highlightData);
    });
    
    await batch.commit();

    // Step 4: Return a summary of the operation.
    const summary = `Successfully generated and saved ${generatedHighlights.length} new highlights for ${input.representativeName}.`;
    return {
      highlightsAdded: generatedHighlights.length,
      summary: summary,
    };
  }
);
