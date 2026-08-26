import { NextResponse } from 'next/server';

// Your LamaTok API key
const LAMATOK_KEY = 'euler_M2M3ZDJmNWU2M2ViYzkwNjQzYmM4OGI5YjhhYWYzYzA5YTAzMGQ2MzdiMDMzMjI0YTNkZTll';

export async function GET() {
  try {
    // Search for trending videos
    const res = await fetch(
      `https://api.lamatok.com/v1/search?q=trending&count=20`,
      {
        headers: {
          'Authorization': `Bearer ${LAMATOK_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error('LamaTok error:', res.status, errorText);
      return NextResponse.json(
        { error: `LamaTok API error: ${res.status} - ${errorText}` },
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
