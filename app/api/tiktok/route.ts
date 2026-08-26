import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Use a community proxy (no key)
    const res = await fetch('https://tiktok-api.vercel.app/api/trending', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!res.ok) throw new Error('Proxy failed');
    const data = await res.json();
    if (data.data && data.data.length > 0) {
      const items = data.data.map((item: any) => ({
        id: item.id || `tt_${Math.random().toString(36)}`,
        title: item.title || item.desc || 'TikTok Video',
        desc: item.desc || '',
        video: item.video_url || item.play || '',
        play: item.play || item.video_url || '',
        cover: item.cover_url || '',
      }));
      return NextResponse.json({ data: items });
    }
    throw new Error('No data');
  } catch (error) {
    // Final fallback: use our demo videos (but with a variety)
    const fallbackItems = [
      { id: 'demo1', title: 'Welcome to Chat Up!', desc: 'Your social media app', video: 'https://www.w3schools.com/html/mov_bbb.mp4' },
      { id: 'demo2', title: 'TikTok-style Shorts', desc: 'Swipe for more', video: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4' },
      { id: 'demo3', title: 'Connect with friends', desc: 'Chat and share', video: 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4' },
      { id: 'demo4', title: 'Post your own videos!', desc: 'Tap + to upload', video: 'https://www.w3schools.com/html/mov_bbb.mp4' },
      { id: 'demo5', title: 'Like and comment', desc: 'Engage with the community', video: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4' },
      { id: 'demo6', title: 'Follow other users', desc: 'Build your network', video: 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4' },
      { id: 'demo7', title: 'Chat Up is awesome!', desc: 'Enjoy the app', video: 'https://www.w3schools.com/html/mov_bbb.mp4' },
      { id: 'demo8', title: 'Shorts are here', desc: 'Watch short videos', video: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4' },
    ];
    return NextResponse.json({ data: fallbackItems });
  }
}
