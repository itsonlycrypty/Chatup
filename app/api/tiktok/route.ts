import { NextResponse } from 'next/server';

// Your LamaTok key (exact from screenshot)
const LAMATOK_KEY = 's700p889eq193fgj63eqa9u1e76bi';

export async function GET() {
  try {
    const res = await fetch(
      'https://api.lamatok.com/v1/search?q=trending&count=20',
      {
        headers: {
          'x-access-key': LAMATOK_KEY,
          'accept': 'application/json',
        },
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error('LamaTok error:', res.status, errorText);
      return NextResponse.json(
        { error: `LamaTok error: ${res.status} - ${errorText}` },
        { status: res.status }
      );
    }

    const data = await res.json();

    if (data.items && data.items.length > 0) {
      const items = data.items.map((item: any) => ({
        id: `tt_${item.id || Math.random().toString(36)}`,
        title: item.title || item.description || 'TikTok Video',
        desc: item.description || '',
        video: item.video_url || item.url || '',
        play: item.video_url || item.url || '',
        cover: item.cover_url || '',
      }));
      return NextResponse.json({ data: items });
    } else {
      return NextResponse.json(
        { error: 'No trending videos found' },
        { status: 404 }
      );
    }
  } catch (error: any) {
    console.error('LamaTok fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch from LamaTok' },
      { status: 500 }
    );
  }
          }
