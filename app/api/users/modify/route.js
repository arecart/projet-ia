// app/api/users/modify/route.js
import { NextResponse } from 'next/server';
import pool from '@/app/db';
import bcrypt from 'bcrypt';

/**
 * PUT /api/users/modify
 * Permet de modifier le mot de passe d'un utilisateur.
 * Expects JSON payload with: { userId, oldPassword, newPassword }
 */
export async function PUT(request) {
  let conn;
  try {
    // Lecture et validation du payload
    const payload = await request.json();
    const { userId, oldPassword, newPassword } = payload;
    if (!userId || !oldPassword || !newPassword) {
      return NextResponse.json(
        { error: 'userId, oldPassword, and newPassword are required.' },
        { status: 400 }
      );
    }

    // Normalisation (supprime les espaces en début et fin)
    const trimmedOldPassword = oldPassword.trim();
    const trimmedNewPassword = newPassword.trim();

    conn = await pool.getConnection();
    await conn.beginTransaction();

    // Récupération de l'utilisateur avec son hash de mot de passe
    const users = await conn.query(
      'SELECT id, password FROM users WHERE id = ?',
      [userId]
    );
    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const user = users[0];


    // Comparaison du mot de passe saisi avec le hash stocké
    const passwordMatches = await bcrypt.compare(trimmedOldPassword, user.password);
    if (!passwordMatches) {
      return NextResponse.json({ error: 'Ancien mot de passe incorrect' }, { status: 403 });
    }

    // Hachage du nouveau mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(trimmedNewPassword, salt);

    // Mise à jour dans la base de données
    await conn.query('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, userId]);
    await conn.commit();

    return NextResponse.json({ success: true });
  } catch (error) {
    if (conn) await conn.rollback();
    return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
  } finally {
    if (conn) await conn.release();
  }
}
