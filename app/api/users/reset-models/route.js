// app/api/users/reset-models/route.js
import pool from '@/app/db';
import { NextResponse } from 'next/server';

// Définition des quotas par défaut pour chaque modèle d'IA
const defaultQuotas = [
  { model_name: 'gpt-4o-mini-2024-07-18', max_requests: 200, max_long_requests: 30 },
  { model_name: 'gpt-4o',                max_requests: 30,  max_long_requests: 5 },
  { model_name: 'o1-mini-2024-09-12',      max_requests: 50,  max_long_requests: 10 },
  { model_name: 'mistral-large-latest',    max_requests: 60,  max_long_requests: 10 },
  { model_name: 'mistral-small-latest',    max_requests: 400, max_long_requests: 30 },
  { model_name: 'pixtral-large-latest',    max_requests: 60,  max_long_requests: 10 },
];

export async function POST(request) {
  let conn;
  try {
    const body = await request.json();
    const { userId } = body;
    if (!userId) {
      return NextResponse.json({ error: 'userId manquant' }, { status: 400 });
    }
    
    conn = await pool.getConnection();
    await conn.beginTransaction();

    // Pour chaque modèle par défaut, on insère ou met à jour l'enregistrement
    for (const quota of defaultQuotas) {
      await conn.query(
        `INSERT INTO user_model_quotas 
         (user_id, model_name, max_requests, max_long_requests, request_count, long_request_count, last_request_reset)
         VALUES (?, ?, ?, ?, 0, 0, NOW())
         ON DUPLICATE KEY UPDATE 
           max_requests = VALUES(max_requests),
           max_long_requests = VALUES(max_long_requests),
           request_count = 0,
           long_request_count = 0,
           last_request_reset = NOW()`,
        [userId, quota.model_name, quota.max_requests, quota.max_long_requests]
      );
    }
    
    await conn.commit();

    // Récupération de l'ensemble des quotas de l'utilisateur (incluant les modèles supplémentaires)
    const [quotas] = await conn.query(
      `SELECT model_name, max_requests, max_long_requests, request_count, long_request_count, last_request_reset
       FROM user_model_quotas
       WHERE user_id = ?`,
      [userId]
    );
    
    return NextResponse.json({ success: true, message: 'Quotas réinitialisés avec succès', quotas });
  } catch (error) {
    if (conn) {
      await conn.rollback();
    }
    return NextResponse.json({ error: 'Erreur lors de la réinitialisation des quotas' }, { status: 500 });
  } finally {
    if (conn) {
      conn.release();
    }
  }
}
