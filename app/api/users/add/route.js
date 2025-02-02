import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import pool from '@/app/db';

/**
 * POST /api/users/add
 * Création d'un nouvel utilisateur avec quotas par modèle
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

    // Vérifier si l'utilisateur existe déjà (pas de déstructuration)
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

    // Insérer les quotas pour chaque modèle
    const defaultQuotas = [
      { model_name: 'gpt-3.5-turbo', max_requests: 10 },
      { model_name: 'mistral-small-latest', max_requests: 10 }
    ];

    const quotasToInsert = quotas?.length > 0 ? quotas : defaultQuotas;

    await Promise.all(
      quotasToInsert.map(quota =>
        conn.query(
          'INSERT INTO user_model_quotas (user_id, model_name, max_requests) VALUES (?, ?, ?)',
          [userId, quota.model_name, quota.max_requests]
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

    if (!newUserRows || newUserRows.length === 0) {
      throw new Error('Impossible de récupérer l\'utilisateur nouvellement créé');
    }

    const userQuotas = await conn.query(
      `SELECT model_name, max_requests, request_count, last_request_reset
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
    console.error('❌ Erreur lors de la création de l\'utilisateur:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  } finally {
    if (conn) conn.release();
  }
}
