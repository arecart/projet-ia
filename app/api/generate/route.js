import { NextResponse } from 'next/server';
import { verify } from '@/utils/jwt';
import pool from '@/app/db';
import { handleMistralGeneration } from './mistral/route';
import { handle4OGeneration } from './gpt/4o/route';
import { handle4OMiniGeneration } from './gpt/4oMini/route';
import { handleO1MiniGeneration } from './gpt/o1-mini/route';

async function getUserFromRequest(request) {
  const token = request.cookies.get('token')?.value;
  if (!token) return null;
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
    const { provider, model, prompt, sessionId, context, image, stream = false } = data;

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

    const [rows] = await pool.query(
      'SELECT * FROM ChatMessage WHERE session_id = ? ORDER BY timestamp DESC LIMIT 50',
      [sessionId]
    );
    const messages = Array.isArray(rows) ? rows.reverse() : (rows ? [rows] : []);

    const MAX_CONTEXT_CHARS = 5000;
    let conversationHistory = '';
    let charCount = 0;

    for (const msg of messages) {
      const messageText = `${msg.role}: ${msg.message}\n`;
      if (charCount + messageText.length <= MAX_CONTEXT_CHARS) {
        conversationHistory += messageText;
        charCount += messageText.length;
      } else {
        break;
      }
    }

    let combinedHistory = conversationHistory.trim();
    if (context && context.trim()) {
      combinedHistory = combinedHistory ? `${combinedHistory}\n${context}` : context;
    }

    const fullPrompt = combinedHistory ? `${combinedHistory}\nUser: ${prompt}` : `User: ${prompt}`;

    console.log('Full prompt généré:', fullPrompt.substring(0, 200) + '...');

    if (provider === 'mistral' || provider === 'o3-mini' || provider === 'pixtral') {
      const response = await handleMistralGeneration(request, { model, prompt: fullPrompt, image });
      return response;
    } else {
      switch (model) {
        case 'gpt-4o':
          return handle4OGeneration(request, { model, prompt: fullPrompt, image, stream });
        case 'gpt-4o-mini-2024-07-18':
          return handle4OMiniGeneration(request, { model, prompt: fullPrompt, image, stream });
        case 'o1-mini-2024-09-12':
          return handleO1MiniGeneration(request, { model, prompt: fullPrompt, image, stream });
        default:
          return NextResponse.json({ error: 'Modèle non supporté' }, { status: 400 });
      }
    }
  } catch (error) {
    console.error('Erreur dans la génération:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}