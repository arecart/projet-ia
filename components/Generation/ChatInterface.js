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
import LongQuotaExceededModal from './LongQuotaExceededModal';

function ChatInterface({ onLogout, onDashboard, role = 'user' }) {
  const user = { id: 1, username: 'admin' };
  const defaultFavorite = (() => {
    const fav = localStorage.getItem('favoriteAI');
    return fav ? JSON.parse(fav) : null;
  })();
  const [selectedProvider, setSelectedProvider] = useState(defaultFavorite?.provider || 'gpt');
  const [selectedModel, setSelectedModel] = useState(defaultFavorite?.model || 'gpt-4o-mini-2024-07-18');
  const { quotaInfo, refreshQuota } = useQuota(user.id, selectedModel);
  const { sessions, createSession, deleteSession } = useSessions(user.id);
  const [selectedSession, setSelectedSession] = useState(null);
  const { messages, loadingMessages, loadMoreMessages, totalMessages, refreshMessages } = useChatMessages(selectedSession?.id);
  const [chatInput, setChatInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showLongQuotaExceeded, setShowLongQuotaExceeded] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [streamingMessage, setStreamingMessage] = useState('');
  const supportsImage = ['gpt-4o', 'gpt-4o-mini-2024-07-18', 'dall-e-3'].includes(selectedModel);

  // Fonction pour ajouter des espaces entre les mots
  function addSpacesToText(text) {
    return text
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Insère un espace entre une minuscule et une majuscule
      .replace(/([0-9])([A-Z])/g, '$1 $2') // Insère un espace entre un chiffre et une majuscule
      .replace(/\s+/g, ' ') // Remplace les espaces multiples par un seul espace
      .trim();
  }

  // Faire défiler vers le bas
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Effet pour vérifier si nous sommes proches du bas et faire défiler automatiquement
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 200;
      if (isNearBottom || messages.length === 0) scrollToBottom();
    }
  }, [messages, streamingMessage]);

  // Gestion du défilement pour afficher le bouton "Retour en haut"
  const handleScroll = (e) => {
    const scrollTop = e.target.scrollTop;
    setShowScrollTop(scrollTop > 300);
  };

  // Gestion de l'envoi de messages
  const handleSendMessage = async (image) => {
    if (!chatInput.trim() && !image) {
      alert("Le message ne peut pas être vide sans texte ni image.");
      return;
    }

    setSending(true);
    const userText = chatInput.trim();
    setChatInput('');

    let currentSessionId = selectedSession?.id;

    try {
      // Vérification du quota long
      let longQuotaNeeded = userText.length >= 10000
        ? userText.length <= 15000 ? 1 : 1 + Math.ceil((userText.length - 15000) / 10000)
        : 0;

      if (longQuotaNeeded > 0 && quotaInfo.longRemaining < longQuotaNeeded) {
        setShowLongQuotaExceeded(true);
        setSending(false);
        return;
      }

      if (longQuotaNeeded > 0) {
        const longQuotaResponse = await fetch('/api/quota/long', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: selectedModel, count: longQuotaNeeded }),
          credentials: 'include',
        });

        if (!longQuotaResponse.ok) throw new Error('Erreur de quota long');
      }

      // Décrémenter le quota standard
      const quotaResponse = await fetch('/api/quota/decrement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: selectedModel }),
        credentials: 'include',
      });

      if (!quotaResponse.ok) throw new Error('Erreur de quota');

      refreshQuota();

      // Création d'une nouvelle session si aucune n'est sélectionnée
      if (!currentSessionId) {
        const sessionName = userText.length > 0
          ? (userText.length > 30 ? userText.slice(0, 27) + '...' : userText)
          : 'Image Chat';

        const newSession = await createSession(sessionName);
        if (!newSession) {
          alert("Erreur lors de la création de la session.");
          setSending(false);
          return;
        }

        setSelectedSession(newSession);
        currentSessionId = newSession.id;
      }

      // Envoi du message utilisateur
      const userMessage = {
        sessionId: currentSessionId,
        role: 'user',
        message: userText || '[Image envoyée]',
        image: image || null,
        provider: selectedProvider,
      };


      await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userMessage),
        credentials: 'include',
      });

      // Génération de la réponse du bot
      const generateResponse = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          model: selectedModel,
          prompt: userText || 'Décris cette image',
          sessionId: currentSessionId,
          image: image || null,
          stream: true,
        }),
        credentials: 'include',
      });

      if (!generateResponse.ok) {
        const errorText = await generateResponse.text();
        throw new Error(`Erreur lors de la génération: ${errorText}`);
      }

      if (generateResponse.body) {
        const reader = generateResponse.body.getReader();
        let botText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const content = line.replace('data: ', '').trim();
              if (content) {
                botText += content;
                setStreamingMessage(addSpacesToText(botText)); // Appliquer la fonction ici
              }
            }
          }
        }

        // Appliquer la fonction avant d'envoyer le message final
        const formattedBotText = addSpacesToText(botText.trim());

        const botMessage = {
          sessionId: currentSessionId,
          role: 'bot',
          message: formattedBotText, // Utiliser le texte formaté
          provider: selectedProvider,
        };

        await fetch('/api/chat/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(botMessage),
          credentials: 'include',
        });
      }

      // Rafraîchir les messages après l'envoi
      refreshMessages();
      setStreamingMessage('');
    } catch (error) {

      // Envoi d'un message d'erreur si nécessaire
      await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSessionId,
          role: 'bot',
          message: `Désolé, une erreur s'est produite: ${error.message}`,
          provider: selectedProvider,
        }),
        credentials: 'include',
      });

      refreshMessages(); // Rafraîchir même en cas d'erreur
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-b from-gray-800 to-gray-900 text-gray-100">
      {/* Menu latéral */}
      <LeftMenu
        user={user}
        sessions={sessions}
        selectedSession={selectedSession}
        onSelectSession={(session) => {
          setSelectedSession(session);
          setMessages([]); // Réinitialiser les messages lors du changement de session
        }}
        onCreateSession={async (name) => {
          if (sessions.length >= 100) return alert("Maximum de sessions atteint (100).");
          const newSession = await createSession(name);
          if (newSession) {
            setSelectedSession(newSession);
            setMessages([]);
          }
        }}
        onDeleteSession={async (id) => {
          await deleteSession(id);
          if (selectedSession?.id === id) {
            setSelectedSession(null);
            setMessages([]);
          }
        }}
        selectedProvider={selectedProvider}
        selectedModel={selectedModel}
        onProviderChange={setSelectedProvider}
        onModelChange={setSelectedModel}
        quotaInfo={quotaInfo}
        onLogout={onLogout}
        onRequestChangePassword={() => setShowChangePasswordModal(true)}
        role={role}
      />

      {/* Interface principale */}
      <div className="flex-1 flex flex-col">
        <Header user={user} onDashboard={onDashboard} />
        <div
          ref={messagesContainerRef}
          className="flex-1 p-6 overflow-y-auto custom-scrollbar scrollbar-thin scrollbar-thumb-gray-700"
          onScroll={handleScroll}
        >
          {loadingMessages ? (
            <p className="text-center text-gray-400">Chargement des messages...</p>
          ) : messages.length > 0 || streamingMessage ? (
            <>
              <div className="text-center mb-4">
                <button
                  onClick={loadMoreMessages}
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
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              {streamingMessage && (
                <ChatMessage
                  key="streaming"
                  message={{ role: 'bot', message: streamingMessage, provider: selectedProvider }}
                />
              )}
            </>
          ) : (
            <p className="text-center text-gray-500">Aucun message pour cette session.</p>
          )}
          <div ref={messagesEndRef} />
          {showScrollTop && (
            <button
              onClick={scrollToBottom}
              className="fixed bottom-20 right-6 p-3 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition"
            >
              ↑
            </button>
          )}
        </div>
        <div className="p-4 border-t border-gray-700">
          <ChatInput
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onSend={handleSendMessage}
            loading={sending}
            quotaExhausted={quotaInfo.remaining <= 0}
            supportsImage={supportsImage}
          />
        </div>
      </div>

      {/* Modales */}
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

export default ChatInterface;