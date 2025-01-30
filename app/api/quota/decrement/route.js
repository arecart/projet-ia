// app/api/quota/decrement/route.js
import pool from '@/app/db';
import { NextResponse } from 'next/server';
import { verify } from '@/utils/jwt';

export async function POST(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const decoded = await verify(token);
    if (!decoded) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    // Vérifier d'abord le quota actuel
    const [rows] = await pool.execute(
      `SELECT request_count, max_requests 
       FROM users 
       WHERE id = ?`,
      [decoded.userId]
    );

    console.log('Résultat de la requête:', rows); // Debug

    // Avec MariaDB, rows est directement l'objet qu'on veut
    if (!rows) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Convertir en nombres pour être sûr
    const currentCount = parseInt(rows.request_count, 10) || 0;
    const maxRequests = parseInt(rows.max_requests, 10) || 0;

    if (currentCount >= maxRequests) {
      return NextResponse.json({ 
        error: 'Quota dépassé',
        quota: {
          current: currentCount,
          max: maxRequests,
          remaining: 0
        }
      }, { status: 403 });
    }

    // Incrémenter le compteur
    await pool.execute(
      `UPDATE users 
       SET request_count = request_count + 1 
       WHERE id = ?`,
      [decoded.userId]
    );

    // Retourner le nouveau quota
    const newCount = currentCount + 1;
    return NextResponse.json({
      current: newCount,
      max: maxRequests,
      remaining: Math.max(0, maxRequests - newCount)
    });

  } catch (error) {
    console.error('Erreur décrémentation:', error);
    return NextResponse.json({ 
      error: 'Erreur serveur',
      details: error.message 
    }, { status: 500 });
  }
}
