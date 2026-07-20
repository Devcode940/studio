'use server';

import { initializeFirebase } from '@/firebase';
import { collection, doc, getDoc, getDocs, writeBatch, deleteDoc, setDoc, Timestamp } from 'firebase/firestore';
import { logger } from '@/lib/logger';
import { parseCountyGDPCSV, parseCensusCSV, generateGDPDocId } from '@/lib/knbs';
import { parseOAGCSV, generateOAGDocId, calculateFromOAGReports } from '@/lib/auditor-general';
import { parseBillsCSV, generateBillDocId } from '@/lib/attorney-general';
import { parsePromisesCSV, generatePromiseDocId, calculatePromiseScoringImpact } from '@/lib/executive-promises';
import { parseCoBCSV, generateCoBDocId, calculateCoBScoringImpact } from '@/lib/controller-of-budget';
import { parseJudiciaryCSV, generateJudiciaryDocId, calculateJudiciaryScoringImpact } from '@/lib/judiciary';

export interface AdminActionResult {
  success: boolean;
  message: string;
  count?: number;
  error?: string;
}

/**
 * Approve pending highlight -> move to published highlights
 */
export async function approveHighlightAction(
  representativeId: string,
  pendingHighlightId: string
): Promise<AdminActionResult> {
  try {
    const { firestore } = initializeFirebase();

    const pendingRef = doc(firestore, 'representatives', representativeId, 'highlights_pending_review', pendingHighlightId);
    const pendingSnap = await getDoc(pendingRef);

    if (!pendingSnap.exists()) {
      return { success: false, message: 'Pending highlight not found' };
    }

    const data = pendingSnap.data();
    
    const batch = writeBatch(firestore);
    
    // Move to published highlights
    const publishedRef = doc(collection(firestore, 'representatives', representativeId, 'highlights'));
    batch.set(publishedRef, {
      title: data.title,
      description: data.description,
      date: data.date,
      category: data.category,
      sourceUrl: data.sourceUrl,
      approvedAt: Timestamp.now(),
      approvedBy: 'admin', // TODO: get admin UID from auth context
      originalId: pendingHighlightId,
      generatedBy: data.generatedBy,
    });

    // Delete from pending
    batch.delete(pendingRef);

    // Audit
    const auditRef = doc(collection(firestore, 'admin_audit'));
    batch.set(auditRef, {
      type: 'highlight_approved',
      representativeId,
      pendingHighlightId,
      newHighlightId: publishedRef.id,
      timestamp: Timestamp.now(),
    });

    await batch.commit();

    logger.info('Highlight approved', { representativeId, pendingHighlightId });

    return { success: true, message: 'Highlight approved and published' };
  } catch (error) {
    logger.error('Approve highlight failed', error);
    return { success: false, message: 'Failed to approve', error: (error as Error).message };
  }
}

export async function rejectHighlightAction(
  representativeId: string,
  pendingHighlightId: string,
  reason?: string
): Promise<AdminActionResult> {
  try {
    const { firestore } = initializeFirebase();

    const pendingRef = doc(firestore, 'representatives', representativeId, 'highlights_pending_review', pendingHighlightId);
    
    const batch = writeBatch(firestore);
    batch.delete(pendingRef);

    const auditRef = doc(collection(firestore, 'admin_audit'));
    batch.set(auditRef, {
      type: 'highlight_rejected',
      representativeId,
      pendingHighlightId,
      reason: reason || 'No reason',
      timestamp: Timestamp.now(),
    });

    await batch.commit();

    logger.info('Highlight rejected', { representativeId, pendingHighlightId, reason });

    return { success: true, message: 'Highlight rejected and removed' };
  } catch (error) {
    return { success: false, message: 'Reject failed', error: (error as Error).message };
  }
}

/**
 * Ingest County GDP CSV (admin upload)
 */
export async function ingestCountyGDPCSVAction(csvText: string): Promise<AdminActionResult> {
  try {
    const records = parseCountyGDPCSV(csvText);
    
    const { firestore } = initializeFirebase();
    const batch = writeBatch(firestore);

    for (const record of records) {
      const docId = generateGDPDocId(record.county, record.year);
      const docRef = doc(firestore, 'county_gdp', docId);
      batch.set(docRef, {
        ...record,
        updatedAt: Timestamp.now(),
        updatedBy: 'admin',
      }, { merge: true });
    }

    // Audit
    const auditRef = doc(collection(firestore, 'admin_audit'));
    batch.set(auditRef, {
      type: 'gdp_ingest',
      count: records.length,
      timestamp: Timestamp.now(),
    });

    await batch.commit();

    logger.info('GDP CSV ingested', { count: records.length });

    return { success: true, message: `Successfully ingested ${records.length} GDP records`, count: records.length };
  } catch (error) {
    logger.error('GDP ingest failed', error);
    return { success: false, message: 'Failed to ingest GDP CSV', error: (error as Error).message };
  }
}

export async function ingestCensusCSVAction(csvText: string): Promise<AdminActionResult> {
  try {
    const records = parseCensusCSV(csvText);
    
    const { firestore } = initializeFirebase();
    const batch = writeBatch(firestore);

    for (const record of records) {
      const docId = generateGDPDocId(record.county, record.year); // reuse same ID logic
      const docRef = doc(firestore, 'census_data', docId);
      batch.set(docRef, {
        ...record,
        updatedAt: Timestamp.now(),
        updatedBy: 'admin',
      }, { merge: true });
    }

    const auditRef = doc(collection(firestore, 'admin_audit'));
    batch.set(auditRef, {
      type: 'census_ingest',
      count: records.length,
      timestamp: Timestamp.now(),
    });

    await batch.commit();

    return { success: true, message: `Successfully ingested ${records.length} census records`, count: records.length };
  } catch (error) {
    return { success: false, message: 'Failed to ingest census CSV', error: (error as Error).message };
  }
}

/**
 * Get pending highlights across all reps (admin view)
 */
export async function getPendingHighlightsAction() {
  try {
    const { firestore } = initializeFirebase();
    
    const repsSnap = await getDocs(collection(firestore, 'representatives'));
    const allPending: any[] = [];

    for (const repDoc of repsSnap.docs) {
      const pendingSnap = await getDocs(collection(firestore, 'representatives', repDoc.id, 'highlights_pending_review'));
      for (const pendingDoc of pendingSnap.docs) {
        allPending.push({
          id: pendingDoc.id,
          representativeId: repDoc.id,
          representativeName: repDoc.data().name,
          representativeSlug: repDoc.data().slug,
          ...pendingDoc.data(),
        });
      }
    }

    return { success: true, data: allPending, count: allPending.length };
  } catch (error) {
    return { success: false, error: (error as Error).message, data: [], count: 0 };
  }
}

/**
 * Get admin audit logs
 */
export async function getAuditLogsAction(limit = 50) {
  try {
    const { firestore } = initializeFirebase();
    const auditSnap = await getDocs(collection(firestore, 'admin_audit'));
    const logs = auditSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a: any, b: any) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0))
      .slice(0, limit);

    return { success: true, data: logs };
  } catch (error) {
    return { success: false, error: (error as Error).message, data: [] };
  }
}

/**
 * Ingest OAG Audit Reports CSV (Auditor General – primary source)
 */
export async function ingestOAGCSVAction(csvText: string): Promise<AdminActionResult> {
  try {
    const records = parseOAGCSV(csvText);
    const { firestore } = initializeFirebase();
    const batch = writeBatch(firestore);

    for (const record of records) {
      const docId = generateOAGDocId(record);
      const docRef = doc(firestore, 'audit_reports', docId);
      batch.set(docRef, {
        ...record,
        updatedAt: Timestamp.now(),
        updatedBy: 'admin',
      }, { merge: true });

      // Also create/update performance metric for related rep (CDF utilization + audit opinion)
      // Find rep by constituency match (best effort)
      const repsSnap = await getDocs(collection(firestore, 'representatives'));
      const matchingRep = repsSnap.docs.find(d => {
        const data = d.data();
        return data.constituencyOrWard?.toLowerCase() === record.countyOrConstituency.toLowerCase() ||
               data.county?.toLowerCase() === record.countyOrConstituency.toLowerCase();
      });

      if (matchingRep) {
        const metricRef = doc(collection(firestore, 'representatives', matchingRep.id, 'performance_metrics'));
        batch.set(metricRef, {
          name: `CDF Utilization ${record.year} (OAG)`,
          value: record.cdfUtilization || 0,
          unit: '%',
          description: `From OAG ${record.reportType} audit ${record.year}: ${record.auditOpinion} opinion. Source: ${record.sourceUrl}`,
          source: `OAG ${record.sourceUrl}`,
          trend: record.auditOpinion === 'Unqualified' ? 'up' : record.auditOpinion === 'Adverse' ? 'down' : 'stable',
          verified: true,
          sourceType: 'oag',
          year: record.year,
          createdAt: Timestamp.now(),
        });
      }
    }

    const auditRef = doc(collection(firestore, 'admin_audit'));
    batch.set(auditRef, {
      type: 'oag_ingest',
      count: records.length,
      summary: `Ingested ${records.length} OAG reports with ${records.filter(r=>r.auditOpinion==='Adverse').length} adverse`,
      timestamp: Timestamp.now(),
    });

    await batch.commit();

    logger.info('OAG CSV ingested', { count: records.length });

    return { success: true, message: `Successfully ingested ${records.length} audit reports (OAG primary source)`, count: records.length };
  } catch (error) {
    logger.error('OAG ingest failed', error);
    return { success: false, message: 'Failed to ingest OAG CSV', error: (error as Error).message };
  }
}

/**
 * Ingest AG Bills CSV (Attorney General / Kenya Law – primary source for legislative)
 */
export async function ingestBillsCSVAction(csvText: string): Promise<AdminActionResult> {
  try {
    const records = parseBillsCSV(csvText);
    const { firestore } = initializeFirebase();
    const batch = writeBatch(firestore);

    for (const record of records) {
      const docId = generateBillDocId(record);
      const docRef = doc(firestore, 'bills', docId);
      batch.set(docRef, {
        ...record,
        updatedAt: Timestamp.now(),
        updatedBy: 'admin',
      }, { merge: true });

      // If sponsor slug matches rep, add metric for bills sponsored
      if (record.sponsorSlug) {
        const repsSnap = await getDocs(collection(firestore, 'representatives'));
        const matchingRep = repsSnap.docs.find(d => d.id === record.sponsorSlug || d.data().slug === record.sponsorSlug);
        if (matchingRep) {
          const metricRef = doc(collection(firestore, 'representatives', matchingRep.id, 'performance_metrics'));
          batch.set(metricRef, {
            name: `Bill: ${record.title.slice(0,50)}`,
            value: 1,
            unit: 'bill',
            description: `${record.title} - ${record.status} (${record.year}) Source: ${record.sourceUrl}`,
            source: `AG/KenyaLaw ${record.sourceUrl}`,
            trend: record.status === 'Assented' ? 'up' : record.isUnconstitutional ? 'down' : 'stable',
            verified: true,
            sourceType: 'ag',
            year: record.year,
            createdAt: Timestamp.now(),
          });
        }
      }
    }

    const auditRef = doc(collection(firestore, 'admin_audit'));
    batch.set(auditRef, {
      type: 'bills_ingest',
      count: records.length,
      unconstitutional: records.filter(r=>r.isUnconstitutional).length,
      timestamp: Timestamp.now(),
    });

    await batch.commit();

    return { success: true, message: `Successfully ingested ${records.length} bills (AG primary source)`, count: records.length };
  } catch (error) {
    return { success: false, message: 'Failed to ingest bills CSV', error: (error as Error).message };
  }
}

/**
 * Get AI usage stats (rate limiting audit)
 */
export async function getAIUsageStatsAction() {
  try {
    const { firestore } = initializeFirebase();
    const usageSnap = await getDocs(collection(firestore, 'ai_usage'));
    const usage = usageSnap.docs.map(d => d.data());

    const stats = {
      total: usage.length,
      byType: {} as Record<string, number>,
      byUser: {} as Record<string, number>,
      lastHour: usage.filter((u: any) => {
        const oneHourAgo = Date.now() - 3600000;
        const createdAt = u.createdAt?.seconds ? u.createdAt.seconds * 1000 : 0;
        return createdAt > oneHourAgo;
      }).length,
    };

    for (const u of usage) {
      const type = (u as any).type || 'unknown';
      stats.byType[type] = (stats.byType[type] || 0) + 1;
      const userId = (u as any).userId || 'anonymous';
      stats.byUser[userId] = (stats.byUser[userId] || 0) + 1;
    }

    return { success: true, data: stats };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Ingest Executive Promises CSV – Don't trust executive principle (0.4x weight)
 */
export async function ingestPromisesCSVAction(csvText: string): Promise<AdminActionResult> {
  try {
    const records = parsePromisesCSV(csvText);
    const { firestore } = initializeFirebase();
    const batch = writeBatch(firestore);

    for (const record of records) {
      const docId = generatePromiseDocId(record);
      const docRef = doc(firestore, 'executive_promises', docId);
      const scoring = calculatePromiseScoringImpact(record);
      batch.set(docRef, {
        ...record,
        trustWeightUsed: scoring.trustWeight,
        scoringImpact: { performance: scoring.performance, integrity: scoring.integrity },
        updatedAt: Timestamp.now(),
        updatedBy: 'admin',
      }, { merge: true });
    }

    const auditRef = doc(collection(firestore, 'admin_audit'));
    batch.set(auditRef, {
      type: 'promises_ingest',
      count: records.length,
      broken: records.filter(r=>r.status==='Broken').length,
      timestamp: Timestamp.now(),
    });

    await batch.commit();

    logger.info('Promises CSV ingested', { count: records.length });

    return { success: true, message: `Successfully ingested ${records.length} executive promises (0.4x trust, requires OAG verification)`, count: records.length };
  } catch (error) {
    logger.error('Promises ingest failed', error);
    return { success: false, message: 'Failed to ingest promises CSV', error: (error as Error).message };
  }
}

/**
 * Ingest Controller of Budget CSV – independent Art 228, 1.5x trust vs executive 0.4x
 */
export async function ingestCoBCSVAction(csvText: string): Promise<AdminActionResult> {
  try {
    const records = parseCoBCSV(csvText);
    const { firestore } = initializeFirebase();
    const batch = writeBatch(firestore);

    for (const record of records) {
      const docId = generateCoBDocId(record);
      const docRef = doc(firestore, 'cob_reports', docId);
      const scoringImpact = calculateCoBScoringImpact(record);
      batch.set(docRef, {
        ...record,
        scoringImpact,
        updatedAt: Timestamp.now(),
        updatedBy: 'admin',
      }, { merge: true });
    }

    const auditRef = doc(collection(firestore, 'admin_audit'));
    batch.set(auditRef, {
      type: 'cob_ingest',
      count: records.length,
      highVariance: records.filter(r=> (r.budgetVariance||0) > 15).length,
      timestamp: Timestamp.now(),
    });

    await batch.commit();

    logger.info('CoB CSV ingested', { count: records.length });

    return { success: true, message: `Successfully ingested ${records.length} CoB reports (independent 1.5x vs executive 0.4x)`, count: records.length };
  } catch (error) {
    logger.error('CoB ingest failed', error);
    return { success: false, message: 'Failed to ingest CoB CSV', error: (error as Error).message };
  }
}

/**
 * Ingest Judiciary Checks CSV – Judiciary independent Art 160, 1.5x, executive lost cases
 */
export async function ingestJudiciaryCSVAction(csvText: string): Promise<AdminActionResult> {
  try {
    const records = parseJudiciaryCSV(csvText);
    const { firestore } = initializeFirebase();
    const batch = writeBatch(firestore);

    for (const record of records) {
      const docId = generateJudiciaryDocId(record);
      const docRef = doc(firestore, 'judiciary_checks', docId);
      const scoringImpact = calculateJudiciaryScoringImpact(record);
      batch.set(docRef, {
        ...record,
        scoringImpact,
        updatedAt: Timestamp.now(),
        updatedBy: 'admin',
      }, { merge: true });
    }

    const auditRef = doc(collection(firestore, 'admin_audit'));
    batch.set(auditRef, {
      type: 'judiciary_ingest',
      count: records.length,
      struckDown: records.filter(r=>r.decision==='Executive Action Struck Down').length,
      timestamp: Timestamp.now(),
    });

    await batch.commit();

    logger.info('Judiciary checks ingested', { count: records.length });

    return { success: true, message: `Successfully ingested ${records.length} judiciary checks (executive lost cases, 1.5x primary)`, count: records.length };
  } catch (error) {
    logger.error('Judiciary ingest failed', error);
    return { success: false, message: 'Failed to ingest judiciary CSV', error: (error as Error).message };
  }
}

