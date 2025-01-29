import { NextResponse } from 'next/server';
import pool from '@/app/db';

export async function DELETE(request) {
  let conn;
  try {
    const { userIds } = await request.json();
    
    conn = await pool.getConnection();
    await conn.query(
      'DELETE FROM users WHERE id IN (?)',
      [userIds]
    );

    return NextResponse.json({ message: 'Utilisateurs supprimés avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression des utilisateurs:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression des utilisateurs' },
      { status: 500 }
    );
  } finally {
    if (conn) conn.release();
  }
}
