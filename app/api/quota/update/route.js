// app/api/quota/update/route.js
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

export async function PUT(request) {
  try {
    const decoded = await verifyAuth(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    
    const body = await request.json();
    if (!body.quotas || !Array.isArray(body.quotas)) {
      return NextResponse.json({ error: 'Format invalide' }, { status: 400 });
    }
    
    // Si l'utilisateur connecté est admin et que body.userId est fourni,
    // alors c'est l'admin qui met à jour les quotas d'un autre utilisateur.
    // Sinon, on met à jour les quotas de l'utilisateur connecté.
    let targetUserId = decoded.userId;
    if (decoded.role === 'admin' && body.userId) {
      targetUserId = body.userId;
    }
    
    // Récupération de la liste des model_names présents dans le payload
    const updatedModels = body.quotas.map(q => q.model_name);
    
    // Supprimer les quotas de l'utilisateur qui ne figurent plus dans le payload
    if (updatedModels.length > 0) {
      const placeholders = updatedModels.map(() => '?').join(',');
      await pool.execute(
        `DELETE FROM user_model_quotas
         WHERE user_id = ?
         AND model_name NOT IN (${placeholders})`,
        [targetUserId, ...updatedModels]
      );
    } else {
      // Si aucun quota n'est fourni, on supprime tous les quotas pour cet utilisateur
      await pool.execute(
        `DELETE FROM user_model_quotas
         WHERE user_id = ?`,
        [targetUserId]
      );
    }
    
    // Pour chaque quota fourni, on met à jour ses valeurs
    for (const q of body.quotas) {
      const maxRequests = isNaN(parseInt(q.max_requests, 10))
        ? 0
        : parseInt(q.max_requests, 10);
      const maxLongRequests = isNaN(parseInt(q.max_long_requests, 10))
        ? 0
        : parseInt(q.max_long_requests, 10);
      
      await pool.execute(
        `UPDATE user_model_quotas
         SET max_requests = ?, max_long_requests = ?
         WHERE user_id = ? AND model_name = ?`,
        [maxRequests, maxLongRequests, targetUserId, q.model_name]
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
