// /api/users/[id]/route.js
import { NextResponse } from 'next/server';
import pool from '@/app/db';

export async function GET(request) {
  // Récupération de l'ID depuis l'URL (exemple : /api/users/4)
  const id = request.url.split('/').pop();
  let conn;
  try {
    conn = await pool.getConnection();
    // Sélection de l'utilisateur avec is_active
    const users = await conn.query(
      `SELECT id, username, role, login_count, last_login, created_at, is_active
       FROM users 
       WHERE id = ?`,
      [id]
    );
    if (!users || users.length === 0) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }
    const userData = users[0];
    
    // Récupération des quotas
    const quotas = await conn.query(
      `SELECT 
         model_name,
         request_count,
         max_requests,
         last_request_reset
       FROM user_model_quotas
       WHERE user_id = ?`,
      [id]
    );
    const quotasWithInfo = quotas.map(quota => {
      const now = new Date();
      const resetTime = quota.last_request_reset ? new Date(quota.last_request_reset) : new Date(0);
      const timeUntilReset = Math.max(0, 3 * 60 * 60 * 1000 - (now - resetTime));
      return {
        ...quota,
        remaining: Math.max(0, quota.max_requests - quota.request_count),
        resetIn: timeUntilReset,
        resetInHours: Math.ceil(timeUntilReset / (60 * 60 * 1000))
      };
    });
    return NextResponse.json({ ...userData, quotas: quotasWithInfo });
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de la récupération de l'utilisateur" }, { status: 500 });
  } finally {
    if (conn) await conn.release();
  }
}

export async function PUT(request) {
  // Récupération de l'ID depuis l'URL
  const id = request.url.split('/').pop();
  let conn;
  try {
    // Lecture des données envoyées par le client (sans nouvelle valeur d'ID)
    const { username, role, quotas, is_active } = await request.json();
    conn = await pool.getConnection();
    await conn.beginTransaction();
    
    // Mise à jour de l'utilisateur sans changer l'ID
    await conn.query(
      'UPDATE users SET username = ?, role = ?, is_active = ? WHERE id = ?',
      [username, role, is_active, id]
    );
    
    // Mise à jour des quotas si fournis
    if (quotas && quotas.length > 0) {
      await conn.query('DELETE FROM user_model_quotas WHERE user_id = ?', [id]);
      for (const quota of quotas) {
        await conn.query(
          'INSERT INTO user_model_quotas (user_id, model_name, max_requests) VALUES (?, ?, ?)',
          [id, quota.model_name, quota.max_requests]
        );
      }
    }
    
    await conn.commit();
    return NextResponse.json({ success: true });
  } catch (error) {
    if (conn) await conn.rollback();
    return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
  } finally {
    if (conn) await conn.release();
  }
}

export async function DELETE(request) {
  // Récupération de l'ID depuis l'URL
  const id = request.url.split('/').pop();
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();
    // Suppression dans les tables associées (la contrainte ON DELETE CASCADE peut gérer user_model_quotas)
    await conn.query('DELETE FROM token_usage WHERE user_id = ?', [id]);
    await conn.query('DELETE FROM users WHERE id = ?', [id]);
    await conn.commit();
    return NextResponse.json({ success: true });
  } catch (error) {
    if (conn) await conn.rollback();
    return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 });
  } finally {
    if (conn) await conn.release();
  }
}
