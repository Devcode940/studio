'use server';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { collection, writeBatch, doc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { formatISO } from 'date-fns';
import { fetchTweetsForRepresentative } from '@/lib/twitter';
import { logger } from '@/lib/logger';

const USE_MOCK = process.env.USE_MOCK_AI_DATA === 'true' && process.env.NODE_ENV !== 'production';

const HighlightSchema = z.object({
    title: z.string().max(100),
    date: z.string(),
    description: z.string().max(300),
    category: z.enum(['Achievement', 'Significant Vote', 'Important Statement', 'Project Launch']),
    sourceUrl: z.string().url().optional()
});

export const SocialHighlightsInputSchema = z.object({
  representativeId: z.string().min(1),
  representativeName: z.string().min(2),
  twitterHandle: z.string().optional(),
  triggeredByUserId: z.string().optional(),
});
export type SocialHighlightsInput = z.infer<typeof SocialHighlightsInputSchema>;
export const SocialHighlightsOutputSchema = z.object({
  highlightsAdded: z.number(),
  summary: z.string(),
  warning: z.string().optional(),
});
export type SocialHighlightsOutput = z.infer<typeof SocialHighlightsOutputSchema>;

async function checkRateLimit(firestore: any, userId?: string): Promise<void> {
    if (!userId) return;
    const oneHourAgo = Timestamp.fromDate(new Date(Date.now() - 60 * 60 * 1000));
    const q = query(collection(firestore, 'ai_usage'), where('userId', '==', userId), where('type', '==', 'highlights'), where('createdAt', '>', oneHourAgo));
    const snap = await getDocs(q);
    if (snap.size >= 5) throw new Error("Rate limit: max 5 highlight generations per hour");
}

export async function generateSocialHighlights(input: SocialHighlightsInput): Promise<SocialHighlightsOutput> {
  return generateSocialHighlightsFlow(input);
}

const generateSocialHighlightsFlow = ai.defineFlow(
  { name: 'generateSocialHighlightsFlow', inputSchema: SocialHighlightsInputSchema, outputSchema: SocialHighlightsOutputSchema },
  async (input) => {
    const { firestore } = initializeFirebase();
    if (input.triggeredByUserId) await checkRateLimit(firestore, input.triggeredByUserId);
    
    let tweetsText: string;
    try {
      tweetsText = await fetchTweetsForRepresentative(input.twitterHandle);
    } catch (err) {
      logger.error('Tweet fetch failed', err, { handle: input.twitterHandle });
      throw err;
    }

    const llmResponse = await ai.generate({
        prompt: `You are an expert political analyst for KenyaWatch. Identify professional highlights from posts. Neutral tone. Focus verifiable achievements, project launches, significant votes, important statements. Ignore personal content, insults, campaign rhetoric without evidence. If sourceUrl in tweet, preserve it. Analyze posts from ${input.representativeName} (${input.twitterHandle || 'no handle'}):\n${tweetsText}`,
        model: 'googleai/gemini-2.0-flash',
        output: { schema: z.object({ highlights: z.array(HighlightSchema) }) }
    });

    const parsed = llmResponse.output as { highlights: z.infer<typeof HighlightSchema>[] } | undefined;
    const generatedHighlights = parsed?.highlights;

    if (!generatedHighlights || generatedHighlights.length === 0) {
        return { highlightsAdded: 0, summary: 'No highlights generated.' };
    }
    
    const collectionName = USE_MOCK ? 'highlights' : 'highlights_pending_review';
    const batch = writeBatch(firestore);
    const highlightsCollection = collection(firestore, 'representatives', input.representativeId, collectionName);

    generatedHighlights.forEach((h) => {
        const docRef = doc(highlightsCollection);
        const highlightData: any = { ...h, date: formatISO(new Date(h.date)), generatedBy: input.triggeredByUserId || 'system', status: USE_MOCK ? 'published' : 'pending_review' };
        batch.set(docRef, highlightData);
        if (input.triggeredByUserId) {
            const usageRef = doc(collection(firestore, 'ai_usage'));
            batch.set(usageRef, { userId: input.triggeredByUserId, type: 'highlights', representativeId: input.representativeId, createdAt: Timestamp.now() });
        }
    });
    
    await batch.commit();
    logger.info('Highlights generated', { repId: input.representativeId, count: generatedHighlights.length, collection: collectionName });
    return { highlightsAdded: generatedHighlights.length, summary: `Generated ${generatedHighlights.length} -> ${collectionName}`, warning: USE_MOCK ? undefined : 'Queued for admin review' };
  }
);
