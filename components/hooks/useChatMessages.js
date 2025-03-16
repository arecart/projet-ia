'use client';
import { useState, useEffect, useCallback } from 'react';

function useChatMessages(sessionId) {
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messagesLoaded, setMessagesLoaded] = useState(0);
  const [totalMessages, setTotalMessages] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(Date.now());

  // Fonction pour récupérer les messages depuis l'API
  const fetchMessages = useCallback(async (loadMore = false, currentMessages = [], currentMessagesLoaded = 0) => {
    if (!sessionId) {
      setMessages([]);
      setTotalMessages(0);
      setMessagesLoaded(0);
      return;
    }

    setLoadingMessages(true);
    try {
      const take = 20; // Nombre de messages à charger à chaque requête
      const skip = loadMore ? currentMessagesLoaded : 0; // Offset pour charger plus de messages

      const response = await fetch(`/api/chat/message?sessionId=${sessionId}&skip=${skip}&take=${take}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erreur API: ${errorData.error || 'Réponse non valide'}`);
      }

      const { messages: newMessages, total } = await response.json();

      // Filtrage des messages dupliqués
      const uniqueNewMessages = newMessages.filter(
        newMsg => !currentMessages.some(msg => msg.id === newMsg.id)
      );

      // Mise à jour des messages
      if (loadMore) {
        setMessages(prev => [...prev, ...uniqueNewMessages]);
      } else {
        setMessages(uniqueNewMessages);
      }

      setTotalMessages(total || newMessages.length);
      setMessagesLoaded(prev => prev + (loadMore ? uniqueNewMessages.length : 0));
    } catch (error) {
    } finally {
      setLoadingMessages(false);
    }
  }, [sessionId]);

  // Fonction pour charger plus de messages
  const loadMoreMessages = useCallback(() => {
    if (messagesLoaded < totalMessages && !loadingMessages) {
      fetchMessages(true, messages, messagesLoaded);
    }
  }, [messagesLoaded, totalMessages, loadingMessages, fetchMessages, messages]);

  // Effet pour charger les messages au changement de sessionId ou lastUpdated
  useEffect(() => {
    setMessages([]);
    setMessagesLoaded(0);
    fetchMessages(false, [], 0);
  }, [sessionId, fetchMessages, lastUpdated]);

  // Fonction pour rafraîchir les messages
  const refreshMessages = useCallback(() => {
    setLastUpdated(Date.now());
  }, []);

  return { messages, loadingMessages, loadMoreMessages, totalMessages, setMessages, refreshMessages };
}

export default useChatMessages;