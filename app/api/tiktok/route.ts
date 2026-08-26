import { NextResponse } from 'next/server';

const LAMATOK_KEY = process.env.NEXT_PUBLIC_LAMATOK_KEY || 'euler_M2M3ZDJmNWU2M2ViYzkwNjQzYmM4OGI5YjhhYWYzYzA5YTAzMGQ2MzdiMDMzMjI0YTNkZTll';

export async function GET() {
  try {
    // Use the search endpoint with a trending query
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
      throw new Error(`LamaTok API error: ${res.status} - ${errorText}`);
    }

    const data = await res.json();

    if (data.items && data.items.length > 0) {
      const items = data.items.map((item: any) => ({
        id: item.id || `tt_${Math.random().toString(36)}`,
        title: item.title || item.description || 'TikTok Video',
        desc: item.description || '',
        video: item.video_url || item.url || '',
        play: item.video_url || item.url || '',
        cover: item.cover_url || '',
      }));
      return NextResponse.json({ data: items });
    } else {
      // If search returns nothing, try the trending endpoint
      const trendingRes = await fetch(
        `https://api.lamatok.com/v1/trending`,
        {
          headers: {
            'Authorization': `Bearer ${LAMATOK_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!trendingRes.ok) {
        const errorText = await trendingRes.text();
        console.error('LamaTok trending error:', trendingRes.status, errorText);
        throw new Error('Both search and trending endpoints failed');
      }
      const trendingData = await trendingRes.json();
      if (trendingData.items && trendingData.items.length > 0) {
        const items = trendingData.items.map((item: any) => ({
          id: item.id || `tt_${Math.random().toString(36)}`,
          title: item.title || item.description || 'TikTok Video',
          desc: item.description || '',
          video: item.video_url || item.url || '',
          play: item.video_url || item.url || '',
          cover: item.cover_url || '',
        }));
        return NextResponse.json({ data: items });
      } else {
        return NextResponse.json(
          { error: 'No videos found from LamaTok' },
          { status: 404 }
        );
      }
    }
  } catch (error: any) {
    console.error('LamaTok fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch from LamaTok' },
      { status: 500 }
    );
  }
        }
