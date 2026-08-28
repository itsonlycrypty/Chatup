import { NextResponse } from 'next/server';

// Your Groq API key
const GROQ_API_KEY = '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';

export async function POST(request: Request) {
  const { systemPrompt, userMessage } = await request.json();

  if (!systemPrompt || !userMessage) {
    return NextResponse.json(
      { error: 'Missing systemPrompt or userMessage' },
      { status: 400 }
    );
  }

  try {
    // Groq API (OpenAI‑compatible)
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile', // free & powerful
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 250,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Groq API error:', res.status, errorText);
      return NextResponse.json(
        { error: `Groq API error: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('Groq fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get response from Groq' },
      { status: 500 }
    );
  }
  }
