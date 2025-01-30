import { NextResponse } from 'next/server';
import pool from '@/app/db';

export async function GET() {
  let conn;
  try {
    conn = await pool.getConnection();
    
    const rows = await conn.query(`
      SELECT
        id,
        username,
        role,
        login_count,
        last_login,
        created_at,
        max_requests,     /* Ajout des champs quota */
        request_count,
        last_request_reset
      FROM users
    `);
    conn.release();

    const users = Array.isArray(rows) ? rows : [rows];

    // Ajouter des informations sur le quota pour chaque utilisateur
    const usersWithQuotaInfo = users.map(user => {
      const now = new Date();
      const resetTime = user.last_request_reset 
        ? new Date(user.last_request_reset)
        : new Date(0);
      
      const timeUntilReset = Math.max(0, 3 * 60 * 60 * 1000 - (now - resetTime));
      
      return {
        ...user,
        quotaInfo: {
          current: user.request_count,
          max: user.max_requests,
          remaining: Math.max(0, user.max_requests - user.request_count),
          resetIn: timeUntilReset,
          resetInHours: Math.ceil(timeUntilReset / (60 * 60 * 1000))
        }
      };
    });

    console.log('RESULT GET /api/users =>', usersWithQuotaInfo);

    return NextResponse.json(usersWithQuotaInfo);
  } catch (err) {
    console.error('Erreur lors de la récupération des utilisateurs:', err);
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
    const { username, password, maxRequests = 10 } = await request.json(); // Ajout d'un quota par défaut
    conn = await pool.getConnection();

    const [result] = await conn.query(
      'INSERT INTO users (username, password, max_requests) VALUES (?, ?, ?)',
      [username, password, maxRequests]
    );

    const [newUser] = await conn.query(
      `
        SELECT 
          id, username, role, login_count, last_login, created_at,
          max_requests, request_count, last_request_reset
        FROM users
        WHERE id = ?
      `,
      [result.insertId]
    );

    return NextResponse.json(newUser[0], { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
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
    await conn.query('DELETE FROM users WHERE id = ?', [id]);

    return NextResponse.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'utilisateur' },
      { status: 500 }
    );
  } finally {
    if (conn) conn.release();
  }
}
