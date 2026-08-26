import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Try TikWM first
    const res = await fetch('https://www.tikwm.com/api/trending', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!res.ok) throw new Error('TikWM failed');
    const data = await res.json();
    if (data.data && data.data.length > 0) {
      return NextResponse.json(data);
    }
    // Fallback to a different public API if needed
    throw new Error('No data');
  } catch (error) {
    // Fallback: use a demo feed if both APIs fail
    const fallback = {
      data: [
        {
          id: 'demo1',
          title: 'Welcome to Chat Up!',
          video: 'https://www.w3schools.com/html/mov_bbb.mp4',
          play: 'https://www.w3schools.com/html/mov_bbb.mp4',
          desc: 'This is a demo video while we fix the API',
        },
        {
          id: 'demo2',
          title: 'TikTok videos will appear here',
          video: 'https://www.w3schools.com/html/mov_bbb.mp4',
          play: 'https://www.w3schools.com/html/mov_bbb.mp4',
          desc: 'Refresh or try again later',
        },
      ],
    };
    return NextResponse.json(fallback);
  }
}
