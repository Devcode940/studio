/**
 * Real News API + Kenyan Media Houses Integration for KenyaWatch
 * Production: GNews API + RSS feeds from Citizen, NTV, KTN, Standard, Star, KBC
 * Legal: Only title + 1-sentence summary + URL + source (fair dealing, attribution)
 * 
 * Answers: "Can I get govt info through media houses like Citizen, NTV?"
 * Yes – media houses are proxy for govt comms (State House briefings, county press) but secondary source.
 * Use primary (Hansard, Auditor General) weight 1.5x, media secondary 0.8x.
 */

import { logger } from './logger';

export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  source: string; // e.g., "Citizen Digital", "NTV Kenya"
  publishedAt: string;
  mediaHouse: 'citizen' | 'ntv' | 'ktn' | 'standard' | 'nation' | 'star' | 'kbc' | 'capital' | 'mzalendo' | 'elephant' | 'other';
  isGovernmentDirect?: boolean; // true if from KBC or press release republish
}

export interface NewsFetchResult {
  summary: string;
  sources: string[];
  articles: NewsArticle[];
  meta: {
    gnewsCount: number;
    rssCount: number;
    reputableCount: number;
    query: string;
  };
}

// Expanded reputable list – includes Citizen, NTV, KTN as requested + OAG & AG primary sources
export const REPUTABLE_KENYAN_SOURCES = [
  // Nation Media Group (NTV)
  'nation.africa',
  'ntvkenya.co.ke',
  'ntv.nation.co.ke',
  'daily-nation.com',
  // Royal Media Services (Citizen)
  'citizen.digital',
  'citizentv.co.ke',
  'citizen.radio',
  // Standard Group (KTN)
  'standardmedia.co.ke',
  'ktnnews.com',
  'ktn.co.ke',
  // Radio Africa / Star
  'the-star.co.ke',
  // Government Primary Sources (highest trust)
  'kbc.co.ke',
  'oagkenya.go.ke', // Office of Auditor General – PRIMARY for integrity & CDF
  'statelaw.go.ke', // Office of Attorney General / State Law Office – PRIMARY for bills
  'kenyalaw.org', // Kenya Law – bills, acts
  'parliament.go.ke', // Parliament
  'knbs.or.ke', // KNBS
  // Independent reputable
  'theelephant.info',
  'mzalendo.com',
  'capitalfm.co.ke',
  'pd.co.ke',
];

// RSS Feeds – free, legal, no API key needed (fair use)
export const KENYAN_MEDIA_RSS_FEEDS: { url: string; source: string; mediaHouse: NewsArticle['mediaHouse'] }[] = [
  { url: 'https://citizen.digital/feed/', source: 'Citizen Digital', mediaHouse: 'citizen' },
  { url: 'https://nation.africa/kenya/rss', source: 'Nation Africa', mediaHouse: 'nation' },
  { url: 'https://www.standardmedia.co.ke/rss/headlines.php', source: 'Standard Media', mediaHouse: 'standard' },
  { url: 'https://www.the-star.co.ke/rss', source: 'The Star Kenya', mediaHouse: 'star' },
  { url: 'https://www.kbc.co.ke/feed/', source: 'KBC Kenya', mediaHouse: 'kbc' },
  { url: 'https://www.capitalfm.co.ke/news/feed/', source: 'Capital FM', mediaHouse: 'capital' },
  // NTV doesn't have official RSS, but Nation RSS includes NTV content
];

const USE_MOCK = process.env.USE_MOCK_AI_DATA === 'true' && process.env.NODE_ENV !== 'production';

/**
 * Simple RSS XML parser – no external lib to keep bundle small
 * Parses <item><title><link><description><pubDate>
 */
function parseRSSXml(xmlText: string, sourceInfo: typeof KENYAN_MEDIA_RSS_FEEDS[0]): NewsArticle[] {
  const articles: NewsArticle[] = [];
  
  // Regex to extract items – works for most RSS 2.0
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let itemMatch;
  
  while ((itemMatch = itemRegex.exec(xmlText)) !== null && articles.length < 20) {
    const itemContent = itemMatch[1];
    
    const getTag = (tag: string): string => {
      const regex = new RegExp(`<${tag}(?:[^>]*)>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i');
      const m = itemContent.match(regex);
      if (!m) return '';
      // Decode HTML entities basic
      return m[1].trim().replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/<\!\[CDATA\[|\]\]>/g, '').slice(0, 500);
    };

    const title = getTag('title');
    const link = getTag('link');
    const description = getTag('description');
    const pubDate = getTag('pubDate') || getTag('dc:date') || new Date().toISOString();

    if (!title || !link) continue;

    // Basic cleaning – remove HTML tags from description
    const cleanDesc = description.replace(/<[^>]*>/g, '').trim().slice(0, 300);

    articles.push({
      title: title.slice(0, 200),
      description: cleanDesc,
      url: link,
      source: sourceInfo.source,
      publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      mediaHouse: sourceInfo.mediaHouse,
      isGovernmentDirect: sourceInfo.mediaHouse === 'kbc' || title.toLowerCase().includes('government') || title.toLowerCase().includes('state house'),
    });
  }

  return articles;
}

/**
 * Fetch single RSS feed with timeout and error handling
 */
async function fetchSingleRSS(feed: typeof KENYAN_MEDIA_RSS_FEEDS[0]): Promise<NewsArticle[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

    const res = await fetch(feed.url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'KenyaWatch/2.1 (Civic Tech; +https://kenyawatch.co.ke/bot)',
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
      next: { revalidate: 1800 }, // cache 30min
    });

    clearTimeout(timeout);

    if (!res.ok) {
      logger.warn(`RSS fetch failed for ${feed.source}`, { status: res.status, url: feed.url });
      return [];
    }

    const xmlText = await res.text();
    const parsed = parseRSSXml(xmlText, feed);
    
    logger.info(`RSS fetched`, { source: feed.source, count: parsed.length });
    return parsed;
  } catch (err: any) {
    logger.warn(`RSS fetch error for ${feed.source}`, { error: err.message, url: feed.url });
    return [];
  }
}

/**
 * Fetch all Kenyan media RSS feeds in parallel, filter by query
 */
async function fetchKenyanMediaRSS(query: string): Promise<NewsArticle[]> {
  logger.info('Fetching Kenyan media RSS feeds', { query, feeds: KENYAN_MEDIA_RSS_FEEDS.length });

  // Fetch all feeds concurrently with limit
  const results = await Promise.all(
    KENYAN_MEDIA_RSS_FEEDS.map(feed => fetchSingleRSS(feed))
  );

  const allArticles = results.flat();

  // Filter by query term in title or description (case-insensitive)
  const queryLower = query.toLowerCase();
  const queryTerms = queryLower.split(/\s+/).filter(t => t.length > 2); // ignore short words

  const filtered = allArticles.filter(article => {
    const haystack = `${article.title} ${article.description}`.toLowerCase();
    // Match if at least one term matches (for person names, need at least first or last name)
    return queryTerms.some(term => haystack.includes(term));
  });

  // Deduplicate by URL
  const unique = Array.from(new Map(filtered.map(a => [a.url, a])).values());

  // Sort by published date desc
  unique.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  logger.info('RSS filtered results', { query, totalFetched: allArticles.length, filtered: unique.length });

  return unique.slice(0, 10); // top 10 relevant
}

/**
 * Real GNews fetch with Kenyan media houses filter including Citizen, NTV, KTN
 */
async function fetchGNewsReal(query: string): Promise<NewsFetchResult> {
  const apiKey = process.env.GNEWS_API_KEY || process.env.NEWSAPI_KEY;
  
  if (!apiKey) {
    logger.warn('No GNEWS_API_KEY, trying RSS only', { query });
    // Fallback to RSS only if no API key
    const rssArticles = await fetchKenyanMediaRSS(query);
    if (rssArticles.length > 0) {
      const summary = rssArticles.map(a => `${a.title}: ${a.description} (Source: ${a.url}, ${a.source}, ${a.publishedAt}) [Media: ${a.mediaHouse}]`).join('\n\n');
      return {
        summary,
        sources: rssArticles.map(a => a.url),
        articles: rssArticles,
        meta: { gnewsCount: 0, rssCount: rssArticles.length, reputableCount: rssArticles.length, query },
      };
    }
    if (USE_MOCK) {
      return fetchMockNews(query);
    }
    throw new Error('GNEWS_API_KEY not configured and no RSS results. Set GNEWS_API_KEY or USE_MOCK_AI_DATA=true');
  }

  // Expanded reputable query including Citizen, NTV, KTN
  const reputableQuery = `${query} (site:citizen.digital OR site:nation.africa OR site:ntvkenya.co.ke OR site:standardmedia.co.ke OR site:ktnnews.com OR site:the-star.co.ke OR site:kbc.co.ke OR site:capitalfm.co.ke)`;
  
  logger.info('Fetching real news from GNews with Citizen/NTV/KTN filter', { query });
  
  const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(reputableQuery)}&lang=en&country=ke&max=10&sortby=relevance&token=${apiKey}`;
  
  const res = await fetch(url, { next: { revalidate: 3600 } });
  
  if (!res.ok) {
    const err = await res.text();
    logger.error('GNews API failed', err, { query, status: res.status });
    // Try RSS fallback
    const rssArticles = await fetchKenyanMediaRSS(query);
    if (rssArticles.length > 0) {
      const summary = rssArticles.map(a => `${a.title}: ${a.description} (Source: ${a.url})`).join('\n\n');
      return {
        summary,
        sources: rssArticles.map(a => a.url),
        articles: rssArticles,
        meta: { gnewsCount: 0, rssCount: rssArticles.length, reputableCount: rssArticles.length, query },
      };
    }
    throw new Error(`GNews API error: ${res.status} - ${err}`);
  }

  const data = await res.json();
  
  const gnewsArticles: NewsArticle[] = (data.articles || []).map((a: any) => {
    const hostname = (() => { try { return new URL(a.url).hostname; } catch { return 'unknown'; } })();
    const mediaHouse = detectMediaHouse(hostname, a.source?.name || '');
    
    return {
      title: a.title,
      description: a.description,
      url: a.url,
      source: a.source?.name || hostname,
      publishedAt: a.publishedAt,
      mediaHouse,
      isGovernmentDirect: hostname === 'kbc.co.ke',
    };
  });

  // Also fetch RSS in parallel and merge
  const rssArticles = await fetchKenyanMediaRSS(query).catch(() => [] as NewsArticle[]);
  
  const allArticles = [...gnewsArticles, ...rssArticles];
  
  // Deduplicate by URL
  const uniqueArticles = Array.from(new Map(allArticles.map(a => [a.url, a])).values());
  
  // Sort: reputable first, then by date
  const reputable = uniqueArticles.filter(a => isReputableSource(a.url));
  const finalArticles = (reputable.length >= 3 ? reputable : uniqueArticles).slice(0, 10);

  const summary = finalArticles.map(a => 
    `${a.title}: ${a.description} (Source: ${a.url}, ${a.source} [${a.mediaHouse}], ${a.publishedAt})`
  ).join('\n\n');

  const sources = finalArticles.map(a => a.url);

  logger.info('News fetched with Citizen/NTV/KTN', { 
    query, 
    gnewsCount: gnewsArticles.length, 
    rssCount: rssArticles.length, 
    reputableCount: reputable.length,
    total: finalArticles.length 
  });

  return { 
    summary, 
    sources, 
    articles: finalArticles,
    meta: { gnewsCount: gnewsArticles.length, rssCount: rssArticles.length, reputableCount: reputable.length, query }
  };
}

function detectMediaHouse(hostname: string, sourceName: string): NewsArticle['mediaHouse'] {
  const h = hostname.toLowerCase();
  const s = sourceName.toLowerCase();
  if (h.includes('citizen') || s.includes('citizen')) return 'citizen';
  if (h.includes('ntv') || s.includes('ntv')) return 'ntv';
  if (h.includes('ktn') || h.includes('standardmedia') || s.includes('ktn') || s.includes('standard')) return 'ktn';
  if (h.includes('nation') ) return 'nation';
  if (h.includes('star') ) return 'star';
  if (h.includes('kbc')) return 'kbc';
  if (h.includes('capital')) return 'capital';
  if (h.includes('mzalendo')) return 'mzalendo';
  if (h.includes('elephant')) return 'elephant';
  return 'other';
}

async function fetchMockNews(query: string): Promise<NewsFetchResult> {
  logger.warn(`[MOCK] Fetching mock news for ${query} including Citizen/NTV`, { mock: true });
  
  await new Promise(r => setTimeout(r, 400));
  
  const mockArticles: NewsArticle[] = [
    {
      title: `${query} praised for CDF utilization`,
      description: `Auditor General report shows ${query} achieved 85% CDF absorption for 2023. Report covered by Citizen Digital.`,
      url: `https://citizen.digital/news/${encodeURIComponent(query.toLowerCase().replace(/\s+/g, '-'))}-cdf-85`,
      source: 'Citizen Digital',
      publishedAt: new Date().toISOString(),
      mediaHouse: 'citizen',
      isGovernmentDirect: false,
    },
    {
      title: `${query} launches development project - NTV Kenya`,
      description: `NTV Kenya reports ${query} launched new water project worth KSh 50M in constituency, attended by county officials.`,
      url: `https://ntvkenya.co.ke/news/${encodeURIComponent(query.toLowerCase().replace(/\s+/g, '-'))}-water-project`,
      source: 'NTV Kenya',
      publishedAt: new Date(Date.now() - 86400000).toISOString(),
      mediaHouse: 'ntv',
      isGovernmentDirect: false,
    },
    {
      title: `${query} attendance record - KTN News`,
      description: `Parliament records show ${query} attended 92% of sessions in last quarter, per KTN News parliamentary tracker.`,
      url: `https://www.standardmedia.co.ke/ktnnews/${encodeURIComponent(query.toLowerCase().replace(/\s+/g, '-'))}-attendance`,
      source: 'KTN News',
      publishedAt: new Date(Date.now() - 172800000).toISOString(),
      mediaHouse: 'ktn',
      isGovernmentDirect: false,
    },
  ];

  const summary = mockArticles.map(a => `${a.title}: ${a.description} (Source: ${a.url}, ${a.source} [${a.mediaHouse}], ${a.publishedAt})`).join('\n\n');
  const sources = mockArticles.map(a => a.url);

  return { 
    summary, 
    sources, 
    articles: mockArticles,
    meta: { gnewsCount: 0, rssCount: 0, reputableCount: mockArticles.length, query }
  };
}

export async function fetchNewsForRepresentative(name: string): Promise<NewsFetchResult> {
  const cleanName = name.trim();
  if (cleanName.length < 2) throw new Error('Representative name too short');

  if (USE_MOCK) {
    return fetchMockNews(cleanName);
  }

  try {
    return await fetchGNewsReal(cleanName);
  } catch (err) {
    logger.error('Failed to fetch real news, falling back to RSS', err, { query: cleanName });
    // Try RSS only fallback
    try {
      const rssArticles = await fetchKenyanMediaRSS(cleanName);
      if (rssArticles.length > 0) {
        const summary = rssArticles.map(a => `${a.title}: ${a.description} (Source: ${a.url})`).join('\n\n');
        return {
          summary,
          sources: rssArticles.map(a => a.url),
          articles: rssArticles,
          meta: { gnewsCount: 0, rssCount: rssArticles.length, reputableCount: rssArticles.length, query: cleanName }
        };
      }
    } catch (rssErr) {
      logger.error('RSS fallback also failed', rssErr);
    }

    if (process.env.NODE_ENV !== 'production') {
      return fetchMockNews(cleanName);
    }
    throw err;
  }
}

export function isReputableSource(url: string): boolean {
  return REPUTABLE_KENYAN_SOURCES.some(domain => url.toLowerCase().includes(domain.toLowerCase()));
}

/**
 * Get government information via media houses – main function for user question
 * Returns articles that are likely government press releases republished by media
 */
export async function getGovernmentInfoViaMedia(query: string): Promise<NewsFetchResult> {
  logger.info('Getting government info via media houses', { query });
  
  // For government info, prioritize KBC (state broadcaster) + Citizen (often first with State House) + NTV
  const govQuery = `${query} government OR "state house" OR "county government" OR ministry OR "press release"`;
  
  const result = await fetchNewsForRepresentative(govQuery);
  
  // Filter to likely government direct
  const govArticles = result.articles.filter(a => 
    a.isGovernmentDirect || 
    a.title.toLowerCase().includes('government') ||
    a.title.toLowerCase().includes('state house') ||
    a.title.toLowerCase().includes('ministry') ||
    a.source.toLowerCase().includes('kbc')
  );

  if (govArticles.length > 0) {
    const summary = govArticles.map(a => `${a.title}: ${a.description} (Source: ${a.url} [${a.mediaHouse}])`).join('\n\n');
    return {
      summary,
      sources: govArticles.map(a => a.url),
      articles: govArticles,
      meta: { ...result.meta, query }
    };
  }

  return result;
}

/**
 * Check if Citizen/NTV article is available for a rep – quick check
 */
export async function checkMediaCoverage(name: string): Promise<{ citizen: boolean; ntv: boolean; ktn: boolean; kbc: boolean; total: number }> {
  const result = await fetchNewsForRepresentative(name);
  return {
    citizen: result.articles.some(a => a.mediaHouse === 'citizen'),
    ntv: result.articles.some(a => a.mediaHouse === 'ntv'),
    ktn: result.articles.some(a => a.mediaHouse === 'ktn' || a.mediaHouse === 'standard'),
    kbc: result.articles.some(a => a.mediaHouse === 'kbc'),
    total: result.articles.length,
  };
}
