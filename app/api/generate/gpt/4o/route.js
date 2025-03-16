import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import { verify } from '@/utils/jwt';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const availableFunctions = {
  getWeather: async (args) => {
    const { city } = args;
    return { city, temperature: "25°C", condition: "Sunny" };
  },
};

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

export async function handle4OGeneration(request, data) {
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

    const { prompt, image, stream } = data;
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const modelName = "gpt-4o-2024-08-06";
    const messages = [
      { role: "user", content: prompt },
      ...(image ? [{ role: "user", content: [{ type: "image_url", image_url: { url: image } }] }] : []),
    ];
    const tools = [
      {
        type: "function",
        function: {
          name: "getWeather",
          description: "Get the current weather for a specified city",
          parameters: { type: "object", properties: { city: { type: "string", description: "The city name" } }, required: ["city"] },
        },
      },
    ];

    const completion = await openai.chat.completions.create({
      model: modelName,
      messages,
      tools,
      stream,
    });

    if (stream) {
      const stream = new ReadableStream({
        async start(controller) {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              const lastChar = content[content.length - 1] || '';
              controller.enqueue(`data: ${content}${!/[.!?\s]/.test(lastChar) ? ' ' : ''}\n\n`);
            }
            const toolCall = chunk.choices[0]?.delta?.tool_calls?.[0];
            if (toolCall?.function?.name === "getWeather") {
              const args = JSON.parse(toolCall.function.arguments);
              const result = await availableFunctions.getWeather(args);
              controller.enqueue(`data: \nWeather in ${result.city}: ${result.temperature}, ${result.condition}\n\n`);
            }
          }
          controller.close();
        },
      });
      return new NextResponse(stream, {
        headers: { 'Content-Type': 'text/event-stream; charset=utf-8' },
      });
    } else {
      const choice = completion.choices[0];
      let botText = choice.message.content;

      if (choice.message.tool_calls) {
        const toolCall = choice.message.tool_calls[0];
        if (toolCall.function.name === "getWeather") {
          const args = JSON.parse(toolCall.function.arguments);
          const result = await availableFunctions.getWeather(args);
          botText += `\nWeather in ${result.city}: ${result.temperature}, ${result.condition}`;
        }
      }

      if (completion.usage) {
        await trackUsage(tokenCookie, userId, modelName, completion.usage.prompt_tokens, completion.usage.completion_tokens, completion.usage.total_tokens);
      }
      return NextResponse.json({ text: botText, usage: completion.usage });
    }
  } catch (error) {
    console.error('Error in 4O generation:', error);
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}

export async function POST(request) {
  const data = await request.json();
  return handle4OGeneration(request, data);
}