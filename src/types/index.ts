
export interface Representative {
  id: string;
  slug: string;
  name: string;
  photoUrl: string;
  position: 'President' | 'Deputy President' | 'Governor' | 'Senator' | 'MP' | 'MCA' | 'Women Rep';
  constituencyOrWard: string; // Constituency for MP, Ward for MCA
  county: string; // County they represent or are based in
  contactInfo: {
    phone?: string;
    email?: string;
    officeAddress?: string;
    twitter?: string;
    facebook?: string;
  };
  party: string;
  votesGarnered?: number;
  participationRecordSummary?: string; // Summary of participation (e.g., bills sponsored, attendance)
  newsSummaryForAI?: string; // Pre-compiled news summary for AI processing
}

export interface PerformanceMetric {
  id: string;
  name: string; // e.g., "Bills Sponsored", "Meeting Attendance", "Development Projects Initiated"
  value: string | number;
  unit?: string; // e.g., "%", "count"
  description?: string;
  source?: string; // Where this data comes from
  trend?: 'up' | 'down' | 'stable';
}

export interface Highlight {
  id: string;
  title: string;
  date: string; // ISO date string
  description: string;
  category: 'Achievement' | 'Significant Vote' | 'Important Statement' | 'Project Launch';
  sourceUrl?: string;
}

export interface CountyGDP {
  id: string;
  county: string;
  gdpMillionsKsh: number;
  year: number;
  gdpPerCapitaKsh?: number;
  sectorBreakdown?: { sector: string; percentage: number }[];
}

export interface CensusData {
  id: string;
  county: string;
  totalPopulation: number;
  malePopulation: number;
  femalePopulation: number;
  intersexPopulation: number;
  householdCount: number;
  averageHouseholdSize: number;
  populationDensity: number; // persons per sq km
  year: number;
}

export interface User {
  id:string;
  email: string;
  name?: string;
}

export interface RankedRepresentative extends Representative {
  rank: number;
  overallScore: number;
  performanceScore?: number;
  integrityScore?: number;
  publicSentimentScore?: number; // Example of another metric
}

export interface NavItem {
  href: string;
  label: string;
  icon?: React.ElementType;
  protected?: boolean; // If true, only visible/accessible to logged-in users
}
