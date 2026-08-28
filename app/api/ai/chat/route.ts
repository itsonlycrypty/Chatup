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
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile', // ✅ Updated to the latest, supported model
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
      let errorMsg = `Groq error ${res.status}`;
      try {
        const errJson = JSON.parse(errorText);
        if (errJson.error?.message) errorMsg = errJson.error.message;
      } catch (_) {}
      return NextResponse.json({ error: errorMsg }, { status: res.status });
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
