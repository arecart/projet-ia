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
        modelName, // On envoie "gpt-3.5-turbo-0125"
        promptTokens,
        completionTokens,
        totalTokens,
      }),
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
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

    // Récupérer le prompt depuis les données passées
    const { prompt } = data;
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Définir le modèle (ici GPT-3.5 Turbo)
    const modelName = "gpt-3.5-turbo-0125";

    // Appel à OpenAI pour générer la réponse
    const completion = await openai.chat.completions.create({
      model: modelName,
      messages: [{ role: "user", content: prompt }],
    });

    // Pister l'usage si OpenAI retourne des informations d'usage
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

    // Retourner le résultat de la génération
    return NextResponse.json({
      text: completion.choices[0].message.content,
      usage: completion.usage,
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}

// Exporte la fonction de génération en tant que méthode POST
export { handleGPTGeneration as POST };
