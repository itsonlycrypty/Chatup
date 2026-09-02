import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('pageToken') || '0';

    // TikTok API – adjust URL/headers based on your provider
    const response = await fetch(`https://tiktok-api.p.rapidapi.com/feed?cursor=${cursor}`, {
      headers: {
        'x-rapidapi-key': process.env.NEXT_PUBLIC_TIKTOK_API_KEY!,
        'x-rapidapi-host': 'tiktok-api.p.rapidapi.com', // Replace with your host
      },
    });

    if (!response.ok) {
      console.error('TikTok API error:', response.status);
      return NextResponse.json(
        { error: `TikTok API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (data.data && data.data.length > 0) {
      const items = data.data.map((item: any) => ({
        id: item.id || item.video_id,
        title: item.desc || item.title || '',
        desc: item.desc || '',
        video: item.video_url || item.play || item.video,
        play: item.video_url || item.play || item.video,
        cover: item.cover || item.thumbnail || '',
      }));

      return NextResponse.json({
        data: items,
        nextPageToken: data.cursor || data.next_cursor || null,
      });
    } else {
      return NextResponse.json(
        { error: 'No videos found' },
        { status: 404 }
      );
    }
  } catch (error: any) {
    console.error('TikTok fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch' },
      { status: 500 }
    );
  }
                                                  }
