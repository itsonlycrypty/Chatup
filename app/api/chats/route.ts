import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get('chatId');
  
  if (!chatId) {
    return NextResponse.json({ error: 'Chat ID required' }, { status: 400 });
  }

  const allChats = await kv.get('chats') || {};
  const messages = allChats[chatId] || [];
  return NextResponse.json(messages);
}

export async function POST(request: Request) {
  const { chatId, senderId, text } = await request.json();

  if (!chatId || !senderId || !text) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const allChats = await kv.get('chats') || {};
  if (!allChats[chatId]) allChats[chatId] = [];

  const newMessage = {
    id: Date.now().toString(),
    senderId,
    text,
    timestamp: new Date().toISOString(),
  };
  
  allChats[chatId].push(newMessage);
  await kv.set('chats', allChats);
  return NextResponse.json(newMessage);
    }
