import type { Representative, PerformanceMetric, Highlight, CountyGDP, CensusData, RankedRepresentative } from '@/types';

export const mockRepresentatives: Representative[] = [
  {
    id: '1',
    slug: 'william-ruto-president',
    name: 'William Ruto',
    photoUrl: 'https://placehold.co/300x300.png',
    position: 'President',
    constituencyOrWard: 'National',
    county: 'National',
    contactInfo: { email: 'president@example.com', twitter: '@WilliamsRuto' },
    party: 'UDA',
    votesGarnered: 7176141,
    participationRecordSummary: 'Attended 95% of cabinet meetings. Championed 5 key legislations.',
    newsSummaryForAI: 'President William Ruto has been in office since 2022. Recent news highlights his economic policies and foreign trips aimed at securing investment. Some reports mention controversy over the Finance Bill 2023, but the government defends it as necessary for revenue generation.'
  },
  {
    id: '2',
    slug: 'rigathi-gachagua-dp',
    name: 'Rigathi Gachagua',
    photoUrl: 'https://placehold.co/300x300.png',
    position: 'Deputy President',
    constituencyOrWard: 'National',
    county: 'National',
    contactInfo: { email: 'dp@example.com', twitter: '@rigathi' },
    party: 'UDA',
    votesGarnered: 7176141,
    participationRecordSummary: 'Chairs key economic committees and coordinates government projects.',
    newsSummaryForAI: 'Deputy President Rigathi Gachagua is known for his vocal stance on national issues. He has been actively involved in agricultural reforms, particularly in the coffee and tea sectors. Some of his public statements have drawn both praise and criticism.'
  },
  {
    id: '3',
    slug: 'jane-smith-governor-nairobi',
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
    id: '4',
    slug: 'ali-omar-mp-kibra',
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
    id: '5',
    slug: 'mary-wambui-mca-karen',
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
  },
  {
    id: '6',
    slug: 'james-mwangi-governor-mombasa',
    name: 'James Mwangi',
    photoUrl: 'https://placehold.co/300x300.png',
    position: 'Governor',
    constituencyOrWard: 'Mombasa County',
    county: 'Mombasa',
    contactInfo: { phone: '0711223344', email: 'governor.mombasa@example.com' },
    party: 'Coastal Front',
    votesGarnered: 250000,
    participationRecordSummary: 'Focused on boosting tourism and improving port efficiency.',
    newsSummaryForAI: 'Governor James Mwangi\'s administration has seen a rise in tourism numbers. He is currently facing challenges with solid waste management and urban housing.'
  },
  {
    id: '7',
    slug: 'susan-kihika-senator-nakuru',
    name: 'Susan Kihika',
    photoUrl: 'https://placehold.co/300x300.png',
    position: 'Senator',
    constituencyOrWard: 'Nakuru County',
    county: 'Nakuru',
    contactInfo: { twitter: '@susankihika' },
    party: 'UDA',
    votesGarnered: 450000,
    participationRecordSummary: 'Active in senate debates on devolution and county funding. Chairs the committee on trade.',
    newsSummaryForAI: 'Senator Susan Kihika is a prominent figure in the senate, often contributing to legislative debates. She has been a strong advocate for increased resource allocation to counties.'
  },
  {
    id: '8',
    slug: 'gladys-wanga-women-rep-homa-bay',
    name: 'Gladys Wanga',
    photoUrl: 'https://placehold.co/300x300.png',
    position: 'Women Rep',
    constituencyOrWard: 'Homa Bay County',
    county: 'Homa Bay',
    contactInfo: { email: 'wr.homabay@example.com' },
    party: 'ODM',
    votesGarnered: 300000,
    participationRecordSummary: 'Championed initiatives for women and youth empowerment, including access to affirmative action funds.',
    newsSummaryForAI: 'Gladys Wanga has been recognized for her work in empowering women economically through various county-level programs. She is a vocal supporter of gender equality legislation.'
  },
  {
    id: '9',
    slug: 'peter-kariuki-mp-thika-town',
    name: 'Peter Kariuki',
    photoUrl: 'https://placehold.co/300x300.png',
    position: 'MP',
    constituencyOrWard: 'Thika Town',
    county: 'Kiambu',
    contactInfo: { officeAddress: 'CDF Office, Thika' },
    party: 'Jubilee',
    votesGarnered: 72000,
    participationRecordSummary: 'High attendance in parliamentary sessions. Focused on improving local school infrastructure.',
    newsSummaryForAI: 'MP Peter Kariuki has allocated a significant portion of the CDF to school renovations and bursaries. He faces pressure from constituents to address traffic congestion in Thika Town.'
  },
  {
    id: '10',
    slug: 'fatuma-dullo-senator-isiolo',
    name: 'Fatuma Dullo',
    photoUrl: 'https://placehold.co/300x300.png',
    position: 'Senator',
    constituencyOrWard: 'Isiolo County',
    county: 'Isiolo',
    contactInfo: { twitter: '@fatuma_dullo' },
    party: 'Jubilee',
    votesGarnered: 25000,
    participationRecordSummary: 'Advocates for pastoralist communities and resource allocation for arid and semi-arid lands (ASAL).',
    newsSummaryForAI: 'Senator Fatuma Dullo is a key voice for Northern Kenya issues, frequently speaking on matters of security, drought, and infrastructure development in the region.'
  },
  {
    id: '11',
    slug: 'abdul-swamad-governor-kisumu',
    name: 'Abdul Swamad',
    photoUrl: 'https://placehold.co/300x300.png',
    position: 'Governor',
    constituencyOrWard: 'Kisumu County',
    county: 'Kisumu',
    contactInfo: { phone: '0722334455', email: 'governor.kisumu@example.com' },
    party: 'ODM',
    votesGarnered: 380000,
    participationRecordSummary: 'Launched the Kisumu Urban Mobility Plan and has been working on revitalizing the lakefront.',
    newsSummaryForAI: 'Governor Abdul Swamad\'s focus has been on urban renewal and trade. His administration is working to modernize city markets, though it has faced some resistance from traders on relocation plans.'
  },
  {
    id: '12',
    slug: 'esther-passaris-women-rep-nairobi',
    name: 'Esther Passaris',
    photoUrl: 'https://placehold.co/300x300.png',
    position: 'Women Rep',
    constituencyOrWard: 'Nairobi County',
    county: 'Nairobi',
    contactInfo: { twitter: '@estherpassaris' },
    party: 'ODM',
    votesGarnered: 650000,
    participationRecordSummary: 'Runs several social programs targeting vulnerable women and girls in Nairobi.',
    newsSummaryForAI: 'Esther Passaris is well-known for her social initiatives. She has faced public scrutiny over the management of the National Government Affirmative Action Fund (NGAAF) in her county, but has consistently defended her record.'
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
  .slice(0, 10) // Use more representatives for the leaderboard
  .map((rep, index) => ({
    ...rep,
    rank: index + 1,
    overallScore: Math.floor(Math.random() * (98 - 75 + 1)) + 75, // Score between 75-98
    performanceScore: Math.floor(Math.random() * (95 - 70 + 1)) + 70,
    integrityScore: Math.floor(Math.random() * (99 - 80 + 1)) + 80, 
  }))
  .sort((a,b) => b.overallScore - a.overallScore)
  .map((rep, index) => ({...rep, rank: index + 1}));

export const getRepresentativeBySlug = async (slug: string): Promise<Representative | undefined> => {
  return mockRepresentatives.find(rep => rep.slug === slug);
}
