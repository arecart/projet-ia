// app/api/quota/route.js
import pool from '@/app/db';
import { NextResponse } from 'next/server';
import { verify } from '@/utils/jwt';

async function verifyAuth(request) {
  const token = request.cookies.get('token')?.value;
  if (!token) return null;
  try {
    return await verify(token);
  } catch (err) {
    return null;
  }
}

export async function GET(request) {
  try {
    const decoded = await verifyAuth(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Récupération du paramètre "model" ou "provider" et normalisation
    const { searchParams } = new URL(request.url);
    let modelParam =
      searchParams.get('model') ||
      searchParams.get('provider') ||
      'gpt-3.5-turbo';
    if (modelParam === 'gpt') {
      modelParam = 'gpt-3.5-turbo';
    } else if (modelParam === 'mistral') {
      modelParam = 'mistral-small-latest';
    } else if (modelParam === 'o3') {
      modelParam = 'o3-mini-2025-01-31';
    }

    // Exécution de la requête SQL pour récupérer les quotas normaux et longs
    const result = await pool.execute(
      `SELECT id, request_count, max_requests, long_request_count, max_long_requests, last_request_reset 
       FROM user_model_quotas 
       WHERE user_id = ? AND model_name = ?`,
      [decoded.userId, modelParam]
    );

    // Pour MariaDB, result[0] doit contenir les lignes
    let rows = [];
    if (result) {
      if (Array.isArray(result[0])) {
        rows = result[0];
      } else if (Array.isArray(result)) {
        rows = result;
      }
    }

    // Si aucune entrée n'existe, on en crée une avec des valeurs par défaut pour normal et long quotas
    if (!rows || rows.length === 0) {
      const now = new Date();
      await pool.execute(
        `INSERT INTO user_model_quotas 
         (user_id, model_name, request_count, max_requests, long_request_count, max_long_requests, last_request_reset)
         VALUES (?, ?, 0, 10, 0, 10, ?)`,
        [decoded.userId, modelParam, now]
      );
      return NextResponse.json({
        current: 0,
        max: 10,
        remaining: 10,
        longCurrent: 0,
        longMax: 10,
        longRemaining: 10,
      });
    }

    // Utiliser la première ligne retournée
    const row = rows[0];
    if (!row) {
      return NextResponse.json({
        current: 0,
        max: 10,
        remaining: 10,
        longCurrent: 0,
        longMax: 10,
        longRemaining: 10,
      });
    }

    // Utilisation de la valeur stockée ou d'un fallback uniquement si null ou undefined
    const currentCount = row.request_count != null ? parseInt(row.request_count, 10) : 0;
    const maxRequests = row.max_requests != null ? parseInt(row.max_requests, 10) : 10;
    const remaining = Math.max(0, maxRequests - currentCount);

    const longCurrent = row.long_request_count != null ? parseInt(row.long_request_count, 10) : 0;
    const longMax = row.max_long_requests != null ? parseInt(row.max_long_requests, 10) : 10;
    const longRemaining = Math.max(0, longMax - longCurrent);

    return NextResponse.json({
      current: currentCount,
      max: maxRequests,
      remaining,
      longCurrent,
      longMax,
      longRemaining,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
