// app/api/quota/reset-manual/route.js
import pool from '@/app/db';
import { NextResponse } from 'next/server';
import { verify } from '@/utils/jwt';

async function verifyAuth(request) {
  const token = request.cookies.get('token')?.value;
  if (!token) return null;
  try {
    const decoded = await verify(token);
    return decoded;
  } catch (err) {
    return null;
  }
}

export async function POST(request) {
  try {
    const decoded = await verifyAuth(request);
    if (!decoded)
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    // On récupère l'ID utilisateur à réinitialiser dans les query params
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId)
      return NextResponse.json({ error: 'User ID requis' }, { status: 400 });

    const now = new Date();
    await pool.execute(
      `UPDATE user_model_quotas
       SET request_count = 0, 
           last_request_reset = ?, 
           baseline_request_count = NULL, 
           restoration_applied = 0
       WHERE user_id = ?`,
      [now, userId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
