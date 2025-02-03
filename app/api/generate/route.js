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
    return null;
  }
  try {
    const decoded = await verify(token);
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { provider, model, prompt, sessionId, context } = data;
    

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId requis' }, { status: 400 });
    }

    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const [sessions] = await pool.query(
      'SELECT * FROM ChatSession WHERE id = ? AND user_id = ?',
      [sessionId, user.userId]
    );
    if (!sessions || (Array.isArray(sessions) && sessions.length === 0)) {
      return NextResponse.json({ error: 'Session non autorisée ou introuvable' }, { status: 403 });
    }

    // Récupérer uniquement les 2 derniers messages (ordre chronologique)
    const [rows] = await pool.query(
      'SELECT * FROM ChatMessage WHERE session_id = ? ORDER BY timestamp DESC LIMIT 20',
      [sessionId]
    );
    const messages = Array.isArray(rows) ? rows.reverse() : (rows ? [rows] : []);

    // Construire une chaîne de caractères avec ces messages
    const conversationHistory = messages
      .map(m => `${m.role}: ${m.message}`)
      .join('\n');

    // Si un contexte supplémentaire est fourni, l'ajouter (optionnel)
    let combinedHistory = conversationHistory;
    if (context && context.trim()) {
      combinedHistory = combinedHistory
        ? `${combinedHistory}\n${context}`
        : context;
    }

    // Construire le prompt complet en ajoutant l'historique limité avant le prompt utilisateur
    const fullPrompt = combinedHistory
      ? `${combinedHistory}\nUser: ${prompt}`
      : prompt;

    let response;
    if (provider === 'mistral') {
      response = await handleMistralGeneration(request, { model, prompt: fullPrompt });
    } else {
      response = await handleGPTGeneration(request, { model, prompt: fullPrompt });
    }

    return response;
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
