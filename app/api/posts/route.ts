import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

export async function GET() {
  const posts = await kv.get('posts') || [];
  return NextResponse.json(posts);
}

export async function POST(request: Request) {
  const { text, imageURL, userId } = await request.json();
  
  if (!text && !imageURL) {
    return NextResponse.json({ error: 'Text or image required' }, { status: 400 });
  }

  const posts = await kv.get('posts') || [];
  const newPost = {
    id: Date.now().toString(),
    text: text || '',
    imageURL: imageURL || null,
    userId,
    likes: 0,
    timestamp: new Date().toISOString(),
  };
  posts.unshift(newPost);
  await kv.set('posts', posts);
  return NextResponse.json(newPost);
}

export async function PUT(request: Request) {
  const { id, action } = await request.json();
  const posts = await kv.get('posts') || [];
  const postIndex = posts.findIndex((p: any) => p.id === id);
  
  if (postIndex === -1) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }
  
  if (action === 'like') {
    posts[postIndex].likes = (posts[postIndex].likes || 0) + 1;
  }
  
  await kv.set('posts', posts);
  return NextResponse.json(posts[postIndex]);
    }
