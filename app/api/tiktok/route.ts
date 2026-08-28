import { NextResponse } from 'next/server';

// Your existing YouTube API key
const YOUTUBE_API_KEY = 'AIzaSyCuIFjoCZn9SQApevaGTSi9xujk4WorsUE';

export async function GET() {
  try {
    // Fetch up to 50 trending short videos (under 60 seconds)
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&maxResults=50&key=${YOUTUBE_API_KEY}&regionCode=US&videoDuration=short`
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error('YouTube error:', res.status, errorText);
      return NextResponse.json(
        { error: `YouTube API error: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();

    if (data.items && data.items.length > 0) {
      // Shuffle to randomize order every time
      const shuffled = data.items.sort(() => Math.random() - 0.5);
      const items = shuffled.map((item: any) => ({
        id: `yt_${item.id}`,
        title: item.snippet.title,
        desc: item.snippet.description || '',
        video: `https://www.youtube.com/watch?v=${item.id}`,
        play: `https://www.youtube.com/watch?v=${item.id}`,
        cover: item.snippet.thumbnails.medium.url || '',
      }));
      return NextResponse.json({ data: items });
    } else {
      return NextResponse.json(
        { error: 'No short videos found' },
        { status: 404 }
      );
    }
  } catch (error: any) {
    console.error('YouTube fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch' },
      { status: 500 }
    );
  }
}
