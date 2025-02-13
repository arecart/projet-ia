'use client';
import { useState, useEffect } from 'react';

function useSessions(userId) {
  const [sessions, setSessions] = useState([]);

  const fetchSessions = async () => {
    try {
      const response = await fetch(`/api/chat/session?userId=${userId}`);
      if (!response.ok) throw new Error('Erreur lors de la récupération des sessions');
      const { sessions: data } = await response.json();
      setSessions(data);
    } catch (error) {
    }
  };

  const createSession = async (sessionName) => {
    try {
      const response = await fetch('/api/chat/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_name: sessionName }),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Erreur lors de la création de la session');
      const { session } = await response.json();
      await fetchSessions();
      return session;
    } catch (error) {
      return null;
    }
  };

  const deleteSession = async (sessionId) => {
    try {
      const response = await fetch('/api/chat/session', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Erreur lors de la suppression de la session');
      await fetchSessions();
    } catch (error) {
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [userId]);

  return { sessions, fetchSessions, createSession, deleteSession };
}

export default useSessions;
