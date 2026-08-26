import { NextResponse } from 'next/server';

// Your COMPLETE LamaTok key (as you provided)
const LAMATOK_KEY = 's700p889eq193fgj63eqa9u1e76bivte';

export async function GET() {
  // Try search endpoint first, then trending
  const endpoints = [
    `https://api.lamatok.com/v1/search?q=trending&count=20`,
    `https://api.lamatok.com/v1/trending`,
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        headers: {
          'x-access-key': LAMATOK_KEY,
          'accept': 'application/json',
        },
      });

      if (res.ok) {
        const data = await res.json();
        const items = data.items || data.data || [];
        if (items.length > 0) {
          const normalized = items.map((item: any) => ({
            id: `tt_${item.id || Math.random().toString(36)}`,
            title: item.title || item.description || 'TikTok Video',
            desc: item.description || '',
            video: item.video_url || item.url || '',
            play: item.video_url || item.url || '',
            cover: item.cover_url || '',
          }));
          return NextResponse.json({ data: normalized });
        }
      }
    } catch (e) {
      console.error('Endpoint failed:', e);
      continue;
    }
  }

  // If all fail
  return NextResponse.json(
    { error: 'LamaTok API failed – check your key or try later' },
    { status: 401 }
  );
                      }
