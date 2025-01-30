// app/api/generate/gpt/route.js
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
      headers: {
        'Content-Type': 'application/json',
        // On passe le cookie "token"
        Cookie: `token=${tokenCookie}`,
      },
      body: JSON.stringify({
        userId,
        modelName,         // On envoie "gpt-3.5-turbo-0125"
        promptTokens,
        completionTokens,
        totalTokens,
      }),
    });

    if (!response.ok) {
      console.error('Track usage failed:', response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Track usage error:', error.message);
    return null;
  }
}

export async function handleGPTGeneration(request, data) {
  try {
    // Récupération du token "token"
    const cookieStore = request.cookies.get('token');
    const tokenCookie = cookieStore?.value;

    let userId = null;

    // Vérification du token
    if (tokenCookie) {
      try {
        const decoded = await verify(tokenCookie);
        userId = decoded.userId;
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid authentication token' },
          { status: 401 }
        );
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Récupérer le prompt depuis le body
    const { prompt } = data;
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Définir le modèle (ici GPT 3.5)
    const modelName = "gpt-3.5-turbo-0125";

    // Appel à OpenAI
    const completion = await openai.chat.completions.create({
      model: modelName,
      messages: [{ role: "user", content: prompt }],
    });

    // S'il y a usage, on piste
    if (completion.usage) {
      await trackUsage(
        tokenCookie,
        userId,
        modelName,
        completion.usage.prompt_tokens,
        completion.usage.completion_tokens,
        completion.usage.total_tokens
      );
    }

    return NextResponse.json({
      text: completion.choices[0].message.content,
      usage: completion.usage,
    });

  } catch (error) {
    console.error('OpenAI error:', error.message);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}

export { handleGPTGeneration as POST };