/**
 * KenyaWatch Scoring Algorithm v2.1
 * Open-source, auditable, versioned, no partisan bias
 * Senior: Pure functions, fully tested, deterministic
 * 
 * Formula transparency: See /about/methodology
 */

export const SCORING_VERSION = 'v2.1';

export interface ScoringInput {
  attendance: number; // 0-100% from Hansard / Mzalendo
  cdfUtilization: number; // 0-100% from Auditor General
  billsSponsored: number; // count, normalized log scale
  developmentProjects: number; // count verified
  communityRating: number; // 1-5 average from reviews
  verifiedScandals: number; // count with reputable source URL
  allegedScandals: number; // count without strong source
  yearsClean: number; // years without verified scandal
  party?: string; // Used ONLY for bias test, not scoring
}

export interface ScoringOutput {
  performanceScore: number; // 0-100
  integrityScore: number; // 0-100
  overallScore: number; // 0-100
  breakdown: {
    legislative: number;
    development: number;
    community: number;
  };
  version: string;
}

/**
 * Legislative activity: bills + attendance
 * Log scale for bills: 1 bill = 20pts, 5 bills = 28, 20 bills = 52, 100 bills capped at 80
 * Attendance weighted 60%
 */
function calculateLegislative(billsSponsored: number, attendance: number): number {
  const billsScore = Math.min(80, Math.log10(billsSponsored + 1) * 40);
  const attendanceScore = Math.max(0, Math.min(100, attendance));
  return Math.round(billsScore * 0.4 + attendanceScore * 0.6);
}

/**
 * Development: CDF utilization + projects
 * CDF 0-100% weighted 70%, projects log capped
 */
function calculateDevelopment(cdfUtilization: number, developmentProjects: number): number {
  const cdf = Math.max(0, Math.min(100, cdfUtilization));
  const projects = Math.min(100, developmentProjects * 10); // 10 projects = 100
  return Math.round(cdf * 0.7 + projects * 0.3);
}

/**
 * Performance: legislative 50% + development 30% + community 20%
 */
export function calculatePerformanceScore(input: ScoringInput): number {
  const legislative = calculateLegislative(input.billsSponsored, input.attendance);
  const development = calculateDevelopment(input.cdfUtilization, input.developmentProjects);
  const community = Math.round((input.communityRating / 5) * 100);

  const score = legislative * 0.5 + development * 0.3 + community * 0.2;
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Integrity: starts 100, penalizes scandals, rewards clean years
 * Verified: -15 each, Alleged: -5 each, Clean years: +2 each
 */
export function calculateIntegrityScore(input: ScoringInput): number {
  let score = 100;
  score -= input.verifiedScandals * 15;
  score -= input.allegedScandals * 5;
  score += input.yearsClean * 2;
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Overall: performance 60% + integrity 30% + community 10%
 * Integrity high weight to promote accountability, but not 100% to avoid defamation-driven score tanking
 */
export function calculateOverallScore(input: ScoringInput): ScoringOutput {
  const performanceScore = calculatePerformanceScore(input);
  const integrityScore = calculateIntegrityScore(input);
  const communityNorm = Math.round((input.communityRating / 5) * 100);

  const overallScore = Math.round(performanceScore * 0.6 + integrityScore * 0.3 + communityNorm * 0.1);

  return {
    performanceScore,
    integrityScore,
    overallScore,
    breakdown: {
      legislative: calculateLegislative(input.billsSponsored, input.attendance),
      development: calculateDevelopment(input.cdfUtilization, input.developmentProjects),
      community: communityNorm,
    },
    version: SCORING_VERSION,
  };
}

/**
 * Bias test: same metrics different party must produce same score
 */
export function isBiasFree(): boolean {
  const base: ScoringInput = {
    attendance: 80,
    cdfUtilization: 70,
    billsSponsored: 5,
    developmentProjects: 3,
    communityRating: 4,
    verifiedScandals: 0,
    allegedScandals: 0,
    yearsClean: 2,
  };
  const uda = calculateOverallScore({ ...base, party: 'UDA' });
  const odm = calculateOverallScore({ ...base, party: 'ODM' });
  const jubilee = calculateOverallScore({ ...base, party: 'Jubilee' });
  return uda.overallScore === odm.overallScore && odm.overallScore === jubilee.overallScore;
}

/**
 * Helper to build input from Firestore doc + subcollections
 * Now includes OAG primary source (highest weight) for CDF & integrity
 */
export function buildScoringInputFromRep(
  rep: any,
  metrics: any[],
  reviewsAvg: number,
  integrityReportsCount: { verified: number; alleged: number },
  oagReports?: any[], // optional OAG reports for this rep's constituency/county
  bills?: any[] // optional AG bills sponsored
): ScoringInput {
  // Extract metrics by name
  const getMetric = (name: string) => {
    const m = metrics.find((x) => x.name.toLowerCase().includes(name.toLowerCase()));
    if (!m) return 0;
    return typeof m.value === 'number' ? m.value : parseFloat(m.value) || 0;
  };

  // Primary source: OAG for CDF utilization (weight 1.5x vs user metric 0.8x)
  let cdfUtilization = getMetric('cdf') || getMetric('utilization') || 50;
  let oagVerifiedExtra = 0;
  
  if (oagReports && oagReports.length > 0) {
    // Use OAG data if available – it overrides user-submitted
    const oagAvg = oagReports.reduce((sum, r) => sum + (r.cdfUtilization || 0), 0) / oagReports.length;
    if (oagAvg > 0) cdfUtilization = Math.round((cdfUtilization * 0.3 + oagAvg * 0.7)); // 70% OAG, 30% other
    
    // OAG adverse opinions add verified scandals
    for (const r of oagReports) {
      if (r.auditOpinion === 'Adverse') oagVerifiedExtra += 2;
      else if (r.auditOpinion === 'Qualified') oagVerifiedExtra += 1;
      if ((r.unsupportedExpenditure || 0) > 10_000_000) oagVerifiedExtra += 1;
    }
  }

  // Primary source: AG for bills (weight 1.5x)
  let billsSponsored = getMetric('bills') || 0;
  if (bills && bills.length > 0) {
    // AG bills count overrides metric
    billsSponsored = bills.length; // real count from Attorney General / Kenya Law
  }

  return {
    attendance: getMetric('attendance') || 75,
    cdfUtilization,
    billsSponsored,
    developmentProjects: getMetric('project') || 0,
    communityRating: reviewsAvg || 3,
    verifiedScandals: integrityReportsCount.verified + oagVerifiedExtra + (bills?.filter((b:any)=>b.isUnconstitutional).length || 0),
    allegedScandals: integrityReportsCount.alleged,
    yearsClean: integrityReportsCount.verified === 0 && oagVerifiedExtra === 0 ? 2 : 0,
    party: rep.party,
  };
}

/**
 * Build input specifically from OAG reports (primary source) – for audit page
 */
export function buildScoringFromOAGOnly(
  oagReports: any[],
  reviewsAvg: number = 3,
  party?: string
): ScoringInput {
  if (!oagReports.length) {
    return {
      attendance: 75,
      cdfUtilization: 50,
      billsSponsored: 0,
      developmentProjects: 0,
      communityRating: reviewsAvg,
      verifiedScandals: 0,
      allegedScandals: 0,
      yearsClean: 2,
      party,
    };
  }

  const totalUnsupported = oagReports.reduce((sum, r) => sum + (r.unsupportedExpenditure || 0) + (r.irregularProcurement || 0), 0);
  const cdfSum = oagReports.filter(r=>r.cdfUtilization).reduce((sum, r) => sum + r.cdfUtilization, 0);
  const cdfCount = oagReports.filter(r=>r.cdfUtilization).length;
  
  let verified = 0;
  for (const r of oagReports) {
    if (r.auditOpinion === 'Adverse') verified += 2;
    else if (r.auditOpinion === 'Qualified') verified += 1;
  }

  return {
    attendance: 75,
    cdfUtilization: cdfCount > 0 ? Math.round(cdfSum / cdfCount) : 50,
    billsSponsored: 0,
    developmentProjects: 0,
    communityRating: reviewsAvg,
    verifiedScandals: verified,
    allegedScandals: 0,
    yearsClean: verified === 0 ? 2 : 0,
    party,
  };
}
