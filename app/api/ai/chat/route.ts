import { NextResponse } from 'next/server';

// Your Grok API key (hardcoded, server‑side only)
const GROK_API_KEY = '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';

export async function POST(request: Request) {
  const { systemPrompt, userMessage } = await request.json();

  if (!systemPrompt || !userMessage) {
    return NextResponse.json(
      { error: 'Missing systemPrompt or userMessage' },
      { status: 400 }
    );
  }

  try {
    // xAI Grok API endpoint (OpenAI‑compatible)
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'grok-1', // or 'grok-1-latest' depending on your plan
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 200,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Grok API error:', res.status, errorText);
      return NextResponse.json(
        { error: `Grok API error: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('Grok fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get response from Grok' },
      { status: 500 }
    );
  }
         }
