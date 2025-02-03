import pool from '@/app/db';
import { verify } from '@/utils/jwt';
import { NextResponse } from 'next/server';

// Utilitaire pour récupérer l'utilisateur connecté depuis le token
async function getUserFromRequest(request) {
  const token = request.cookies.get('token')?.value;
  if (!token) return null;
  try {
    const decoded = await verify(token);
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return new NextResponse(JSON.stringify({ error: 'Non autorisé' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    // Retourne uniquement les sessions de l'utilisateur connecté
    const sessions = await pool.query(
      'SELECT * FROM ChatSession WHERE user_id = ? ORDER BY updated_at DESC',
      [user.userId]
    );
    return new NextResponse(JSON.stringify({ sessions }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new NextResponse(JSON.stringify({ error: 'Erreur serveur lors de la récupération des sessions.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return new NextResponse(JSON.stringify({ error: 'Non autorisé' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    const { session_name } = await request.json();
    if (!session_name) {
      return new NextResponse(JSON.stringify({ error: 'session_name requis' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Crée une session liée à l'utilisateur connecté
    const result = await pool.query(
      'INSERT INTO ChatSession (session_name, user_id) VALUES (?, ?)',
      [session_name, user.userId]
    );
    const [session] = await pool.query('SELECT * FROM ChatSession WHERE id = ?', [result.insertId]);
    return new NextResponse(JSON.stringify({ success: true, session }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new NextResponse(JSON.stringify({ error: 'Erreur serveur lors de la création de la session.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function DELETE(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return new NextResponse(JSON.stringify({ error: 'Non autorisé' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    const { sessionId } = await request.json();
    if (!sessionId) {
      return new NextResponse(JSON.stringify({ error: 'sessionId requis' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    // Vérifier que la session appartient à l'utilisateur
    const [session] = await pool.query(
      'SELECT * FROM ChatSession WHERE id = ? AND user_id = ?',
      [sessionId, user.userId]
    );
    if (!session) {
      return new NextResponse(JSON.stringify({ error: 'Session introuvable ou non autorisée' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    // Supprimer d'abord les messages associés pour respecter la contrainte de clé étrangère
    await pool.query('DELETE FROM ChatMessage WHERE session_id = ?', [sessionId]);
    // Puis supprimer la session
    await pool.query('DELETE FROM ChatSession WHERE id = ?', [sessionId]);
    return new NextResponse(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new NextResponse(JSON.stringify({ error: 'Erreur serveur lors de la suppression de la session.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
