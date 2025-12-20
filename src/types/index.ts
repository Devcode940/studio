
import { type LucideIcon } from "lucide-react";

export interface Representative {
  id: string;
  slug: string;
  name: string;
  photoUrl: string;
  position: 'President' | 'Deputy President' | 'Governor' | 'Senator' | 'MP' | 'MCA' | 'Women Rep';
  constituencyOrWard: string;
  county: string;
  party: string;
  votesGarnered?: number;
  participationRecordSummary?: string;
  contactInfo: {
    phone?: string;
    email?: string;
    officeAddress?: string;
    twitter?: string;
    facebook?: string;
  };
  // Fields that will come from subcollections
  performanceMetrics?: PerformanceMetric[];
  highlights?: Highlight[];
  integrityReport?: {
    reportSummary: string;
    reportDate: string; // ISO String
    sourceUrls: string[];
  };
  reviews?: Review[];
}

export interface PerformanceMetric {
  id: string;
  name: string;
  value: string | number;
  unit?: string;
  description?: string;
  source?: string;
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

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string; // ISO date string
}

export interface CountyGDP {
  id: string;
  county: string;
  gdpMillionsKsh: number;
  year: number;
  gdpPerCapitaKsh?: number;
}

export interface CensusData {
    id: string;
    county: string;
    totalPopulation: number;
    malePopulation: number;
    femalePopulation: number;
    householdCount: number;
    averageHouseholdSize: number;
    populationDensity: number;
    year: number;
}

export interface User {
  id:string;
  email: string;
  name?: string;
  uid: string; // Add uid
}

export interface RankedRepresentative extends Representative {
  rank: number;
  overallScore: number;
  performanceScore?: number;
  integrityScore?: number;
}


export interface NavItem {
  href: string;
  label: string;
  icon?: LucideIcon;
  protected?: boolean;
}
