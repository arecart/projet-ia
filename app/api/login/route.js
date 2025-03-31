import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import pool from '@/app/db';
import { sign } from '@/utils/jwt';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    // Vérification des champs requis
    if (!username || !password) {
      return NextResponse.json(
        { error: "Nom d'utilisateur et mot de passe requis." },
        { status: 400 }
      );
    }

    // Connexion à la base de données
    let conn;
    try {
      conn = await pool.getConnection();
    } catch (dbError) {
      console.error('Erreur de connexion à la base de données:', dbError);
      return NextResponse.json(
        { error: 'Erreur de connexion à la base de données.' },
        { status: 500 }
      );
    }

    // Recherche de l'utilisateur
    const res = await conn.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    const rows = Array.isArray(res) ? res : [res];

    if (!rows || rows.length === 0) {
      conn.release();
      return NextResponse.json(
        { error: 'Identifiants incorrects' },
        { status: 401 }
      );
    }

    const user = rows[0];

    // Vérification du mot de passe
    if (!user.password) {
      conn.release();
      return NextResponse.json(
        { error: 'Identifiants incorrects' },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      conn.release();
      return NextResponse.json(
        { error: 'Identifiants incorrects' },
        { status: 401 }
      );
    }

    // Mise à jour des statistiques de connexion
    await conn.query(
      `UPDATE users
       SET login_count = login_count + 1,
           last_login = NOW()
       WHERE id = ?`,
      [user.id]
    );

    // Génération du token JWT
    let token;
    try {
      token = await sign({
        userId: user.id,
        username: user.username,
        role: user.role,
      });
    } catch (jwtError) {
      console.error('Erreur lors de la génération du token JWT:', jwtError);
      conn.release();
      return NextResponse.json(
        { error: 'Erreur interne du serveur.' },
        { status: 500 }
      );
    }

    // Réponse avec le token dans un cookie
    const response = NextResponse.json(
      {
        success: true,
        user: { id: user.id, username: user.username, role: user.role },
      },
      { status: 200 }
    );

    try {
      response.cookies.set({
        name: 'token',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 3600,
      });
    } catch (cookieError) {
      console.error('Erreur lors de la configuration du cookie:', cookieError);
      conn.release();
      return NextResponse.json(
        { error: 'Erreur interne du serveur.' },
        { status: 500 }
      );
    }

    conn.release();
    return response;
  } catch (error) {
    console.error('Erreur dans POST /api/login:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}