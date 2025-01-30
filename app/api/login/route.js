import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import pool from '@/app/db';
import { sign } from '@/utils/jwt';

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Nom d\'utilisateur et mot de passe requis.' },
        { status: 400 }
      );
    }

    const conn = await pool.getConnection();

    // Attention, mariadb peut renvoyer un seul objet ou un tableau
    const res = await conn.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    // On force la conversion
    const rows = Array.isArray(res) ? res : [res];

    if (!rows || rows.length === 0) {
      conn.release();
      return NextResponse.json(
        { error: 'Identifiants incorrects' },
        { status: 401 }
      );
    }

    const user = rows[0]; // Ok, user existe
    console.log('User trouvé =>', user);

    // Vérification du mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      conn.release();
      return NextResponse.json(
        { error: 'Identifiants incorrects' },
        { status: 401 }
      );
    }

    // Mettre à jour login_count et last_login
    await conn.query(`
      UPDATE users
      SET login_count = login_count + 1,
          last_login = NOW()
      WHERE id = ?
    `, [user.id]);

    // Générer un token (si besoin)
    const token = await sign({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    // Construire la réponse
    const response = NextResponse.json(
      {
        success: true,
        user: { id: user.id, username: user.username, role: user.role }
      },
      { status: 200 }
    );

    // Mettre le cookie
    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 3600
    });

    conn.release();
    return response;

  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}
