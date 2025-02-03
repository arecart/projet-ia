// app/api/role/route.js
import { NextResponse } from 'next/server';
import { verify } from '@/utils/jwt';
import pool from '@/app/db';

export async function GET(request) {
  try {
    // 1) Récupère le cookie "token"
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Pas de token' }, { status: 401 });
    }

    // 2) Vérifie/décode le JWT
    const decoded = await verify(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    // 3) Vérifie en base si l’utilisateur existe encore
    const conn = await pool.getConnection();
    const res = await conn.query('SELECT role FROM users WHERE id = ?', [decoded.userId]);
    const rows = Array.isArray(res) ? res : [res];
    conn.release();

    if (!rows.length) {
      // user supprimé
      return NextResponse.json({ error: 'Compte supprimé' }, { status: 401 });
    }

    // 4) Renvoie le rôle depuis la DB
    const userDb = rows[0];
    return NextResponse.json({ 
      role: userDb.role || 'user',
      userId: decoded.userId  // Ajout de l'userId ici
    });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
