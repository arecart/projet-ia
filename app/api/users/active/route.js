import { NextResponse } from 'next/server';
import pool from '@/app/db';
import { verify } from '@/utils/jwt';

export async function GET(request) {
  const token = request.cookies.get('token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Token absent' }, { status: 401 });
  }

  try {
    const payload = await verify(token);
    const userId = payload.userId;
    const conn = await pool.getConnection();
    const [rows] = await conn.query('SELECT is_active FROM users WHERE id = ?', [userId]);
    conn.release();

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }
    
    if (!rows[0].is_active) {
      return NextResponse.json({ active: false, error: 'Votre compte est désactivé' }, { status: 403 });
    }

    return NextResponse.json({ active: true });
  } catch (error) {
    return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
  }
}
