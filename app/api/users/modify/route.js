// app/api/users/modify/route.js
import { NextResponse } from 'next/server';
import pool from '@/app/db';
import bcrypt from 'bcrypt';
import { verify } from '@/utils/jwt';

export async function PUT(request) {
  let conn;
  try {

    // Récupération et vérification du token
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    const decoded = await verify(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    
    // Lecture et validation du payload (on ignore userId envoyé par le client)
    const payload = await request.json();

    const { oldPassword, newPassword } = payload;
    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        { error: 'oldPassword and newPassword are required.' },
        { status: 400 }
      );
    }

    // On utilise l'userId issu du token
    const userId = decoded.userId;

    // Normalisation (suppression des espaces inutiles)
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
    const updateResult = await conn.query('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, userId]);

    await conn.commit();

    return NextResponse.json({ success: true });
  } catch (error) {
    if (conn) {
      try {
        await conn.rollback();
      } catch (rollbackError) {
      }
    }
    return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
  } finally {
    if (conn) {
      try {
        await conn.release();
      } catch (releaseError) {
      }
    }
  }
}
