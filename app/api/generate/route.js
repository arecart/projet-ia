// app/api/generate/route.js
import { NextResponse } from 'next/server';
import { verify } from '@/utils/jwt';
import pool from '@/app/db';
import { handleMistralGeneration } from './mistral/route';
import { handleGPTGeneration } from './gpt/route';

/**
 * Récupère l'utilisateur connecté depuis le token.
 * On suppose que le token contient au moins { userId, username, ... }.
 */
async function getUserFromRequest(request) {
  const token = request.cookies.get('token')?.value;
  if (!token) {
    console.debug('DEBUG - Aucun token trouvé dans la requête');
    return null;
  }
  try {
    const decoded = await verify(token);
    console.debug('DEBUG - Token décodé:', decoded);
    return decoded;
  } catch (error) {
    console.error('DEBUG - Erreur lors du décodage du token:', error);
    return null;
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { provider, model, prompt, sessionId } = data;
    
    console.debug('DEBUG - Données reçues:', { provider, model, prompt, sessionId });

    if (!sessionId) {
      console.debug('DEBUG - sessionId manquant');
      return NextResponse.json({ error: 'sessionId requis' }, { status: 400 });
    }

    const user = await getUserFromRequest(request);
    if (!user) {
      console.debug('DEBUG - Utilisateur non autorisé');
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    console.debug(`DEBUG - Vérification de la session ${sessionId} pour l'utilisateur ${user.userId}`);
    const [sessions] = await pool.query(
      'SELECT * FROM ChatSession WHERE id = ? AND user_id = ?',
      [sessionId, user.userId]
    );
    console.debug('DEBUG - Résultat de la vérification de session:', sessions);
    if (!sessions || (Array.isArray(sessions) && sessions.length === 0)) {
      console.debug('DEBUG - Session non autorisée ou introuvable');
      return NextResponse.json({ error: 'Session non autorisée ou introuvable' }, { status: 403 });
    }

    console.debug(`DEBUG - Récupération de l'historique pour la session ${sessionId}`);
    const [messages] = await pool.query(
      'SELECT * FROM ChatMessage WHERE session_id = ? ORDER BY timestamp ASC',
      [sessionId]
    );
    console.debug('DEBUG - Historique brut des messages:', messages);

    const conversationHistory = Array.isArray(messages)
      ? messages.map(m => `${m.role}: ${m.message}`).join('\n')
      : '';
    console.debug('DEBUG - Historique formaté:', conversationHistory);

    const fullPrompt = conversationHistory
      ? `${conversationHistory}\nUser: ${prompt}`
      : prompt;
    console.debug('DEBUG - Prompt complet envoyé:', fullPrompt);

    let response;
    if (provider === 'mistral') {
      console.debug('DEBUG - Redirection vers le gestionnaire Mistral avec modèle:', model);
      response = await handleMistralGeneration(request, { model, prompt: fullPrompt });
    } else {
      console.debug('DEBUG - Redirection vers le gestionnaire GPT avec modèle:', model);
      response = await handleGPTGeneration(request, { model, prompt: fullPrompt });
    }

    console.debug('DEBUG - Réponse de la génération:', response);
    return response;
  } catch (error) {
    console.error('DEBUG - Erreur dans la route principale de génération:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
