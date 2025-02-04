// app/api/track-usage/route.js
import pool from '@/app/db';
import { NextResponse } from 'next/server';
import { verify } from '@/utils/jwt';

export async function POST(request) {
  try {
    // Lire le cookie "token" du header
    const cookieHeader = request.headers.get('cookie') || ''; 
    // Chercher la valeur "token"
    const tokenCookie = cookieHeader
      .split(';')
      .find((c) => c.trim().startsWith('token='))?.split('=')[1];

    if (!tokenCookie) {
      return NextResponse.json(
        { error: 'Missing token cookie' }, 
        { status: 401 }
      );
    }

    // Vérifier le JWT
    let decoded;
    try {
      decoded = await verify(tokenCookie);
    } catch (err) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Récupérer le corps JSON
    const { 
      userId,
      modelName,
      promptTokens,
      completionTokens,
      totalTokens
    } = await request.json();

    // Validation
    if (!userId || !modelName || promptTokens == null || completionTokens == null || totalTokens == null) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Vérifier cohérence userId / token
    if (decoded.userId !== userId) {
      return NextResponse.json(
        { error: 'User ID mismatch' },
        { status: 403 }
      );
    }

    // Calcul des tarifs suivant le modèle
    let promptRate = 0;
    let completionRate = 0;
    
    switch (modelName) {
      case 'gpt-4o-2024-08-06':
        // GPT-4o normal
        promptRate = 2.50 / 1e6;        // 0.00000250
        completionRate = 10.00 / 1e6;     // 0.00001000
        break;
      case 'gpt-4o-mini-2024-07-18':
        promptRate = 0.15 / 1e6;        // 0.00000015
        completionRate = 0.60 / 1e6;      // 0.00000060
        break;
      case 'o1-mini-2024-09-12':
        promptRate = 1.10 / 1e6;        // 0.00000110
        completionRate = 4.40 / 1e6;      // 0.00000440
        break;
      case 'mistral-small-latest':
        promptRate = 0.18 / 1e6;
        completionRate = 0.54 / 1e6;
        break;
      case 'codestral-latest':
        promptRate = 0.30 / 1e6;
        completionRate = 0.90 / 1e6;
        break;
      default:
        return NextResponse.json(
          { error: `Unknown modelName: ${modelName}` },
          { status: 400 }
        );
    }

    // Calcul du coût
    const promptCost = promptTokens * promptRate;
    const completionCost = completionTokens * completionRate;
    const totalCost = promptCost + completionCost;

    // Insertion en base
    await pool.execute(
      `INSERT INTO token_usage 
         (user_id, model_name, prompt_tokens, completion_tokens, total_tokens, estimated_cost)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, modelName, promptTokens, completionTokens, totalTokens, totalCost]
    );

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("track-usage error:", error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
