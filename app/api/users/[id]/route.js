import { NextResponse } from 'next/server';
import pool from '@/app/db';

export async function PUT(request, context) {
  try {
    const params = await context.params;
    const id = params?.id;
    const { username, role, newId, maxRequests } = await request.json();

    const conn = await pool.getConnection();
    await conn.execute(
      'UPDATE users SET username = ?, role = ?, id = ?, max_requests = ? WHERE id = ?',
      [username, role, newId || id, maxRequests, id]
    );
    conn.release();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'utilisateur" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/[id]
 */
export async function DELETE(request, context) {
  try {
    const params = await context.params;
    const id = params?.id;

    if (!id) {
      return NextResponse.json(
        { error: 'ID de l\'utilisateur requis.' },
        { status: 400 }
      );
    }

    const conn = await pool.getConnection();
    await conn.query('DELETE FROM users WHERE id = ?', [id]);

    // Réorganiser les IDs après la suppression
    await conn.query('SET @count = 0');
    await conn.query('UPDATE users SET id = @count:= @count + 1 ORDER BY id');
    await conn.query('ALTER TABLE users AUTO_INCREMENT = 1');

    conn.release();
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}
