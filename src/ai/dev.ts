import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-integrity-report.ts';
import '@/ai/flows/fact-check-representative.ts';
import '@/ai/flows/fetch-economic-data.ts';
