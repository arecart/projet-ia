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
      modelName,         // <--- On attend le nom du modèle (ex: "gpt-3.5-turbo-0125")
      promptTokens,
      completionTokens,
      totalTokens
    } = await request.json();

    // Validation
    if (!userId || !modelName || !promptTokens || !completionTokens || !totalTokens) {
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
    // (coût par token = euro / 1e6 tokens)
    let promptRate = 0;
    let completionRate = 0;

    switch (modelName) {
      case 'gpt-3.5-turbo-0125':
      case 'gpt-3.5-turbo': 
        // Exemple de tarifs (GPT-3.5)
        // 0.5e-6 par prompt token, 1.5e-6 par completion token
        promptRate = 0.0000005;
        completionRate = 0.0000015;
        break;

      case 'mistral-small-latest':
        // Mistral Small -> 0,18€ / million = 0.00000018
        // Completion -> 0,54€ / million = 0.00000054
        promptRate = 0.00000018;
        completionRate = 0.00000054;
        break;

      case 'codestral-latest':
        // Codestral -> 0,30€ / million = 0.00000030
        // Completion -> 0,90€ / million = 0.00000090
        promptRate = 0.00000030;
        completionRate = 0.00000090;
        break;

      default:
        // Par défaut, on peut mettre un tarif ou renvoyer une erreur
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
    console.error('Track usage error:', error.message);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
