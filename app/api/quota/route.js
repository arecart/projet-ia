import pool from '@/app/db';
import { NextResponse } from 'next/server';
import { verify } from '@/utils/jwt';

async function verifyAuth(request) {
  const token = request.cookies.get('token')?.value;
  console.log('Token found:', !!token); // Log token presence
  if (!token) return null;
  
  try {
    const decoded = await verify(token);
    console.log('Decoded token:', decoded); // Log decoded content
    return decoded;
  } catch (err) {
    console.error('Token verification error:', err);
    return null;
  }
}

export async function GET(request) {
  try {
    const decoded = await verifyAuth(request);
    if (!decoded) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    // Récupération brute du résultat
    const [resultSet] = await pool.execute(
      `SELECT request_count, max_requests 
       FROM users 
       WHERE id = ?`,
      [decoded.userId]
    );

    console.log('Type de résultat:', typeof resultSet); // Devrait être 'object'
    console.log('Est un tableau ?', Array.isArray(resultSet)); // Devrait être true

    // Correction cruciale ici :
    const results = Array.isArray(resultSet) ? resultSet : [resultSet];
    
    if (results.length === 0) {
      console.log('Aucun résultat trouvé pour ID:', decoded.userId);
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const userData = results[0];
    console.log('Données utilisateur:', userData);

    return NextResponse.json({
      current: userData.request_count,
      max: userData.max_requests,
      remaining: Math.max(0, userData.max_requests - userData.request_count)
    });

  } catch (error) {
    console.error('Erreur complète:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}