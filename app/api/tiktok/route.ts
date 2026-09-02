import { NextResponse } from 'next/server';

const YOUTUBE_API_KEY = 'AIzaSyCuIFjoCZn9SQApevaGTSi9xujk4WorsUE';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('pageToken') || '0';

    // Try TikTok first
    let tiktokSuccess = false;
    let tiktokData = null;

    try {
      // TikTok API – adjust URL/headers based on your provider
      const response = await fetch(`https://tiktok-api.p.rapidapi.com/feed?cursor=${cursor}`, {
        headers: {
          'x-rapidapi-key': process.env.NEXT_PUBLIC_TIKTOK_API_KEY || '',
          'x-rapidapi-host': 'tiktok-api.p.rapidapi.com',
        },
        // Add a timeout so it doesn't hang
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.length > 0) {
          tiktokSuccess = true;
          tiktokData = data;
        }
      }
    } catch (err) {
      console.log('TikTok API failed, falling back to YouTube');
    }

    // If TikTok failed or returned empty, fall back to YouTube
    if (!tiktokSuccess || !tiktokData) {
      console.log('Using YouTube fallback for Posts/Shorts');
      
      // Map cursor to YouTube pageToken (simplified)
      const pageToken = cursor !== '0' ? cursor : '';
      const ytUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&maxResults=20&key=${YOUTUBE_API_KEY}&regionCode=US&videoDuration=short${pageToken ? `&pageToken=${pageToken}` : ''}`;
      
      const ytRes = await fetch(ytUrl);
      if (!ytRes.ok) throw new Error('YouTube API error');
      const ytData = await ytRes.json();

      if (ytData.items && ytData.items.length > 0) {
        const items = ytData.items.map((item: any) => ({
          id: `yt_${item.id}`,
          title: item.snippet.title,
          desc: item.snippet.description || '',
          video: `https://www.youtube.com/watch?v=${item.id}`,
          play: `https://www.youtube.com/watch?v=${item.id}`,
          cover: item.snippet.thumbnails.medium.url || '',
        }));

        return NextResponse.json({
          data: items,
          nextPageToken: ytData.nextPageToken || null,
        });
      } else {
        return NextResponse.json(
          { error: 'No videos found' },
          { status: 404 }
        );
      }
    }

    // Return TikTok data if successful
    const items = tiktokData.data.map((item: any) => ({
      id: item.id || item.video_id,
      title: item.desc || item.title || '',
      desc: item.desc || '',
      video: item.video_url || item.play || item.video,
      play: item.video_url || item.play || item.video,
      cover: item.cover || item.thumbnail || '',
    }));

    return NextResponse.json({
      data: items,
      nextPageToken: tiktokData.cursor || tiktokData.next_cursor || null,
    });

  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch' },
      { status: 500 }
    );
  }
    }
