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
    const models = data.data
      .filter((m: any) => 
        !m.id.includes('whisper') && 
        !m.id.includes('embedding') &&
        !m.id.includes('orpheus')
      )
      .map((m: any) => m.id);
    cachedModels = models;
    cacheTime = now;
    return models;
  } catch (e) {
    return ['mixtral-8x7b-32768', 'gemma2-9b-it', 'llama-3.1-8b-instant'];
  }
}

export async function POST(request: Request) {
  const { systemPrompt, userMessage, temperature = 0.7, maxTokens = 250 } = await request.json();

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
          max_tokens: maxTokens,
          temperature: temperature,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        if (errorText.includes('terms acceptance')) {
          console.warn(`Model ${model} requires terms acceptance, skipping`);
          continue;
        }
        throw new Error(`Groq error ${res.status}: ${errorText}`);
      }

      const data = await res.json();
      let reply = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';

      // ✅ Remove any <think>...</think> tags and the word "think" 
      reply = reply.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
      // Also remove any leftover "thinking" text
      reply = reply.replace(/^Thinking:\s*/i, '').replace(/^Here's a thinking process:[\s\S]*?\n/i, '');

      return NextResponse.json({ reply });
    } catch (error: any) {
      console.error(`Model ${model} failed:`, error.message);
      lastError = error;
    }
  }

  return NextResponse.json(
    { error: lastError?.message || 'All models failed.' },
    { status: 500 }
  );
        }
