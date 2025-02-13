// /api/users/route.js
import { NextResponse } from 'next/server';
import pool from '@/app/db';

export async function GET() {
  let conn;
  try {
    conn = await pool.getConnection();
    
    // Récupérer tous les utilisateurs
    const users = await conn.query(`
      SELECT
        id,
        username,
        role,
        login_count,
        last_login,
        created_at
      FROM users
    `);

    // Pour chaque utilisateur, récupérer ses quotas (incluant les quotas longs)
    const usersWithQuotas = await Promise.all(users.map(async (user) => {
      const quotas = await conn.query(`
        SELECT
          model_name,
          request_count,
          max_requests,
          long_request_count,
          max_long_requests,
          last_request_reset
        FROM user_model_quotas
        WHERE user_id = ?
      `, [user.id]);

      const quotasWithInfo = quotas.map(quota => {
        const now = new Date();
        const resetTime = quota.last_request_reset ? new Date(quota.last_request_reset) : new Date(0);
        const timeUntilReset = Math.max(0, 3 * 60 * 60 * 1000 - (now - resetTime));
        return {
          ...quota,
          remaining: Math.max(0, quota.max_requests - quota.request_count),
          longRemaining: Math.max(0, quota.max_long_requests - quota.long_request_count),
          resetIn: timeUntilReset,
          resetInHours: Math.ceil(timeUntilReset / (60 * 60 * 1000))
        };
      });

      return {
        ...user,
        quotas: quotasWithInfo
      };
    }));

    return NextResponse.json(usersWithQuotas);
  } catch (err) {
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des utilisateurs' },
      { status: 500 }
    );
  } finally {
    if (conn) conn.release();
  }
}

export async function POST(request) {
  let conn;
  try {
    const { username, password, role = 'user', quotas } = await request.json();
    conn = await pool.getConnection();

    // Démarrer une transaction
    await conn.beginTransaction();

    // Insérer l'utilisateur
    const [userResult] = await conn.query(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username, password, role]
    );
    const userId = userResult.insertId;

    // Définir les quotas par défaut avec les nouveaux modèles
    const defaultQuotas = [
      { model_name: 'gpt-4o-mini-2024-07-18', max_requests: 10, max_long_requests: 10 },
      { model_name: 'gpt-4o',                max_requests: 10, max_long_requests: 10 },
      { model_name: 'o1-mini-2024-09-12',      max_requests: 10, max_long_requests: 10 },
      { model_name: 'mistral-small-latest',    max_requests: 10, max_long_requests: 10 },
      { model_name: 'mistral-large-latest',    max_requests: 10, max_long_requests: 10 },
      { model_name: 'pixtral-large-latest',    max_requests: 10, max_long_requests: 10 }
    ];

    const quotasToInsert = quotas || defaultQuotas;

    await Promise.all(quotasToInsert.map(quota =>
      conn.query(
        'INSERT INTO user_model_quotas (user_id, model_name, max_requests, max_long_requests) VALUES (?, ?, ?, ?)',
        [userId, quota.model_name, quota.max_requests, quota.max_long_requests]
      )
    ));

    // Valider la transaction
    await conn.commit();

    // Récupérer l'utilisateur créé avec ses quotas
    const [newUser] = await conn.query(
      'SELECT id, username, role, login_count, last_login, created_at FROM users WHERE id = ?',
      [userId]
    );

    const userQuotas = await conn.query(
      'SELECT model_name, request_count, max_requests, long_request_count, max_long_requests, last_request_reset FROM user_model_quotas WHERE user_id = ?',
      [userId]
    );

    return NextResponse.json({
      ...newUser[0],
      quotas: userQuotas
    }, { status: 201 });

  } catch (error) {
    if (conn) await conn.rollback();
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'utilisateur' },
      { status: 500 }
    );
  } finally {
    if (conn) conn.release();
  }
}

export async function DELETE(request) {
  let conn;
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID manquant' }, { status: 400 });
    }

    conn = await pool.getConnection();
    await conn.beginTransaction();

    // Supprimer l'utilisateur (les quotas seront supprimés par la contrainte ON DELETE CASCADE)
    await conn.query('DELETE FROM users WHERE id = ?', [id]);

    await conn.commit();

    return NextResponse.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    if (conn) await conn.rollback();
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'utilisateur' },
      { status: 500 }
    );
  } finally {
    if (conn) conn.release();
  }
}
