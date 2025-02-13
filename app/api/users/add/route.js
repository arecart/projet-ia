import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import pool from '@/app/db';

/**
 * POST /api/users/add
 * Création d'un nouvel utilisateur avec quotas par modèle (y compris les quotas longs)
 */
export async function POST(request) {
  let conn;

  try {
    const { username, password, role, quotas } = await request.json();

    if (!username || !password || !role) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis.' },
        { status: 400 }
      );
    }

    conn = await pool.getConnection();
    await conn.beginTransaction();

    // Vérifier si l'utilisateur existe déjà
    const existingUsers = await conn.query(
      'SELECT username FROM users WHERE username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'Ce nom d\'utilisateur existe déjà.' },
        { status: 400 }
      );
    }

    // Hasher le mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insérer le nouvel utilisateur
    const userInsertResult = await conn.query(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username, hashedPassword, role]
    );

    if (!userInsertResult || !userInsertResult.insertId) {
      throw new Error('Échec de l’insertion de l’utilisateur');
    }

    const userId = userInsertResult.insertId;

    // Définir les quotas par défaut avec les nouveaux modèles et quotas longs
    const defaultQuotas = [
      { model_name: 'gpt-4o-mini-2024-07-18', max_requests: 10, max_long_requests: 10 },
      { model_name: 'gpt-4o',                max_requests: 10, max_long_requests: 10 },
      { model_name: 'o1-mini-2024-09-12',      max_requests: 10, max_long_requests: 10 },
      { model_name: 'mistral-small-latest',    max_requests: 10, max_long_requests: 10 },
      { model_name: 'mistral-large-latest',    max_requests: 10, max_long_requests: 10 },
      { model_name: 'pixtral-large-latest',    max_requests: 10, max_long_requests: 10 }
    ];

    // Utiliser les quotas fournis ou les quotas par défaut
    const quotasToInsert = quotas && quotas.length > 0 ? quotas : defaultQuotas;

    // Insérer pour chaque modèle les quotas normaux et longs
    await Promise.all(
      quotasToInsert.map(quota =>
        conn.query(
          'INSERT INTO user_model_quotas (user_id, model_name, max_requests, max_long_requests) VALUES (?, ?, ?, ?)',
          [userId, quota.model_name, quota.max_requests, quota.max_long_requests]
        )
      )
    );

    await conn.commit();

    // Récupérer l'utilisateur créé avec ses quotas
    const newUserRows = await conn.query(
      `SELECT id, username, role, created_at
       FROM users
       WHERE id = ?`,
      [userId]
    );

    const userQuotas = await conn.query(
      `SELECT model_name, max_requests, request_count, long_request_count, max_long_requests, last_request_reset
       FROM user_model_quotas
       WHERE user_id = ?`,
      [userId]
    );

    return NextResponse.json({
      success: true,
      message: 'Utilisateur créé avec succès',
      user: {
        ...newUserRows[0],
        quotas: userQuotas
      }
    }, { status: 201 });

  } catch (error) {
    if (conn) {
      await conn.rollback();
    }
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'utilisateur' },
      { status: 500 }
    );
  } finally {
    if (conn) conn.release();
  }
}
