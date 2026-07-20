/**
 * X (Twitter) API Integration for KenyaWatch Social Highlights
 * Production: X API v2 Bearer Token
 * Dev: Mock tweets when USE_MOCK_AI_DATA=true
 */

import { logger } from './logger';

const USE_MOCK = process.env.USE_MOCK_AI_DATA === 'true' && process.env.NODE_ENV !== 'production';

export interface Tweet {
  id: string;
  text: string;
  createdAt: string;
  url?: string;
}

async function fetchRealTweets(handle: string): Promise<string> {
  const bearer = process.env.X_BEARER_TOKEN || process.env.TWITTER_BEARER_TOKEN;

  if (!bearer) {
    if (USE_MOCK) {
      logger.warn('[MOCK] No X_BEARER_TOKEN, using mock tweets', { handle });
      return fetchMockTweets(handle);
    }
    throw new Error('X_BEARER_TOKEN not configured. Set X_BEARER_TOKEN or USE_MOCK_AI_DATA=true for dev');
  }

  const cleanHandle = handle.replace('@', '').trim();
  
  logger.info('Fetching real tweets from X API v2', { handle: cleanHandle });

  // Step 1: Get user ID by username
  const userUrl = `https://api.twitter.com/2/users/by/username/${encodeURIComponent(cleanHandle)}`;
  const userRes = await fetch(userUrl, {
    headers: { Authorization: `Bearer ${bearer}` },
    next: { revalidate: 1800 }, // cache 30min
  });

  if (!userRes.ok) {
    const err = await userRes.text();
    logger.error('X API get user failed', err, { handle: cleanHandle });
    throw new Error(`X API user lookup failed: ${userRes.status}`);
  }

  const userData = await userRes.json();
  const userId = userData.data?.id;

  if (!userId) throw new Error(`X user not found for handle ${cleanHandle}`);

  // Step 2: Get recent tweets
  const tweetsUrl = `https://api.twitter.com/2/users/${userId}/tweets?max_results=10&tweet.fields=created_at,public_metrics,entities&exclude=retweets,replies`;
  const tweetsRes = await fetch(tweetsUrl, {
    headers: { Authorization: `Bearer ${bearer}` },
    next: { revalidate: 1800 },
  });

  if (!tweetsRes.ok) {
    const err = await tweetsRes.text();
    logger.error('X API get tweets failed', err, { handle: cleanHandle });
    throw new Error(`X API tweets failed: ${tweetsRes.status}`);
  }

  const tweetsData = await tweetsRes.json();
  const tweets: Tweet[] = (tweetsData.data || []).map((t: any) => ({
    id: t.id,
    text: t.text,
    createdAt: t.created_at,
    url: `https://twitter.com/${cleanHandle}/status/${t.id}`,
  }));

  const joined = tweets.map(t => `${t.text} (Date: ${t.createdAt}, URL: ${t.url})`).join('\n\n---\n\n');

  logger.info('Real tweets fetched', { handle: cleanHandle, count: tweets.length });

  return joined || 'No recent tweets found';
}

async function fetchMockTweets(handle?: string): Promise<string> {
  if (!handle) return 'No social media activity found (no handle provided)';

  logger.warn(`[MOCK] Simulating tweets for ${handle}`, { mock: true });

  await new Promise(r => setTimeout(r, 600));

  const mockTweets = [
    `Just launched the new community library in Webuye! Grateful for support from @CDF_Kenya. #EducationForAll (2024-03-15) https://twitter.com/${handle}/status/1`,
    `Today in Parliament, voted YES on Climate Action Bill. Crucial step for our future. #ClimateAction (2024-02-20) https://twitter.com/${handle}/status/2`,
    `Meeting small-scale farmers in Kimilili to discuss fertilizer subsidies. Your voices matter. (2024-01-10)`,
    `Proud to announce completion of Kamukuywa-Kibwezi road project. Boost trade and connect communities. #Infrastructure (2023-12-05) https://example.com/road-project`,
    `Statement on budget: prioritize healthcare spending. Read: https://example.com/statement (2023-11-20)`,
  ];

  return mockTweets.join('\n\n---\n\n');
}

export async function fetchTweetsForRepresentative(handle?: string): Promise<string> {
  if (!handle) return 'No handle provided';

  if (USE_MOCK) return fetchMockTweets(handle);

  try {
    return await fetchRealTweets(handle);
  } catch (err) {
    logger.error('Failed real tweets, fallback to mock in dev', err, { handle });
    if (process.env.NODE_ENV !== 'production') {
      return fetchMockTweets(handle);
    }
    throw err;
  }
}
