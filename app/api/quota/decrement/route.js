// app/api/quota/decrement/route.js
import pool from '@/app/db';
import { NextResponse } from 'next/server';
import { verify } from '@/utils/jwt';

// Fonction helper pour normaliser le nom du modèle
function normalizeModelName(modelName) {
  switch (modelName) {
    case 'gpt':
      return 'gpt-3.5-turbo';
    case 'mistral':
      return 'mistral-small-latest';
    case 'o3':
      return 'o3-mini-2025-01-31';
    default:
      return modelName;
  }
}

export async function POST(request) {
  try {
    // Vérification du token
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const decoded = await verify(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Récupération du body
    const rawBody = await request.text();

    if (!rawBody) {
      return NextResponse.json({ error: 'Corps de la requête vide' }, { status: 400 });
    }

    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (e) {
      return NextResponse.json({ error: 'Corps de la requête invalide' }, { status: 400 });
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Corps de la requête invalide' }, { status: 400 });
    }

    const modelName = normalizeModelName(body.model || 'gpt-3.5-turbo');

    // Vérification de l'existence d'une entrée
    const [rows] = await pool.execute(
      'SELECT * FROM user_model_quotas WHERE user_id = ? AND model_name = ?',
      [decoded.userId, modelName]
    );

    // Si pas d'entrée, on en crée une
    if (!rows || (Array.isArray(rows) && rows.length === 0)) {
      await pool.execute(
        `INSERT INTO user_model_quotas
        (user_id, model_name, request_count, max_requests)
        VALUES (?, ?, 1, 10)`,
        [decoded.userId, modelName]
      );

      return NextResponse.json({
        current: 1,
        max: 10,
        remaining: 9
      });
    }

    // Récupération des données de quota
    const quota = Array.isArray(rows) ? rows[0] : rows;

    if (quota) {
    }

    // Conversion explicite des valeurs en nombres avec vérification
    const currentCount = Number(quota?.request_count ?? 0);
    const maxRequests = Number(quota?.max_requests ?? 10);

    // Vérification du dépassement de quota
    if (currentCount >= maxRequests) {
      return NextResponse.json({
        error: 'Quota dépassé',
        quota: {
          current: currentCount,
          max: maxRequests,
          remaining: 0
        }
      }, { status: 403 });
    }

    // Incrémentation du compteur
    await pool.execute(
      `UPDATE user_model_quotas
       SET request_count = ?
       WHERE user_id = ? AND model_name = ?`,
      [currentCount + 1, decoded.userId, modelName]
    );

    const newCount = currentCount + 1;

    return NextResponse.json({
      current: newCount,
      max: maxRequests,
      remaining: Math.max(0, maxRequests - newCount)
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Erreur serveur',
      details: error.message
    }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const decoded = await verify(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const rawBody = await request.text();

    if (!rawBody) {
      return NextResponse.json({ error: 'Corps de la requête vide' }, { status: 400 });
    }

    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (e) {
      return NextResponse.json({ error: 'Corps de la requête invalide' }, { status: 400 });
    }

    const modelName = normalizeModelName(body.model || 'gpt-3.5-turbo');

    // Réinitialisation du quota
    await pool.execute(
      `UPDATE user_model_quotas
       SET request_count = 0,
           last_request_reset = CURRENT_TIMESTAMP
       WHERE user_id = ? AND model_name = ?`,
      [decoded.userId, modelName]
    );

    return NextResponse.json({
      current: 0,
      max: 10,
      remaining: 10
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Erreur serveur',
      details: error.message
    }, { status: 500 });
  }
}
