import type { Representative, PerformanceMetric, Highlight, CountyGDP, CensusData, RankedRepresentative } from '@/types';

export const mockRepresentatives: Representative[] = [
  {
    id: '1',
    slug: 'john-doe-president',
    name: 'John Doe',
    photoUrl: 'https://placehold.co/300x300.png',
    position: 'President',
    constituencyOrWard: 'National',
    county: 'National',
    contactInfo: { email: 'president@example.com', twitter: '@PresJohnDoe' },
    party: 'Unity Party',
    votesGarnered: 7000000,
    participationRecordSummary: 'Attended 95% of cabinet meetings. Championed 5 key legislations.',
    newsSummaryForAI: 'President John Doe has been in office for two years. Recent news highlights his infrastructure projects and foreign policy initiatives. Some reports mention controversy over a recent tender award process, but investigations are ongoing.'
  },
  {
    id: '2',
    slug: 'jane-smith-governor',
    name: 'Jane Smith',
    photoUrl: 'https://placehold.co/300x300.png',
    position: 'Governor',
    constituencyOrWard: 'Nairobi County',
    county: 'Nairobi',
    contactInfo: { phone: '0700123456', email: 'governor.nairobi@example.com' },
    party: 'Progress Alliance',
    votesGarnered: 800000,
    participationRecordSummary: 'Initiated 10 county development projects. Average assembly attendance.',
    newsSummaryForAI: 'Governor Jane Smith is lauded for improving healthcare facilities in Nairobi. However, there are ongoing discussions about county budget allocations and some public concerns about waste management contracts.'
  },
  {
    id: '3',
    slug: 'ali-omar-mp',
    name: 'Ali Omar',
    photoUrl: 'https://placehold.co/300x300.png',
    position: 'MP',
    constituencyOrWard: 'Kibra Constituency',
    county: 'Nairobi',
    contactInfo: { officeAddress: 'Parliament Buildings, Nairobi' },
    party: 'People\'s Voice',
    votesGarnered: 55000,
    participationRecordSummary: 'Sponsored 3 bills on youth empowerment. Actively participates in committee debates.',
    newsSummaryForAI: 'MP Ali Omar is known for his vocal stance on youth unemployment. He has consistently advocated for more vocational training centers. No major scandals reported, but some critics question the impact of his sponsored bills.'
  },
  {
    id: '4',
    slug: 'mary-wambui-mca',
    name: 'Mary Wambui',
    photoUrl: 'https://placehold.co/300x300.png',
    position: 'MCA',
    constituencyOrWard: 'Karen Ward',
    county: 'Nairobi',
    contactInfo: { email: 'mca.karen@example.com' },
    party: 'Unity Party',
    votesGarnered: 12000,
    participationRecordSummary: 'Successfully lobbied for ward road repairs. Attends most county assembly sittings.',
    newsSummaryForAI: 'MCA Mary Wambui has focused on local infrastructure like roads and water supply. She has been transparent about ward development funds. Minor local disputes regarding market stall allocations were resolved amicably.'
  }
];

export const mockPerformanceMetrics: PerformanceMetric[] = [
  { id: 'pm1', name: 'Bills Sponsored', value: 5, unit: 'count', description: 'Number of bills actively sponsored by the representative.' },
  { id: 'pm2', name: 'Parliamentary Attendance', value: 85, unit: '%', description: 'Percentage of parliamentary sessions attended.' },
  { id: 'pm3', name: 'Constituency Projects Completed', value: 12, unit: 'count', description: 'Number of development projects completed in the constituency.' },
  { id: 'pm4', name: 'Budget Utilization Rate', value: 92, unit: '%', description: 'Percentage of allocated budget effectively utilized for intended purposes.'}
];

export const mockHighlights: Highlight[] = [
  { id: 'h1', title: 'Launch of Youth Empowerment Program', date: '2023-05-15T00:00:00.000Z', description: 'Successfully launched a program providing skills training and seed funding to 500 youths.', category: 'Achievement' },
  { id: 'h2', title: 'Vote on Environmental Protection Bill', date: '2023-03-20T00:00:00.000Z', description: 'Voted in favor of the new Environmental Protection Bill, strengthening conservation efforts.', category: 'Significant Vote' },
  { id: 'h3', title: 'Statement on Healthcare Access', date: '2023-07-01T00:00:00.000Z', description: 'Delivered a key speech advocating for increased funding for rural healthcare facilities.', category: 'Important Statement' }
];

export const mockCountyGDP: CountyGDP[] = [
  { id: 'gdp1', county: 'Nairobi', gdpMillionsKsh: 2750000, year: 2022, gdpPerCapitaKsh: 620000 },
  { id: 'gdp2', county: 'Mombasa', gdpMillionsKsh: 780000, year: 2022, gdpPerCapitaKsh: 550000 },
  { id: 'gdp3', county: 'Kiambu', gdpMillionsKsh: 650000, year: 2022, gdpPerCapitaKsh: 320000 },
  { id: 'gdp4', county: 'Nakuru', gdpMillionsKsh: 590000, year: 2022, gdpPerCapitaKsh: 280000 },
  { id: 'gdp5', county: 'Kisumu', gdpMillionsKsh: 450000, year: 2022, gdpPerCapitaKsh: 250000 },
];

export const mockCensusData: CensusData[] = [
  { id: 'cd1', county: 'Nairobi', totalPopulation: 4397073, malePopulation: 2192452, femalePopulation: 2204376, intersexPopulation: 245, householdCount: 1506888, averageHouseholdSize: 2.9, populationDensity: 6247, year: 2019 },
  { id: 'cd2', county: 'Mombasa', totalPopulation: 1208333, malePopulation: 610257, femalePopulation: 598046, intersexPopulation: 30, householdCount: 378422, averageHouseholdSize: 3.1, populationDensity: 5495, year: 2019 },
  { id: 'cd3', county: 'Kiambu', totalPopulation: 2417735, malePopulation: 1187146, femalePopulation: 1230454, intersexPopulation: 135, householdCount: 795241, averageHouseholdSize: 3.0, populationDensity: 952, year: 2019 },
  { id: 'cd4', county: 'Nakuru', totalPopulation: 2162202, malePopulation: 1077272, femalePopulation: 1084835, intersexPopulation: 95, householdCount: 616046, averageHouseholdSize: 3.5, populationDensity: 289, year: 2019 },
];

export const mockLeaderboardData: RankedRepresentative[] = mockRepresentatives
  .slice(0, 3) // Take first 3 for example
  .map((rep, index) => ({
    ...rep,
    rank: index + 1,
    overallScore: Math.floor(Math.random() * 50) + 50, // Score between 50-99
    performanceScore: Math.floor(Math.random() * 50) + 50,
    integrityScore: Math.floor(Math.random() * 40) + 60, // Integrity usually higher
  }))
  .sort((a,b) => b.overallScore - a.overallScore)
  .map((rep, index) => ({...rep, rank: index + 1}));

export const getRepresentativeBySlug = async (slug: string): Promise<Representative | undefined> => {
  return mockRepresentatives.find(rep => rep.slug === slug);
}
