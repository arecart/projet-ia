// app/api/generate/mistral/route.js
import { NextResponse } from 'next/server';
import { verify } from '@/utils/jwt';

/**
 * Envoie les informations d'usage de la requête à l'API de tracking.
 *
 * @param {string} tokenCookie - La valeur du cookie token.
 * @param {number} userId - L'identifiant de l'utilisateur.
 * @param {string} modelName - Le nom du modèle utilisé.
 * @param {number} promptTokens - Le nombre de tokens utilisés pour le prompt.
 * @param {number} completionTokens - Le nombre de tokens utilisés pour la réponse.
 * @param {number} totalTokens - Le nombre total de tokens.
 * @returns {Object|null} - La réponse JSON du tracking ou null en cas d'erreur.
 */
async function trackUsage(tokenCookie, userId, modelName, promptTokens, completionTokens, totalTokens) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/track-usage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Passage du cookie "token" pour l'authentification
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
      return null;
    }
    return await response.json();
  } catch (error) {
    return null;
  }
}

/**
 * Gestion de la génération de texte avec le fournisseur Mistral.
 *
 * @param {Request} request - La requête entrante.
 * @param {Object} requestData - Les données de la requête, notamment le prompt et le modèle.
 * @returns {Response} - Une réponse NextResponse avec le texte généré ou une erreur.
 */
export async function handleMistralGeneration(request, requestData) {
  try {
    // Récupération du token depuis les cookies
    const cookieStore = request.cookies.get('token');
    const tokenCookie = cookieStore?.value;
    if (!tokenCookie) {
      return NextResponse.json(
        { error: 'Authentication required (missing token)' },
        { status: 401 }
      );
    }

    const { prompt, model } = requestData;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Vérification et décodage du token pour obtenir l'userId
    let userId;
    try {
      const decoded = await verify(tokenCookie);
      userId = decoded.userId;
    } catch {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Définir l'URL de l'endpoint Mistral
    const endpointUrl = 'https://api.mistral.ai/v1/chat/completions';

    // Préparation du body de la requête vers Mistral
    const requestBody = {
      model: model || 'mistral-small-latest',
      messages: [{ role: 'user', content: prompt }],
    };

    // Appel à l'API Mistral
    const mistralResponse = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!mistralResponse.ok) {
      return NextResponse.json(
        { error: `Mistral endpoint error: ${mistralResponse.status}` },
        { status: 500 }
      );
    }

    // Traitement de la réponse
    const responseData = await mistralResponse.json();
    const text = responseData?.choices?.[0]?.message?.content || '';

    // Récupération des informations d'usage si disponibles
    let promptTokens = 0;
    let completionTokens = 0;
    let totalTokens = 0;
    if (responseData?.usage) {
      promptTokens = responseData.usage.prompt_tokens || 0;
      completionTokens = responseData.usage.completion_tokens || 0;
      totalTokens = responseData.usage.total_tokens || 0;
    }

    // Suivi de l'utilisation
    await trackUsage(tokenCookie, userId, model, promptTokens, completionTokens, totalTokens);

    // Retourner la réponse finale
    return NextResponse.json({
      text,
      usage: responseData?.usage || null,
    });

  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Mistral Error' },
      { status: 500 }
    );
  }
}

export { handleMistralGeneration as POST };
