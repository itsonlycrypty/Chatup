import { NextResponse } from 'next/server';

// Helper to fetch with timeout
const fetchWithTimeout = async (url: string, options: any = {}, timeout = 8000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return res;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export async function GET() {
  // Try multiple sources in order
  const sources = [
    {
      name: 'TikWM',
      url: 'https://www.tikwm.com/api/trending',
      parser: (data: any) => data.data || [],
    },
    {
      name: 'TikTokAPI (alternative)',
      url: 'https://api.tiktokapi.com/trending',
      parser: (data: any) => data.data || [],
    },
    {
      name: 'SocialBlade (TikTok)',
      url: 'https://socialblade.com/api/tiktok/trending',
      parser: (data: any) => data.data || [],
    },
  ];

  for (const source of sources) {
    try {
      const res = await fetchWithTimeout(source.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
      }, 6000);
      
      if (res.ok) {
        const data = await res.json();
        const items = source.parser(data);
        if (items && items.length > 0) {
          // Normalize the data
          const normalized = items.map((item: any) => ({
            id: item.id || item.video_id || `tt_${Math.random().toString(36)}`,
            title: item.title || item.desc || item.description || 'TikTok Video',
            desc: item.desc || item.description || '',
            video: item.video || item.play || item.video_url || item.url || '',
            play: item.play || item.video || item.video_url || item.url || '',
            cover: item.cover || item.cover_url || '',
          }));
          return NextResponse.json({ data: normalized });
        }
      }
    } catch (e) {
      console.log(`Source ${source.name} failed:`, e);
      continue;
    }
  }

  // If all sources fail, return a message
  return NextResponse.json({
    error: 'All TikTok sources failed. Please try again later.',
    data: [],
  }, { status: 503 });
    }
