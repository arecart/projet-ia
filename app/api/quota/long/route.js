// app/api/quota/long/route.js
import pool from '@/app/db';
import { NextResponse } from 'next/server';
import { verify } from '@/utils/jwt';

export async function POST(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
    }
    const decoded = await verify(token);

    const { model, count } = await request.json();
    if (!model) {
      return NextResponse.json({ message: 'Modèle non spécifié' }, { status: 400 });
    }
    
    // Utilisation du paramètre "count" envoyé par le client.
    // Par défaut, on décrémente 1 quota si "count" n'est pas fourni ou invalide.
    const quotaCount = (typeof count === 'number' && count > 0) ? count : 1;

    // Récupération de l'enregistrement existant
    const [result] = await pool.execute(
      `SELECT long_request_count, max_long_requests 
       FROM user_model_quotas 
       WHERE user_id = ? AND model_name = ?`,
      [decoded.userId, model]
    );
    
    let rows = Array.isArray(result) ? result : (result.rows || []);
    let row = rows[0];

    if (!row) {
      // Si aucun enregistrement n'existe, l'insérer avec des valeurs par défaut
      const now = new Date();
      await pool.execute(
        `INSERT INTO user_model_quotas 
         (user_id, model_name, long_request_count, max_long_requests, last_request_reset)
         VALUES (?, ?, 0, 10, ?)
         ON DUPLICATE KEY UPDATE long_request_count = long_request_count`,
        [decoded.userId, model, now]
      );
      // Récupérer à nouveau l'enregistrement
      const [newResult] = await pool.execute(
        `SELECT long_request_count, max_long_requests 
         FROM user_model_quotas 
         WHERE user_id = ? AND model_name = ?`,
        [decoded.userId, model]
      );
      rows = Array.isArray(newResult) ? newResult : (newResult.rows || []);
      row = rows[0];
    }

    if (!row) {
      row = { long_request_count: "0", max_long_requests: "10" };
    }

    const currentLongCount = parseInt(row.long_request_count ?? "0", 10);
    const maxLongRequests = parseInt(row.max_long_requests ?? "10", 10);

    // Vérifier que la décrémentation ne dépasse pas le quota maximum
    if (currentLongCount + quotaCount > maxLongRequests) {
      return NextResponse.json({ message: 'Quota long épuisé' }, { status: 403 });
    }

    // Mise à jour : incrémenter le compteur du nombre de quotas demandés
    await pool.execute(
      `UPDATE user_model_quotas 
       SET long_request_count = long_request_count + ?
       WHERE user_id = ? AND model_name = ?`,
      [quotaCount, decoded.userId, model]
    );

    const newLongCount = currentLongCount + quotaCount;
    return NextResponse.json({
      message: 'Long quota décrémenté',
      current: newLongCount,
      max: maxLongRequests,
      remaining: maxLongRequests - newLongCount,
    });
  } catch (error) {
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}
