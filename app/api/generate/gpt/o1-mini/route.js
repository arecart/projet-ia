import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import { verify } from '@/utils/jwt';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function trackUsage(tokenCookie, userId, modelName, promptTokens, completionTokens, totalTokens) {
  try {
    const response = await fetch('http://localhost:3000/api/track-usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: `token=${tokenCookie}` },
      body: JSON.stringify({ userId, modelName, promptTokens, completionTokens, totalTokens }),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    return null;
  }
}

export async function handleO1MiniGeneration(request, data) {
  try {
    const cookieStore = request.cookies.get('token');
    const tokenCookie = cookieStore?.value;
    let userId = null;

    if (tokenCookie) {
      const decoded = await verify(tokenCookie);
      userId = decoded.userId;
    }
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { prompt, stream } = data;
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const modelName = "o1-mini-2024-09-12";
    const messages = [{ role: "user", content: prompt }];

    const completion = await openai.chat.completions.create({
      model: modelName,
      messages,
      stream,
    });

    if (stream) {
      const stream = new ReadableStream({
        async start(controller) {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(`data: ${content} \n\n`);
            }
          }
          controller.close();
        },
      });
      return new NextResponse(stream, {
        headers: { 'Content-Type': 'text/event-stream' },
      });
    } else {
      const botText = completion.choices[0].message.content;

      if (completion.usage) {
        await trackUsage(tokenCookie, userId, modelName, completion.usage.prompt_tokens, completion.usage.completion_tokens, completion.usage.total_tokens);
      }
      return NextResponse.json({ text: botText, usage: completion.usage });
    }
  } catch (error) {
    console.error('Error in O1 Mini generation:', error);
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}

export async function POST(request) {
  const data = await request.json();
  return handleO1MiniGeneration(request, data);
}