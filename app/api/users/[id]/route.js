import { NextResponse } from 'next/server';
import pool from '@/app/db';

export async function DELETE(request, { params }) {
  const { id } = params;

  try {
    const connection = await pool.getConnection();
    await connection.execute('DELETE FROM users WHERE id = ?', [id]);
    connection.release();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'utilisateur" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  const { id } = params;
  const { username, newId } = await request.json();

  try {
    const connection = await pool.getConnection();
    await connection.execute('UPDATE users SET username = ?, id = ? WHERE id = ?', [username, newId || id, id]);
    connection.release();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'utilisateur" },
      { status: 500 }
    );
  }
}