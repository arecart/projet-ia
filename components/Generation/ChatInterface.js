'use client';
import React, { useState, useEffect, useRef } from 'react';
import Header from './Header';
import LeftMenu from './LeftMenu';
import ChatInput from './ChatInput';
import ChatMessage from './ChatMessage';
import useSessions from '../hooks/useSessions';
import useChatMessages from '../hooks/useChatMessages';
import useQuota from '../hooks/useQuota';
import ChangePasswordModal from './ChangePasswordModal';

function LongQuotaExceededModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-zoomIn"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 p-6 rounded-lg shadow-2xl relative animate-zoomInContent"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-gray-200 mb-4">Limite atteinte</h2>
        <p className="text-gray-400 mb-6">
          Vous avez atteint la limite de messages longs pour ce modèle.
          Vous ne pouvez pas envoyer de message de plus de 10 000 caractères.
        </p>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
        >
          OK
        </button>
      </div>
      <style jsx>{`
        @keyframes zoomIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-zoomIn {
          animation: zoomIn 0.3s ease-out forwards;
        }
        @keyframes zoomOut {
          from {
            opacity: 1;
            transform: scale(1);
          }
          to {
            opacity: 0;
            transform: scale(0.8);
          }
        }
        .animate-zoomOut {
          animation: zoomOut 0.3s ease-in forwards;
        }
      `}</style>
    </div>
  );
}

export default function ChatInterface({ onLogout, onDashboard, role = 'user' }) {
  const user = { id: 1, username: 'admin' };

  // Chargement de l'IA favorite depuis le localStorage, ou valeurs par défaut
  const defaultFavorite = (() => {
    const fav = localStorage.getItem('favoriteAI');
    if (fav) {
      try {
        return JSON.parse(fav);
      } catch (e) {
      }
    }
    return null;
  })();

  const [selectedProvider, setSelectedProvider] = useState(
    defaultFavorite ? defaultFavorite.provider : 'gpt'
  );
  const [selectedModel, setSelectedModel] = useState(
    defaultFavorite ? defaultFavorite.model : 'gpt-4o-mini-2024-07-18'
  );

  const { quotaInfo, refreshQuota } = useQuota(user.id, selectedModel);
  const { sessions, createSession, deleteSession } = useSessions(user.id);
  const [selectedSession, setSelectedSession] = useState(null);
  const {
    messages,
    loadingMessages,
    loadMoreMessages,
    totalMessages,
    setMessages,
  } = useChatMessages(selectedSession ? selectedSession.id : null);
  const [chatInput, setChatInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showLongQuotaExceeded, setShowLongQuotaExceeded] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
      });
      if (response.ok) {
        window.location.href = '/login';
      }
    } catch (error) {
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    if (chatInput.trim().length > 100000) {
      alert("Le message ne peut dépasser 100000 caractères.");
      return;
    }
    setSending(true);
    const userText = chatInput.trim();
    setChatInput('');

    let currentSessionId = selectedSession?.id;

    try {
      // Calcul du nombre de quotas longs à utiliser selon la nouvelle logique :
      // - De 10 000 à 15 000 caractères : 1 quota
      // - De 15 000 à 25 000 caractères : 2 quotas
      // - De 25 000 à 35 000 caractères : 3 quotas, etc.
      let longQuotaNeeded = 0;
      if (userText.length >= 10000) {
        if (userText.length <= 15000) {
          longQuotaNeeded = 1;
        } else {
          longQuotaNeeded = 1 + Math.ceil((userText.length - 15000) / 10000);
        }
      }

      // Vérifier si le quota long restant est suffisant
      if (longQuotaNeeded > 0 && quotaInfo.longRemaining < longQuotaNeeded) {
        setShowLongQuotaExceeded(true);
        return;
      }

      // Si des quotas longs sont à décrémenter, appel à l'endpoint correspondant
      if (longQuotaNeeded > 0) {
        const longQuotaResponse = await fetch('/api/quota/long', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: selectedModel,
            count: longQuotaNeeded,
          }),
          credentials: 'include',
        });
        if (!longQuotaResponse.ok) {
          const errorData = await longQuotaResponse.json();
          alert(errorData.message || "Erreur de quota long.");
          return;
        }
      }

      // Décrément du quota normal (pour chaque message envoyé)
      const quotaResponse = await fetch('/api/quota/decrement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: selectedModel }),
        credentials: 'include',
      });
      if (!quotaResponse.ok) {
        const errorData = await quotaResponse.json();
        alert(errorData.message || "Erreur de quota.");
        return;
      }
      refreshQuota();

      // Création d'une nouvelle session si nécessaire
      if (!currentSessionId) {
        const truncatedSessionName =
          userText.length > 30 ? userText.slice(0, 27) + '...' : userText;
        const newSession = await createSession(truncatedSessionName);
        if (!newSession) {
          alert("Erreur lors de la création de la session.");
          return;
        }
        setSelectedSession(newSession);
        currentSessionId = newSession.id;
      }

      // Enregistrement du message utilisateur
      await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSessionId,
          role: 'user',
          message: userText,
        }),
        credentials: 'include',
      });

      const MAX_HISTORY_MESSAGES = 20;
      const recentMessages = messages.slice(-MAX_HISTORY_MESSAGES);
      const conversationHistory = recentMessages
        .map(m => `${m.role}: ${m.message}`)
        .join('\n');

      // Génération de la réponse du bot
      const generateResponse = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          model: selectedModel,
          prompt: userText,
          sessionId: currentSessionId,
          context: conversationHistory,
        }),
        credentials: 'include',
      });
      if (!generateResponse.ok) throw new Error('Erreur lors de la génération');
      const result = await generateResponse.json();
      const botText = `${result.text}`;

      // Enregistrement de la réponse du bot
      await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSessionId,
          role: 'bot',
          message: botText,
          provider: selectedProvider,
        }),
        credentials: 'include',
      });

      setTimeout(async () => {
        const response = await fetch(`/api/chat/message?sessionId=${currentSessionId}&skip=0&take=20`);
        if (response.ok) {
          const { messages: newMessages } = await response.json();
          setMessages(Array.isArray(newMessages) ? newMessages : []);
        }
      }, 300);
    } catch (error) {
      await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSessionId,
          role: 'bot',
          message: "Désolé, une erreur s'est produite lors de la génération de la réponse.",
        }),
        credentials: 'include',
      });
    } finally {
      setSending(false);
    }
  };

  const handleSelectSession = (session) => {
    setSelectedSession(session);
  };

  const handleCreateSession = async (sessionName) => {
    if (sessions.length >= 100) {
      alert("Vous avez atteint le nombre maximum de sessions (100).");
      return;
    }
    const newSession = await createSession(sessionName);
    if (newSession) {
      setSelectedSession(newSession);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    await deleteSession(sessionId);
    if (selectedSession && selectedSession.id === sessionId) {
      setSelectedSession(null);
      setMessages([]);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-b from-gray-800 to-gray-900 text-gray-100">
      <LeftMenu
        user={user}
        sessions={sessions}
        selectedSession={selectedSession}
        onSelectSession={handleSelectSession}
        onCreateSession={handleCreateSession}
        onDeleteSession={handleDeleteSession}
        selectedProvider={selectedProvider}
        selectedModel={selectedModel}
        onProviderChange={setSelectedProvider}
        onModelChange={setSelectedModel}
        quotaInfo={quotaInfo}
        onLogout={handleLogout}
        onRequestChangePassword={() => setShowChangePasswordModal(true)}
        role={role}
      />
      <div className="flex-1 flex flex-col">
        <Header user={user} onDashboard={onDashboard} />
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar scrollbar-thin scrollbar-thumb-gray-700">
          {loadingMessages ? (
            <p className="text-center text-gray-400">Chargement des messages...</p>
          ) : (
            <>
              {messages.length > 0 && (
                <div className="text-center mb-4">
                  <button
                    onClick={() => loadMoreMessages()}
                    disabled={messages.length >= totalMessages || loadingMessages}
                    className={`px-5 py-2 rounded-lg transition-colors ${
                      messages.length >= totalMessages || loadingMessages
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    } text-white`}
                  >
                    {loadingMessages ? 'Chargement...' : 'Afficher les anciens messages'}
                  </button>
                </div>
              )}
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              {messages.length === 0 && (
                <p className="text-center text-gray-500">
                  Aucun message pour cette session.
                </p>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="p-4 border-t border-gray-700">
          <ChatInput
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onSend={handleSendMessage}
            loading={sending}
            quotaExhausted={quotaInfo.remaining <= 0}
          />
        </div>
      </div>
      {showChangePasswordModal && (
        <ChangePasswordModal
          userId={user.id}
          onClose={() => setShowChangePasswordModal(false)}
          onShowToast={(message, type) => alert(`[${type}] ${message}`)}
        />
      )}
      {showLongQuotaExceeded && (
        <LongQuotaExceededModal onClose={() => setShowLongQuotaExceeded(false)} />
      )}
    </div>
  );
}
