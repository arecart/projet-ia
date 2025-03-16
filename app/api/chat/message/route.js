import pool from '@/app/db';
import { verify } from '@/utils/jwt';
import { NextResponse } from 'next/server';

// Fonction utilitaire pour récupérer l'utilisateur connecté depuis le token
async function getUserFromRequest(request) {
  const token = request.cookies.get('token')?.value;
  if (!token) return null;
  const decoded = await verify(token);
  return decoded; // Supposons que decoded.userId contient l'ID de l'utilisateur
}

export async function GET(request) {
  try {
    // Récupération des paramètres de la requête
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const skip = Number(searchParams.get('skip')) || 0;
    const take = Number(searchParams.get('take')) || 50;

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'sessionId requis' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const messages = await pool.query(
      'SELECT * FROM ChatMessage WHERE session_id = ? ORDER BY timestamp ASC LIMIT ?, ?',
      [sessionId, skip, take]
    );
    return new Response(
      JSON.stringify({ messages }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Erreur serveur lors de la récupération des messages.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Récupération des données envoyées dans le corps de la requête
    const { sessionId, role, message, image, attachments } = await request.json();

    // Validation des champs requis
    if (!sessionId || !role || !message) {
      return new Response(
        JSON.stringify({ error: 'Données manquantes' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Insertion du message avec les champs optionnels (image et attachments)
    const result = await pool.query(
      'INSERT INTO ChatMessage (session_id, user_id, role, message, image, attachments) VALUES (?, ?, ?, ?, ?, ?)',
      [sessionId, user.userId, role, message, image || null, attachments || null]
    );

    // Récupération du message créé
    const [createdMessage] = await pool.query(
      'SELECT * FROM ChatMessage WHERE id = ?',
      [result.insertId]
    );

    return new Response(
      JSON.stringify({ success: true, message: createdMessage }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Erreur serveur lors de l’ajout du message.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
