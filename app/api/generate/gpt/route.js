// app/api/generate/gpt/route.js
import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import { verify } from '@/utils/jwt';

// Initialisation de l'API OpenAI avec la clé
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Mapping des alias vers les noms complets de modèle
const aliasMapping = {
  "gpt-4o": "gpt-4o-2024-08-06",
  "gpt-4o-mini": "gpt-4o-mini-2024-07-18",
  "o1-mini": "o1-mini-2024-09-12",
};

async function trackUsage(tokenCookie, userId, modelName, promptTokens, completionTokens, totalTokens) {
  try {
    //console.debug("trackUsage: Appel à l'endpoint track-usage pour le modèle", modelName);
    const response = await fetch('http://localhost:3000/api/track-usage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Transmission du cookie token
        Cookie: `token=${tokenCookie}`,
      },
      body: JSON.stringify({
        userId,
        modelName,
        promptTokens,
        completionTokens,
        totalTokens,
      }),
    });
    if (!response.ok) {
      //console.error("trackUsage: Erreur lors du tracking, status:", response.status);
      return null;
    }
    return await response.json();
  } catch (error) {
    //console.error("trackUsage: Exception levée", error);
    return null;
  }
}

export async function handleGPTGeneration(request, data) {
  try {
    //console.debug("handleGPTGeneration: Début d'exécution");
    // Récupération du cookie "token"
    const cookieStore = request.cookies.get('token');
    const tokenCookie = cookieStore?.value;
    let userId = null;

    if (tokenCookie) {
      try {
        const decoded = await verify(tokenCookie);
        userId = decoded.userId;
        //console.debug("handleGPTGeneration: Token vérifié pour l'utilisateur", userId);
      } catch (error) {
        //console.error("handleGPTGeneration: Token invalide", error);
        return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
      }
    }
    if (!userId) {
      //console.error("handleGPTGeneration: Authentification requise");
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Récupération du prompt et du modèle passé en paramètre
    const { prompt, model } = data;
    if (!prompt) {
      //console.error("handleGPTGeneration: Le prompt est requis");
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }
    
    // Application du mapping d'alias
    const modelName = aliasMapping[model] || model;
    //console.debug("handleGPTGeneration: Utilisation du modèle", modelName);

    // Appel à l'API OpenAI pour générer la réponse
    const completion = await openai.chat.completions.create({
      model: modelName,
      messages: [{ role: "user", content: prompt }],
    });
    //console.debug("handleGPTGeneration: Réponse OpenAI reçue", completion);

    // Suivi de l'usage si disponible
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
    //console.error("handleGPTGeneration: Exception levée", error);
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}

export { handleGPTGeneration as POST };
