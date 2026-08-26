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
    throw new Error('No data');
  } catch (error) {
    // Fallback with 6 demo videos (using a free public video)
    const fallback = {
      data: [
        {
          id: 'demo1',
          title: 'Welcome to Chat Up! 🚀',
          desc: 'Your social media app is ready!',
          video: 'https://www.w3schools.com/html/mov_bbb.mp4',
          play: 'https://www.w3schools.com/html/mov_bbb.mp4',
        },
        {
          id: 'demo2',
          title: 'TikTok-style Shorts',
          desc: 'Swipe up for more!',
          video: 'https://www.w3schools.com/html/mov_bbb.mp4',
          play: 'https://www.w3schools.com/html/mov_bbb.mp4',
        },
        {
          id: 'demo3',
          title: 'Connect with friends',
          desc: 'Chat and share moments',
          video: 'https://www.w3schools.com/html/mov_bbb.mp4',
          play: 'https://www.w3schools.com/html/mov_bbb.mp4',
        },
        {
          id: 'demo4',
          title: 'Post your own videos!',
          desc: 'Tap the + button to upload',
          video: 'https://www.w3schools.com/html/mov_bbb.mp4',
          play: 'https://www.w3schools.com/html/mov_bbb.mp4',
        },
        {
          id: 'demo5',
          title: 'Like and comment',
          desc: 'Engage with the community',
          video: 'https://www.w3schools.com/html/mov_bbb.mp4',
          play: 'https://www.w3schools.com/html/mov_bbb.mp4',
        },
        {
          id: 'demo6',
          title: 'Follow other users',
          desc: 'Build your network',
          video: 'https://www.w3schools.com/html/mov_bbb.mp4',
          play: 'https://www.w3schools.com/html/mov_bbb.mp4',
        },
      ],
    };
    return NextResponse.json(fallback);
  }
          }
