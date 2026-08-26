import { NextResponse } from 'next/server';

// Function to generate a random ID
const generateId = () => Math.random().toString(36).substring(2, 10);

// List of different caption messages
const captions = [
  'Welcome to Chat Up! 🚀',
  'Share your moments with friends 💬',
  'Connect and chat instantly 💬',
  'Your social hub is here 🌟',
  'Post photos and videos 📸',
  'Stay connected with Chat Up 📱',
  'Express yourself freely 🎨',
  'Join the community today 🌍',
  'Chat with people around the world 🌏',
  'Your daily dose of entertainment 🎬',
];

// List of different video URLs (public domain)
const videoUrls = [
  'https://www.w3schools.com/html/mov_bbb.mp4',
  'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
  'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
  'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mov-file.mov',
  'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-avi-file.avi',
  'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mkv-file.mkv',
  'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-webm-file.webm',
  'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-ogv-file.ogv',
  'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-3gp-file.3gp',
  'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
];

export async function GET() {
  try {
    // Try real API first (if available)
    const res = await fetch('https://www.tikwm.com/api/trending', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.data && data.data.length > 0) {
        return NextResponse.json(data);
      }
    }
    throw new Error('API failed');
  } catch (error) {
    // Generate 20 unique videos (unlimited feel)
    const items = [];
    const count = 20; // Generate 20 videos
    for (let i = 0; i < count; i++) {
      const captionIndex = i % captions.length;
      const videoIndex = i % videoUrls.length;
      const randomId = generateId();
      items.push({
        id: `demo_${randomId}`,
        title: captions[captionIndex],
        desc: 'From Chat Up',
        video: videoUrls[videoIndex],
        play: videoUrls[videoIndex],
      });
    }
    return NextResponse.json({ data: items });
  }
}
