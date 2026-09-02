import { NextResponse } from 'next/server';

const YOUTUBE_API_KEY = 'AIzaSyCuIFjoCZn9SQApevaGTSi9xujk4WorsUE';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('pageToken') || '0';

    // ----- TikTok (RapidAPI) with your new key -----
    let tiktokSuccess = false;
    let tiktokData = null;

    try {
      // Use the host from your connected API (update this if different)
      const host = 'tiktok-api23.p.rapidapi.com'; // CHANGE THIS to your actual host

      const response = await fetch(
        `https://${host}/api/trending?cursor=${cursor}`,
        {
          headers: {
            'x-rapidapi-key': process.env.NEXT_PUBLIC_TIKTOK_API_KEY || '',
            'x-rapidapi-host': host,
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(8000),
        }
      );

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

    // ----- Fallback to YouTube if TikTok fails -----
    if (!tiktokSuccess || !tiktokData) {
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
      }
    }

    // ----- Return TikTok data if successful -----
    if (tiktokData && tiktokData.data) {
      const items = tiktokData.data.map((item: any) => ({
        id: item.id || item.video_id || `tt_${Math.random()}`,
        title: item.desc || item.title || '',
        desc: item.desc || '',
        video: item.video_url || item.play || item.video || '',
        play: item.video_url || item.play || item.video || '',
        cover: item.cover || item.thumbnail || '',
      }));

      return NextResponse.json({
        data: items,
        nextPageToken: tiktokData.cursor || tiktokData.next_cursor || null,
      });
    }

    return NextResponse.json({ error: 'No videos found' }, { status: 404 });

  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
                                         }
