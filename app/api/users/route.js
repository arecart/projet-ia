import { NextResponse } from 'next/server';
import pool from '@/app/db';

// GET tous les utilisateurs
export async function GET() {
  let conn;
  try {
    conn = await pool.getConnection();
    console.log('Connexion établie');

    const users = await conn.query('SELECT id, username, created_at FROM users');
    console.log('Utilisateurs trouvés:', users);

    return NextResponse.json(users);
  } catch (error) {
    console.error('Erreur détaillée:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des utilisateurs' },
      { status: 500 }
    );
  } finally {
    if (conn) conn.release();
  }
}

// POST nouvel utilisateur
export async function POST(request) {
  let conn;
  try {
    const { username, password } = await request.json();
    conn = await pool.getConnection();

    const result = await conn.query(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, password]
    );

    const newUser = await conn.query(
      'SELECT id, username, created_at FROM users WHERE id = ?',
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
