import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // TikWM public trending endpoint – no key required
    const res = await fetch('https://www.tikwm.com/api/trending', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      // 8 second timeout to avoid hanging
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      throw new Error(`TikWM error: ${res.status}`);
    }

    const data = await res.json();

    if (data.data && data.data.length > 0) {
      // Map to our expected format
      const items = data.data.map((item: any) => ({
        id: `tt_${item.id}`,
        title: item.title || item.desc || 'TikTok Video',
        desc: item.desc || '',
        video: item.video || item.play || '',
        play: item.play || item.video || '',
        cover: item.cover || '',
      }));
      return NextResponse.json({ data: items });
    } else {
      return NextResponse.json(
        { error: 'No trending videos found' },
        { status: 404 }
      );
    }
  } catch (error: any) {
    console.error('TikTok fetch error:', error.message);
    // No fallback – return a clear error
    return NextResponse.json(
      { error: 'Failed to fetch TikTok videos. Please refresh.' },
      { status: 500 }
    );
  }
}
