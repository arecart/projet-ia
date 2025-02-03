import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import pool from '@/app/db';
import { sign } from '@/utils/jwt';

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    
    if (!username || !password) {
      return NextResponse.json(
        { error: "Nom d'utilisateur et mot de passe requis." },
        { status: 400 }
      );
    }

    const conn = await pool.getConnection();

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

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      conn.release();
      return NextResponse.json(
        { error: 'Identifiants incorrects' },
        { status: 401 }
      );
    }

    // Vérification si le compte est activé
   /* if (!user.is_active) {
      conn.release();
      return NextResponse.json(
        { error: 'Votre compte est désactivé' },
        { status: 403 }
      );
    }*/

    await conn.query(
      `UPDATE users
       SET login_count = login_count + 1,
           last_login = NOW()
       WHERE id = ?`,
      [user.id]
    );

    const token = await sign({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    const response = NextResponse.json(
      {
        success: true,
        user: { id: user.id, username: user.username, role: user.role }
      },
      { status: 200 }
    );

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
    return NextResponse.json(
      { error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}
