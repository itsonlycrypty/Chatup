import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { email, pin } = await request.json();

  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
  }

  // Validate PIN is 4 digits
  if (!pin || !/^\d{4}$/.test(pin)) {
    return NextResponse.json({ error: 'Please enter a valid 4-digit PIN' }, { status: 400 });
  }

  // Get users from Redis
  let users = await kv.get('users') || [];

  // Check if user exists
  let user = users.find((u: any) => u.email === email);

  // If not, create new user with PIN
  if (!user) {
    user = {
      id: Date.now().toString(),
      email,
      pin,
      createdAt: new Date().toISOString(),
    };
    users.push(user);
    await kv.set('users', users);
  } else {
    // Existing user – verify PIN
    if (user.pin !== pin) {
      return NextResponse.json({ error: 'Incorrect PIN' }, { status: 401 });
    }
  }

  // Generate session token
  const sessionToken = Buffer.from(user.id + ':' + Date.now()).toString('base64');
  await kv.set(`session:${sessionToken}`, user.id, { ex: 60 * 60 * 24 * 7 }); // 7 days

  return NextResponse.json({ user, sessionToken });
}

export async function GET(request: Request) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = await kv.get(`session:${token}`);
  if (!userId) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }

  const users = await kv.get('users') || [];
  const user = users.find((u: any) => u.id === userId);
  return NextResponse.json({ user });
}

export async function DELETE(request: Request) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (token) {
    await kv.del(`session:${token}`);
  }
  return NextResponse.json({ success: true });
}
