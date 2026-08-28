import { NextResponse } from 'next/server';

const GROQ_API_KEY = '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';

let cachedModels: string[] | null = null;
let cacheTime = 0;

async function getAvailableModels(): Promise<string[]> {
  const now = Date.now();
  if (cachedModels && now - cacheTime < 5 * 60 * 1000) return cachedModels;

  try {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { 'Authorization': `Bearer ${GROQ_API_KEY}` },
    });
    if (!res.ok) throw new Error('Failed to fetch models');
    const data = await res.json();
    // Exclude whisper, embedding, and any model that might require terms acceptance (e.g., orpheus)
    const models = data.data
      .filter((m: any) => 
        !m.id.includes('whisper') && 
        !m.id.includes('embedding') &&
        !m.id.includes('orpheus') // skip terms‑acceptance models
      )
      .map((m: any) => m.id);
    cachedModels = models;
    cacheTime = now;
    return models;
  } catch (e) {
    console.error('Failed to fetch models, using fallback:', e);
    // Fallback: prefer non‑Llama, then Llama as last resort
    return [
      'mixtral-8x7b-32768',
      'gemma2-9b-it',
      'llama-3.1-8b-instant',
    ];
  }
}

export async function POST(request: Request) {
  const { systemPrompt, userMessage } = await request.json();

  if (!systemPrompt || !userMessage) {
    return NextResponse.json(
      { error: 'Missing systemPrompt or userMessage' },
      { status: 400 }
    );
  }

  const models = await getAvailableModels();
  let lastError: Error | null = null;

  for (const model of models) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model,
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
        // If the error is "terms acceptance", skip to next model
        if (errorText.includes('terms acceptance')) {
          console.warn(`Model ${model} requires terms acceptance, skipping`);
          continue;
        }
        // Otherwise, throw to be caught below
        throw new Error(`Groq error ${res.status}: ${errorText}`);
      }

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
      return NextResponse.json({ reply });
    } catch (error: any) {
      console.error(`Model ${model} failed:`, error.message);
      lastError = error;
      // Continue to next model
    }
  }

  // If all models fail, return the last error
  return NextResponse.json(
    { error: lastError?.message || 'All models failed. Please check your API key or try again later.' },
    { status: 500 }
  );
    }
