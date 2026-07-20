import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { ShieldCheck, Scale, Database, FileText, Users, BarChart3, CheckCircle, AlertTriangle, ExternalLink, Info } from 'lucide-react';

export const metadata = {
  title: 'Sources & Methodology - KenyaWatch',
  description: 'Transparent list of all data sources with trust weights (OAG 1.5x, AG 1.5x, Citizen 0.8x, Executive 0.4x). Don\'t trust executive principle – OAG/Judiciary/CoB primary.',
};

interface Source {
  name: string;
  domain: string;
  url: string;
  type: 'Primary Government' | 'Secondary Independent' | 'Secondary Media' | 'User-Generated';
  trustWeight: string; // e.g., "1.5x"
  trustScore: number; // numeric for sorting
  provides: string;
  example: string;
  lastUpdated: string;
  howWeUse: string;
  isGovernmentDirect?: boolean;
}

const sources: Source[] = [
  // Primary Independent Checks on Executive – 1.5x (highest trust) – Don't Trust Executive principle
  {
    name: 'Office of the Auditor General (OAG)',
    domain: 'oagkenya.go.ke',
    url: 'https://www.oagkenya.go.ke/audit-reports/',
    type: 'Primary Government',
    trustWeight: '1.5x',
    trustScore: 1.5,
    provides: 'NG-CDF per constituency (290 reports), County Executive (47), County Assembly (47). Audit opinion, unsupported expenditure, irregular procurement, pending bills, CDF utilization % – Independent Article 229',
    example: 'Westlands NG-CDF 2022-2023: Qualified, unsupported KSh 12M, CDF 67% – Source PDF',
    lastUpdated: '2024-03 (FY 2022-2023 reports)',
    howWeUse: 'PRIMARY for integrity (Adverse = +2 verified) and performance (CDF). Weight 70% OAG + 30% other. Stored in audit_reports/{county-year-type}. Trust 1.5x vs executive 0.4x',
    isGovernmentDirect: true,
  },
  {
    name: 'Controller of Budget (CoB) – Budget vs Actual',
    domain: 'cob.go.ke',
    url: 'https://cob.go.ke/reports/',
    type: 'Primary Government',
    trustWeight: '1.5x',
    trustScore: 1.5,
    provides: 'County Budget Implementation Review Reports (CBIRR) Quarterly – approved budget vs exchequer releases vs actual expenditure vs pending bills vs travel. Independent Article 228 – checks executive spending',
    example: 'Nairobi County Q1 2023-2024: Approved 40B, Actual 28B, Variance 30%, Pending 1.2B – Source PDF CoB',
    lastUpdated: '2024-02 (Q1 2023-2024)',
    howWeUse: 'PRIMARY for executive distrust – Budget (executive claim 0.4x) vs Actual (CoB truth 1.5x). High variance >15% = -5 integrity, pending >1B = -10. Stored in cob_reports/{county-year-quarter}',
    isGovernmentDirect: true,
  },
  {
    name: 'Judiciary – Kenya Law Cases Where Executive Lost',
    domain: 'kenyalaw.org',
    url: 'https://kenyalaw.org/caselaw/',
    type: 'Primary Government',
    trustWeight: '1.5x',
    trustScore: 1.5,
    provides: 'High Court, Court of Appeal, Supreme Court cases where executive action struck down as unconstitutional, ignored assembly summons, etc. Best proof executive not trustworthy',
    example: 'Petition 12 of 2024 – Omtatah vs Governor Sakaja: County Finance Bill declared unconstitutional for lack of public participation – Executive lost',
    lastUpdated: 'Daily via Kenya Law',
    howWeUse: 'PRIMARY for integrity – Each struck down = +1-2 verified scandals, -5 to -10 integrity for executive. Stored in judiciary_checks. Weight 1.5x Judiciary vs 0.4x Executive',
    isGovernmentDirect: true,
  },
  {
    name: 'Office of the Attorney General / State Law Office',
    domain: 'statelaw.go.ke',
    url: 'https://www.statelaw.go.ke/resources/',
    type: 'Primary Government',
    trustWeight: '1.5x',
    trustScore: 1.5,
    provides: 'Bills reviewed before President assent, county bills declared unconstitutional, treaties. Source for billsSponsored, billsAssented, unconstitutionalCount',
    example: 'Kiambu County Alcoholic Drinks Control Bill 2023 – declared unconstitutional for public participation – high integrity penalty for sponsor',
    lastUpdated: '2024-06',
    howWeUse: 'Primary for legislative activity. Weight 1.5x vs user metric 0.8x. Stored in bills/{title-year}. Unconstitutional = +1 verified scandal for sponsor',
    isGovernmentDirect: true,
  },
  {
    name: 'Kenya Law (Bills & Acts)',
    domain: 'kenyalaw.org',
    url: 'https://kenyalaw.org/kl/index.php?id=TitleSearch&category=Bills',
    type: 'Primary Government',
    trustWeight: '1.5x',
    trustScore: 1.5,
    provides: 'Full text of all bills, acts, date assented. Sponsor MP name, status',
    example: 'Finance Bill 2024 – Sponsor: Ndindi Nyoro – Status: Assented 2024-06-26 – PDF',
    lastUpdated: '2024-06-26',
    howWeUse: 'Primary for billsSponsored count (overwrites user metric). Link as sourceUrl in performance_metrics',
    isGovernmentDirect: true,
  },
  {
    name: 'Parliament of Kenya',
    domain: 'parliament.go.ke',
    url: 'https://www.parliament.go.ke/the-national-assembly/hansard',
    type: 'Primary Government',
    trustWeight: '1.5x',
    trustScore: 1.5,
    provides: 'Hansard – attendance records, voting records, debate participation',
    example: 'MP John Doe attendance 85% Q1 2024 from Hansard',
    lastUpdated: 'Daily via Hansard',
    howWeUse: 'Primary for attendance % (weight 1.2x). Scraped or manual CSV. Source for participationRecordSummary',
    isGovernmentDirect: true,
  },
  {
    name: 'Kenya National Bureau of Statistics (KNBS)',
    domain: 'knbs.or.ke',
    url: 'https://www.knbs.or.ke/',
    type: 'Primary Government',
    trustWeight: '1.5x',
    trustScore: 1.5,
    provides: 'County GDP, County GDP per capita, Census 2019 population, household count, density. Only PDFs, no API per FAQ',
    example: 'Nairobi GDP 2,850,000M KSh 2023 – Source: KNBS 2025 Facts and Figures pg 12',
    lastUpdated: '2025-09 (Facts and Figures 2025)',
    howWeUse: 'Primary for county context. Admin CSV upload via /dashboard/admin/gdp with source attribution. Deterministic ID {county-year}',
    isGovernmentDirect: true,
  },
  {
    name: 'IEBC – Votes Garnered',
    domain: 'iebc.or.ke',
    url: 'https://www.iebc.or.ke/',
    type: 'Primary Government',
    trustWeight: '1.5x',
    trustScore: 1.5,
    provides: '2022 General Election results – votes garnered per candidate',
    example: 'William Ruto – 7,176,270 votes – IEBC 2022',
    lastUpdated: '2022-08',
    howWeUse: 'votesGarnered field in representatives doc. No scoring weight but displayed for transparency',
    isGovernmentDirect: true,
  },
  {
    name: 'Kenya Broadcasting Corporation (KBC)',
    domain: 'kbc.co.ke',
    url: 'https://www.kbc.co.ke/',
    type: 'Primary Government',
    trustWeight: '1.4x',
    trustScore: 1.4,
    provides: 'State broadcaster – direct government press releases, State House briefings republished verbatim',
    example: 'State House press release: President launches Homa Bay projects – KBC 2024-03-15',
    lastUpdated: 'Daily',
    howWeUse: 'Primary for government info via media – isGovernmentDirect=true, higher trust than commercial media. Used in news.ts GNews filter',
    isGovernmentDirect: true,
  },
  // Secondary Independent – 1.2x
  {
    name: 'Mzalendo Trust – Eye on Parliament',
    domain: 'mzalendo.com',
    url: 'https://mzalendo.com/',
    type: 'Secondary Independent',
    trustWeight: '1.2x',
    trustScore: 1.2,
    provides: 'MPs performance scorecard, bills tracker, attendance, Pombola platform. More complete than parliament.go.ke (has 349 MPs vs official 173 in 2016 audit)',
    example: 'Mzalendo score: MP X bills sponsored 3, attendance 85%',
    lastUpdated: 'Weekly',
    howWeUse: 'Secondary for legislative + attendance. Weight 1.2x. Source for initial seeding via EveryPolitician archived JSON + scraper',
  },
  {
    name: 'The Elephant',
    domain: 'theelephant.info',
    url: 'https://www.theelephant.info/',
    type: 'Secondary Independent',
    trustWeight: '1.2x',
    trustScore: 1.2,
    provides: 'Investigative long-form, fact-checking, data journalism',
    example: 'The Elephant investigation: CDF misuse in County Y',
    lastUpdated: 'Monthly',
    howWeUse: 'Secondary for integrity – high credibility, requires source URL. Used in factCheck flow',
  },
  // Secondary Media – 0.8x (Citizen, NTV, KTN as requested)
  {
    name: 'Citizen Digital (Royal Media Services)',
    domain: 'citizen.digital',
    url: 'https://citizen.digital/',
    type: 'Secondary Media',
    trustWeight: '0.8x',
    trustScore: 0.8,
    provides: 'Government press releases republished, county development, project launches, political statements. Often first with State House briefings',
    example: 'Citizen: Governor launches KSh 50M water project in Nyali – 2024-03-15',
    lastUpdated: 'Hourly via RSS https://citizen.digital/feed/',
    howWeUse: 'Secondary for highlights (project launches) + integrity cross-check. RSS + GNews. Not primary scoring, but used for SocialHighlightsGenerator. Attribution mandatory',
  },
  {
    name: 'NTV Kenya (Nation Media Group)',
    domain: 'ntvkenya.co.ke',
    url: 'https://ntvkenya.co.ke/',
    type: 'Secondary Media',
    trustWeight: '0.8x',
    trustScore: 0.8,
    provides: 'Parliament coverage, Finance Bill analysis, county assembly proceedings, investigative pieces',
    example: 'NTV: Finance Bill 2024 public participation in Kiambu – 2024-05-20',
    lastUpdated: 'Hourly via Nation RSS https://nation.africa/kenya/rss',
    howWeUse: 'Secondary for highlights + integrity. RSS fallback when GNews fails. Used in news.ts reputable filter',
  },
  {
    name: 'KTN News / Standard Media',
    domain: 'standardmedia.co.ke',
    url: 'https://www.standardmedia.co.ke/',
    type: 'Secondary Media',
    trustWeight: '0.8x',
    trustScore: 0.8,
    provides: 'Auditor General report coverage (often first to break OAG reports), KTN News investigative, county politics',
    example: 'Standard: OAG Report – Kiambu County pending bills KSh 1.2B – 2024-03-20',
    lastUpdated: 'Hourly via RSS https://www.standardmedia.co.ke/rss/headlines.php',
    howWeUse: 'Secondary – often breaks OAG reports, so useful as alert for OAG ingest. Weight 0.8x, but triggers admin to upload primary OAG PDF',
  },
  {
    name: 'The Star Kenya',
    domain: 'the-star.co.ke',
    url: 'https://www.the-star.co.ke/',
    type: 'Secondary Media',
    trustWeight: '0.8x',
    trustScore: 0.8,
    provides: 'County politics, MCA activities (good for ward-level), corruption investigations',
    example: 'Star: MCA Kitisuru accused of bursary misuse – 2024-02-10',
    lastUpdated: 'Hourly via RSS https://www.the-star.co.ke/rss',
    howWeUse: 'Secondary for MCA-first strategy – Star covers ward level better than Nation. Used for integrity cross-check',
  },
  {
    name: 'Capital FM News',
    domain: 'capitalfm.co.ke',
    url: 'https://www.capitalfm.co.ke/news/',
    type: 'Secondary Media',
    trustWeight: '0.7x',
    trustScore: 0.7,
    provides: 'City news – Nairobi, Mombasa – county government briefings',
    example: 'Capital FM: Nairobi County launches BRT – 2024-01-15',
    lastUpdated: 'Hourly via RSS https://www.capitalfm.co.ke/news/feed/',
    howWeUse: 'Secondary low weight, but useful for urban counties',
  },
  {
    name: 'People Daily',
    domain: 'pd.co.ke',
    url: 'https://www.pd.co.ke/',
    type: 'Secondary Media',
    trustWeight: '0.7x',
    trustScore: 0.7,
    provides: 'People Daily newspaper – government tenders, county news',
    example: 'People Daily: Tender irregularities in County X',
    lastUpdated: 'Daily',
    howWeUse: 'Secondary 0.7x, lower credibility than Nation/Citizen but included for coverage',
  },
  // Executive – 0.4x-0.5x – DON'T TRUST PRINCIPLE (lowest)
  {
    name: 'Office of the President / State House',
    domain: 'president.go.ke',
    url: 'https://www.president.go.ke/',
    type: 'Secondary Media' as any,
    trustWeight: '0.4x',
    trustScore: 0.4,
    provides: 'Executive orders, speeches, promises, press releases – direct executive claim, lowest trust, requires independent verification',
    example: 'Executive Order No 1 of 2024 on Cabinet reorganization – claimed lawful, but Supreme Court struck down (Source: Kenya Law)',
    lastUpdated: 'Daily',
    howWeUse: 'LOWEST 0.4x – Never scores alone. Must be verified by OAG (1.5x), CoB (1.5x), Judiciary (1.5x), or citizen photo (1.0x) to count. Broken promise = -10 integrity regardless of verification. Principle: Don\'t trust executive.',
  },
  {
    name: 'County Executive (e.g., Nairobi County, Kiambu County)',
    domain: 'nairobi.go.ke',
    url: 'https://nairobi.go.ke/',
    type: 'Secondary Media' as any,
    trustWeight: '0.4x',
    trustScore: 0.4,
    provides: 'Governor press releases, county executive budget claims, project launch claims – executive self-reporting',
    example: 'Governor Sakaja: "Built 20 markets" – Executive 0.4x – No points until citizen photo or OAG verifies',
    lastUpdated: 'Daily',
    howWeUse: 'LOWEST 0.5x – County executive claim alone = 0. Requires OAG audit (county executive report) or CoB actual or citizen geotagged photo to verify. High variance Budget vs Actual CoB = -5 integrity for Governor',
  },
  {
    name: 'Executive Promises (Internal Tracker)',
    domain: 'kenyawatch.co.ke (internal)',
    url: '/dashboard/admin/promises',
    type: 'Secondary Media' as any,
    trustWeight: '0.4x',
    trustScore: 0.4,
    provides: 'Track promises by President, Governors, MPs – date promised, deadline, status Not Started/In Progress/Completed/Broken, evidence array with verification type',
    example: 'William Ruto: Build 100km Mau Mau roads by 2025 – In Progress 40% – Source president.go.ke – Trust used 0.4x – Needs OAG or photo verification to score',
    lastUpdated: 'Realtime via admin CSV',
    howWeUse: '0.4x executive claim alone = 0 performance. Completed only +5 if verified by OAG 1.5x or citizen photo 1.0x. Broken always -10 integrity. Stored in executive_promises/{who-promise-year}',
  },
  // User-Generated – 0.6-0.8x
  {
    name: 'Community Reviews (User-Generated)',
    domain: 'kenyawatch.co.ke (internal)',
    url: '/representatives/[slug]#community',
    type: 'User-Generated',
    trustWeight: '0.6x',
    trustScore: 0.6,
    provides: 'Citizen ratings 1-5 stars, comments 10-1000 chars. Average rating contributes to overall score',
    example: 'User Jane: "MCA helped fix our road but CDF bursary delayed" – Rating 3/5',
    lastUpdated: 'Realtime',
    howWeUse: 'Weight 0.6x (lowest) to prevent gaming. Normalized to 100, contributes 20% to performance, 10% to overall. Validated via firestore.rules (userId == auth.uid, comment length, createdAt == request.time)',
  },
  {
    name: 'User-Submitted Performance Metrics',
    domain: 'kenyawatch.co.ke (internal)',
    url: '/representatives/[slug]?tab=performance',
    type: 'User-Generated',
    trustWeight: '0.8x',
    trustScore: 0.8,
    provides: 'Citizens propose metrics: "CDF Fund Utilization", "Boreholes drilled", with source',
    example: 'User adds: CDF Utilization 75% Source: Baraza minutes 2024',
    lastUpdated: 'Realtime, pending admin review',
    howWeUse: 'Weight 0.8x vs OAG 1.5x. Writes to performance_metrics pending review, admin approves. Prevents gaming by weighting primary sources higher',
  },
];

const trustGroups = [
  {
    weight: '1.5x',
    label: 'Primary Independent Checks on Executive (Highest Trust) – Don\'t Trust Executive',
    color: 'bg-green-600 text-white',
    description: 'OAG (Auditor General Art 229), CoB (Controller of Budget Art 228), Judiciary (Kenya Law Art 160), AG, Parliament, KNBS – independent institutions that check executive. Public domain, auditable PDFs. Used for scoring with 1.5x weight vs executive 0.4x. Executive claim alone = 0.',
    sources: sources.filter(s => s.trustWeight === '1.5x' || s.trustWeight === '1.4x'),
  },
  {
    weight: '1.2x',
    label: 'Secondary Independent (High Trust)',
    color: 'bg-blue-600 text-white',
    description: 'Mzalendo, The Elephant – non-partisan civic tech, investigative journalism, open methodology. Weight 1.2x.',
    sources: sources.filter(s => s.trustWeight === '1.2x'),
  },
  {
    weight: '0.8x',
    label: 'Secondary Media (Good Trust, Cross-Check)',
    color: 'bg-yellow-600 text-white',
    description: 'Citizen Digital, NTV Kenya, KTN News, Standard, Star – commercial media that republishes government press releases + county development coverage. Weight 0.8x (secondary), requires source URL + date. Used for highlights & integrity cross-check, not primary scoring.',
    sources: sources.filter(s => s.trustWeight === '0.8x'),
  },
  {
    weight: '0.7x',
    label: 'Secondary Media Lower',
    color: 'bg-orange-500 text-white',
    description: 'Capital FM, People Daily – useful for urban counties but lower credibility than Nation/Citizen. Weight 0.7x.',
    sources: sources.filter(s => s.trustWeight === '0.7x'),
  },
  {
    weight: '0.6x',
    label: 'User-Generated (Low to Prevent Gaming)',
    color: 'bg-gray-500 text-white',
    description: 'Community reviews 1-5 stars, user-submitted metrics. Normalized, contributes 20% to performance, 10% to overall. Weight 0.6x to prevent gaming. Validated via rules.',
    sources: sources.filter(s => s.trustWeight === '0.6x'),
  },
  {
    weight: '0.4x',
    label: 'Executive (Lowest Trust) – DON\'T TRUST PRINCIPLE',
    color: 'bg-red-800 text-white',
    description: 'President, State House, County Executive – direct executive claims. LOWEST TRUST 0.4x – never scores alone. Must be verified by OAG 1.5x, CoB 1.5x, Judiciary 1.5x, or citizen photo 1.0x to count. Broken promise = -10 integrity regardless. Executive press release alone = 0 points.',
    sources: sources.filter(s => s.trustWeight === '0.4x'),
  },
];

export default function SourcesPage() {
  return (
    <MainLayout>
      <div className="space-y-10 max-w-6xl mx-auto">
        {/* Header */}
        <header className="text-center py-8 relative overflow-hidden rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
          <div className="absolute top-0 left-0 w-full h-1 kenya-flag-animate" />
          <div className="container mx-auto px-4">
            <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight">Sources & Methodology</h1>
            <p className="mt-4 text-lg opacity-90 max-w-3xl mx-auto">
              Transparent list of <strong>{sources.length} sources</strong> with trust weights. Open-source scoring <strong>v2.1</strong> – no partisan bias, auditable, reproducible.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Badge className="bg-white text-green-700">OAG 1.5x Primary</Badge>
              <Badge className="bg-white text-green-700">AG 1.5x Primary</Badge>
              <Badge className="bg-white text-blue-700">CoB 1.5x Independent</Badge>
              <Badge className="bg-white text-purple-700">Judiciary 1.5x vs Executive</Badge>
              <Badge className="bg-white text-primary">Citizen 0.8x Secondary</Badge>
              <Badge className="bg-white text-primary">NTV 0.8x</Badge>
              <Badge className="bg-white text-primary">KTN 0.8x</Badge>
              <Badge className="bg-red-100 text-red-800 border border-white">Executive 0.4x Don't Trust</Badge>
            </div>
          </div>
        </header>

        {/* Scoring Formula */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Scale className="h-6 w-6 text-primary" /> Scoring Algorithm v2.1 – Open Source, No Bias</CardTitle>
            <CardDescription>Transparent formula – see src/lib/scoring.ts on GitHub. Bias test: UDA/ODM same metrics → same score.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold text-sm">Performance Score (60% of Overall)</h4>
                <code className="text-xs mt-2 block bg-black text-green-400 p-2 rounded">
                  performance = legislative*0.5 + development*0.3 + community*0.2<br/>
                  legislative = log10(bills+1)*40*0.4 + attendance*0.6<br/>
                  development = cdf*0.7 + min(100,projects*10)*0.3<br/>
                  // cdf = OAG 70% (1.5x) + other 30% (0.8x)<br/>
                  // bills = AG count (1.5x primary)
                </code>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold text-sm">Integrity Score (30% of Overall)</h4>
                <code className="text-xs mt-2 block bg-black text-yellow-400 p-2 rounded">
                  integrity = 100 - verified*15 - alleged*5 + cleanYears*2<br/>
                  verified = OAG Adverse/Qualified + AG unconstitutional + verified media scandals<br/>
                  // OAG Adverse = +2 verified<br/>
                  // OAG Qualified = +1 verified<br/>
                  // AG unconstitutional bill = +1 verified
                </code>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold text-sm">Overall Score</h4>
                <code className="text-xs mt-2 block bg-black text-blue-400 p-2 rounded">
                  overall = perf*0.6 + integ*0.3 + community*0.1<br/>
                  community = avg rating 1-5 normalized to 100 (weight 0.6x to prevent gaming)<br/>
                  <br/>
                  Bias test: same metrics, party UDA vs ODM → same score<br/>
                  Version stored in leaderboard_entries.scoringVersion
                </code>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="flex items-center gap-1"><CheckCircle className="h-4 w-4 text-green-600" /> Primary 1.5x = OAG, AG, Parliament, KNBS, IEBC, KBC</span>
              <span className="flex items-center gap-1"><CheckCircle className="h-4 w-4 text-blue-600" /> Secondary Independent 1.2x = Mzalendo, Elephant</span>
              <span className="flex items-center gap-1"><AlertTriangle className="h-4 w-4 text-yellow-600" /> Secondary Media 0.8x = Citizen, NTV, KTN, Standard, Star</span>
              <span className="flex items-center gap-1"><Info className="h-4 w-4 text-gray-500" /> User 0.6-0.8x = reviews, user metrics (lowest to prevent gaming)</span>
            </div>
          </CardContent>
        </Card>

        {/* Trust Groups */}
        {trustGroups.map(group => (
          <Card key={group.weight} className="overflow-hidden">
            <CardHeader className={`${group.color.replace('text-white','')} bg-opacity-90`}>
              <CardTitle className="flex items-center gap-2 text-white">
                <ShieldCheck className="h-6 w-6" /> {group.weight} – {group.label} ({group.sources.length} sources)
              </CardTitle>
              <CardDescription className="text-white opacity-90">{group.description}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3">Source</th>
                      <th className="text-left p-3">Trust Weight</th>
                      <th className="text-left p-3">Provides</th>
                      <th className="text-left p-3">Example & Last Updated</th>
                      <th className="text-left p-3">How We Use</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.sources.map((src) => (
                      <tr key={src.domain} className="border-t hover:bg-muted/30">
                        <td className="p-3">
                          <div className="font-semibold flex items-center gap-1">
                            {src.name}
                            {src.isGovernmentDirect && <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">Gov Direct</Badge>}
                          </div>
                          <div className="text-xs text-muted-foreground">{src.domain}</div>
                          <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                            Visit <ExternalLink className="h-3 w-3" />
                          </a>
                        </td>
                        <td className="p-3"><Badge className={group.color}>{src.trustWeight}</Badge></td>
                        <td className="p-3 max-w-xs">
                          <div className="text-xs">{src.provides}</div>
                        </td>
                        <td className="p-3 max-w-xs">
                          <div className="text-xs italic bg-muted p-2 rounded">{src.example}</div>
                          <div className="text-xs text-muted-foreground mt-1">Updated: {src.lastUpdated}</div>
                        </td>
                        <td className="p-3 max-w-xs text-xs">
                          {src.howWeUse}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Government Info via Media Explanation */}
        <Card className="border-yellow-200 bg-yellow-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5 text-yellow-600" /> Can I Get Government Info via Citizen, NTV, KTN? Yes – Here's How (Your Previous Question)</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            <p><strong>Yes – media houses are proxy for government comms:</strong> Government (State House, Ministries, Counties) briefs Citizen, NTV, KTN, KBC first. They republish press releases verbatim + county development coverage.</p>
            <p><strong>How KenyaWatch uses them:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>GNews API + RSS:</strong> <code>src/lib/news.ts</code> fetches 6 RSS feeds (Citizen, Nation/NTV, Standard/KTN, Star, KBC, Capital FM) in parallel, filters by rep name, deduplicates, sorts by date</li>
              <li><strong>Query:</strong> <code>q = "William Ruto (site:citizen.digital OR site:ntvkenya.co.ke OR site:standardmedia.co.ke)"</code></li>
              <li><strong>Trust:</strong> 0.8x secondary (not primary) – requires source URL + date. Used for SocialHighlightsGenerator (project launches) + integrity cross-check, not primary scoring</li>
              <li><strong>Legal:</strong> Store only title + 1 sentence summary + URL + source + mediaHouse – fair dealing with attribution, not full article</li>
              <li><strong>Government Direct Filter:</strong> <code>getGovernmentInfoViaMedia(query)</code> prioritizes KBC + keywords government/state house/ministry/press release</li>
            </ul>
            <p className="text-xs text-muted-foreground">Primary remains OAG/AG (1.5x). Media secondary 0.8x triggers admin to upload primary PDF from oagkenya.go.ke</p>
          </CardContent>
        </Card>

        {/* Compliance & Legal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Legal & Compliance – Sources</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p><strong>OAG & AG:</strong> Public domain – can republish summary + link to PDF with attribution "Source: Office of the Auditor General, ...". No copyright issue.</p>
            <p><strong>Media (Citizen, NTV, KTN):</strong> Copyrighted – store only title + short summary + URL + source (fair dealing Sec 26 Kenya Copyright Act for reporting with attribution). Never full text. Link back.</p>
            <p><strong>Kenya Law:</strong> Open access – bills are public, can republish with link.</p>
            <p><strong>Data Protection Act 2019:</strong> Integrity reports about real politicians require source URLs, confidence, disclaimer, human review queue (pending_review) – implemented in <code>firestore.rules</code> + admin dashboard.</p>
            <p><strong>Bias:</strong> Scoring has no party weighting – test <code>isBiasFree()</code> ensures UDA/ODM same metrics → same score.</p>
            <p><strong>Partnerships:</strong> Recommend contacting Royal Media (Citizen), Nation Media (NTV), OAG for non-profit syndication free API – Mzalendo has such deal.</p>
          </CardContent>
        </Card>

        {/* CTA */}
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="py-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg">Transparency is our Moat</h3>
              <p className="text-sm opacity-90 mt-1">All formulas open-source in <code>src/lib/scoring.ts</code> v2.1. See methodology, bias tests, audit logs.</p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="secondary"><Link href="/about/methodology">Methodology</Link></Button>
              <Button asChild variant="outline" className="bg-white text-primary"><Link href="https://github.com/Devcode940/studio/blob/master/src/lib/scoring.ts" target="_blank">View Code <ExternalLink className="ml-2 h-4 w-4" /></Link></Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-muted-foreground">
          Last updated: 2026-07-20 • Scoring v2.1 • {sources.length} sources • OAG primary 1.5x weight • AG primary 1.5x • Citizen/NTV/KTN secondary 0.8x • User 0.6x to prevent gaming<br/>
          Built with ❤️ for Kenyan citizens – Transparency • Accountability • Progress • Harambee!
        </div>
      </div>
    </MainLayout>
  );
}
