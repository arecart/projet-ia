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
    const rows = await conn.query('SELECT * FROM users WHERE username = ?', [username]);
    conn.release();

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Identifiants incorrects' }, 
        { status: 401 }
      );
    }

    const user = rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Identifiants incorrects' }, 
        { status: 401 }
      );
    }

    const token = await sign({ 
      userId: user.id, 
      username: user.username 
    });

    const response = NextResponse.json(
      { 
        success: true,
        user: { id: user.id, username: user.username }
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

    return response;

  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur.' }, 
      { status: 500 }
    );
  }
}
