import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import pool from '@/app/db';

/**
 * POST /api/users/add
 * Création d'un nouvel utilisateur AVEC hash du mot de passe
 */
export async function POST(request) {
  const conn = await pool.getConnection();
  
  try {
    const { username, password, role, max_requests } = await request.json();

    if (!username || !password || !role || max_requests === undefined) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis.' },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur existe déjà
    const [existingUsers] = await conn.query(
      'SELECT username FROM users WHERE username = ?',
      [username]
    );

    if (existingUsers && existingUsers[0]) {
      return NextResponse.json(
        { error: 'Cet nom d\'utilisateur existe déjà.' },
        { status: 400 }
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insérer le nouvel utilisateur
    await conn.query(
      'INSERT INTO users (username, password, role, max_requests) VALUES (?, ?, ?, ?)',
      [username, hashedPassword, role, max_requests]
    );

    // Réorganiser les IDs - Version MariaDB
    await conn.query('SET @count = 0');
    await conn.query('UPDATE users SET id = @count:= @count + 1 ORDER BY id');
    await conn.query('ALTER TABLE users AUTO_INCREMENT = 1');

    return NextResponse.json({ 
      success: true,
      message: 'Utilisateur créé avec succès'
    }, { status: 201 });

  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  } finally {
    if (conn) conn.release();
  }
}
