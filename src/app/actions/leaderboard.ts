'use server';

import { initializeFirebase } from '@/firebase';
import { collection, getDocs, writeBatch, doc, Timestamp, query, where } from 'firebase/firestore';
import { calculateOverallScore, buildScoringInputFromRep, SCORING_VERSION } from '@/lib/scoring';
import { logger } from '@/lib/logger';

export interface RecomputeResult {
  success: boolean;
  count: number;
  version: string;
  error?: string;
  details?: any[];
}

/**
 * Real Leaderboard Recompute – Production Grade
 * Senior: Pure scoring, batch writes, audit trail, failure handling
 */

export async function recomputeLeaderboardAction(): Promise<RecomputeResult> {
  try {
    logger.info('Starting leaderboard recompute', { version: SCORING_VERSION });

    const { firestore } = initializeFirebase();

    // 1. Fetch all representatives
    const repsSnapshot = await getDocs(collection(firestore, 'representatives'));
    
    if (repsSnapshot.empty) {
      logger.warn('No representatives found for leaderboard recompute');
      return { success: true, count: 0, version: SCORING_VERSION };
    }

    const batch = writeBatch(firestore);
    const scored: any[] = [];

    // 2. For each rep, fetch metrics + reviews aggregate
    for (const repDoc of repsSnapshot.docs) {
      const rep = repDoc.data();
      const repId = repDoc.id;

      try {
        // Fetch performance metrics
        const metricsSnap = await getDocs(collection(firestore, 'representatives', repId, 'performance_metrics'));
        const metrics = metricsSnap.docs.map(d => d.data());

        // Fetch reviews to compute avg rating
        const reviewsSnap = await getDocs(collection(firestore, 'representatives', repId, 'reviews'));
        const reviews = reviewsSnap.docs.map(d => d.data());
        const avgRating = reviews.length > 0 
          ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length 
          : 3; // default neutral

        // Fetch integrity reports to count scandals
        const integritySnap = await getDocs(collection(firestore, 'representatives', repId, 'integrity_reports'));
        const integrityReports = integritySnap.docs.map(d => d.data());
        // Simplified: count reports containing "alleged" vs "verified"
        const verified = integrityReports.filter(r => 
          r.reportSummary?.toLowerCase().includes('verified') || r.confidence === 'high'
        ).length;
        const alleged = integrityReports.length - verified;

        const input = buildScoringInputFromRep(rep, metrics, avgRating, { verified, alleged });
        const scores = calculateOverallScore(input);

        scored.push({
          id: repId,
          slug: rep.slug,
          name: rep.name,
          photoUrl: rep.photoUrl,
          position: rep.position,
          county: rep.county,
          constituencyOrWard: rep.constituencyOrWard,
          party: rep.party,
          ...scores,
          scoringVersion: SCORING_VERSION,
          lastComputed: Timestamp.now(),
          metricsCount: metrics.length,
          reviewsCount: reviews.length,
          verifiedScandals: verified,
          allegedScandals: alleged,
        });

      } catch (repErr) {
        logger.error(`Failed to score rep ${repId}`, repErr, { repId });
        // Continue with other reps, don't fail entire batch
        continue;
      }
    }

    // 3. Sort by overallScore desc, assign rank
    scored.sort((a, b) => b.overallScore - a.overallScore);
    
    const ranked = scored.map((rep, idx) => ({
      ...rep,
      rank: idx + 1,
      previousRank: null, // TODO: fetch previous rank to compute rankChange
      rankChange: 0,
    }));

    // 4. Batch write to leaderboard_entries
    for (const entry of ranked) {
      const docRef = doc(firestore, 'leaderboard_entries', entry.id);
      batch.set(docRef, entry, { merge: true });
    }

    // 5. Write audit log for recompute
    const auditRef = doc(collection(firestore, 'admin_audit'));
    batch.set(auditRef, {
      type: 'leaderboard_recompute',
      version: SCORING_VERSION,
      count: ranked.length,
      timestamp: Timestamp.now(),
      breakdown: {
        avgOverall: ranked.length > 0 ? Math.round(ranked.reduce((s, r) => s + r.overallScore, 0) / ranked.length) : 0,
        topScorer: ranked[0]?.name || null,
      }
    });

    await batch.commit();

    logger.info('Leaderboard recompute completed', { count: ranked.length, version: SCORING_VERSION });

    return {
      success: true,
      count: ranked.length,
      version: SCORING_VERSION,
      details: ranked.slice(0, 5).map(r => ({ name: r.name, score: r.overallScore, rank: r.rank })),
    };

  } catch (error) {
    logger.error('Leaderboard recompute failed', error);
    return {
      success: false,
      count: 0,
      version: SCORING_VERSION,
      error: (error as Error).message,
    };
  }
}

export async function getLeaderboardStatsAction() {
  try {
    const { firestore } = initializeFirebase();
    const snapshot = await getDocs(collection(firestore, 'leaderboard_entries'));
    const entries = snapshot.docs.map(d => d.data());

    const stats = {
      total: entries.length,
      avgScore: entries.length > 0 ? Math.round(entries.reduce((s, e) => s + (e.overallScore || 0), 0) / entries.length) : 0,
      byPosition: {} as Record<string, number>,
      byCounty: {} as Record<string, number>,
      top5: entries.sort((a, b) => (a.rank || 999) - (b.rank || 999)).slice(0, 5),
      lastComputed: entries[0]?.lastComputed || null,
      version: entries[0]?.scoringVersion || SCORING_VERSION,
    };

    // Count by position/county
    for (const e of entries) {
      stats.byPosition[e.position] = (stats.byPosition[e.position] || 0) + 1;
      stats.byCounty[e.county] = (stats.byCounty[e.county] || 0) + 1;
    }

    return { success: true, data: stats };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
