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
    console.error('Token verification error:', err);
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
    
    for (const q of body.quotas) {
      await pool.execute(
        `UPDATE user_model_quotas
         SET max_requests = ?
         WHERE id = ? AND user_id = ?`,
        [q.max_requests, q.id, decoded.userId]
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des quotas:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
