'use client';
import { useState, useEffect } from 'react';

function useChatMessages(sessionId) {
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messagesLoaded, setMessagesLoaded] = useState(20);
  const [totalMessages, setTotalMessages] = useState(0);

  const fetchMessages = async (loadMore = false) => {
    if (!sessionId) return;
    setLoadingMessages(true);
    try {
      const take = 20;
      const skip = loadMore ? messagesLoaded : 0;
      const response = await fetch(
        `/api/chat/message?sessionId=${sessionId}&skip=${skip}&take=${take}`
      );
      if (!response.ok) throw new Error('Erreur lors de la récupération des messages');
      const { messages: newMessages, total } = await response.json();
      setTotalMessages(total);
      if (loadMore) {
        setMessages(prev => [...newMessages, ...prev]);
        setMessagesLoaded(prev => prev + take);
      } else {
        setMessages(newMessages);
        setMessagesLoaded(take);
      }
    } catch (error) {
    } finally {
      setLoadingMessages(false);
    }
  };

  const loadMoreMessages = () => fetchMessages(true);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 60000);
    return () => clearInterval(interval);
  }, [sessionId]);

  return { messages, loadingMessages, loadMoreMessages, totalMessages, setMessages };
}

export default useChatMessages;
