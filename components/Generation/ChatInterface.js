'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import ProviderSelector from './AISelector';
import ChangePasswordModal from './ChangePasswordModal';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';

// ==========================
// Composant : Header
// ==========================
function Header({ user, onDashboard }) {
  return (
    <div className="p-4 border-b border-gray-700 flex items-center justify-between">
      {onDashboard && (
        <button
          onClick={onDashboard}
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-md shadow-md transition duration-300"
        >
          Dashboard
        </button>
      )}
    </div>
  );
}

// ==========================
// Composant : QuotaDisplay
// ==========================
function QuotaDisplay({ quotaInfo }) {
  const { current, max, remaining } = quotaInfo;
  return (
    <div className="p-2 bg-gray-700 rounded-md">
      <div className="text-sm">
        Quota: {remaining} / {max}
      </div>
      <div className="mt-1 w-full bg-gray-600 rounded-full h-2">
        <div
          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
          style={{ width: `${(current / max) * 100}%` }}
        />
      </div>
    </div>
  );
}

// ==========================
// Composant : CodeBlock
// ==========================
function CodeBlock({ className, children }) {
  const [copied, setCopied] = useState(false);
  const language = className ? className.replace('language-', '') : '';

  const handleCopy = async () => {
    try {
      // Vérification de l'existence de navigator.clipboard et de sa méthode writeText
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(children.trim());
      } else {
        // Fallback : création d'un textarea pour copier le texte
        const textArea = document.createElement('textarea');
        textArea.value = children.trim();
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Erreur lors de la copie du code :", error);
    }
  };

  return (
    <div className="relative my-2">
      <pre className={`bg-gray-800 text-gray-100 p-4 rounded-md overflow-auto ${className}`}>
        <code className={className}>{children}</code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 bg-gray-700 text-white px-2 py-1 text-xs rounded hover:bg-gray-600"
        title="Copier le code"
      >
        {copied ? '✔️ Copié' : '📋 Copier'}
      </button>
    </div>
  );
}

// ==========================
// Composant : ChatMessage
// ==========================
function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  let displayText = message.message;
  let modelName = null;

  // Si le message provient du bot, on extrait éventuellement le nom du modèle via une balise <MODEL>
  if (!isUser) {
    const regex = /^(.*)\n<MODEL>(.*)<\/MODEL>$/s;
    const match = displayText.match(regex);
    if (match) {
      displayText = match[1];
      modelName = match[2];
    }
  }

  const [copied, setCopied] = useState(false);
  const handleCopyMessage = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(displayText);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = displayText;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Erreur lors de la copie du message :", error);
    }
  };

  return (
    <div className={`mb-4 flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] p-3 rounded-md ${isUser ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-200'} relative`}>
        {!isUser && (
          <button
            onClick={handleCopyMessage}
            className="absolute top-2 right-2 text-xs text-gray-400 hover:text-gray-200 p-1"
            title="Copier le message"
          >
            {copied ? '✔️' : '📋'}
          </button>
        )}
        <ReactMarkdown
          className="whitespace-pre-wrap"
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeSanitize, rehypeHighlight]}
          components={{
            code({ node, inline, className, children, ...props }) {
              if (inline) {
                return (
                  <code className={`bg-gray-700 text-white p-1 rounded ${className}`} {...props}>
                    {children}
                  </code>
                );
              }
              return <CodeBlock className={className} {...props}>{children}</CodeBlock>;
            }
          }}
        >
          {displayText}
        </ReactMarkdown>
        {!isUser && modelName && (
          <p className="mt-1 text-xs text-gray-500 italic">— {modelName}</p>
        )}
      </div>
    </div>
  );
}

// ==========================
// Composant : ChatInput
// ==========================
function ChatInput({ value, onChange, onSend, loading, quotaExhausted }) {
  const maxChars = 50000;
  const remainingChars = maxChars - value.length;

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="flex flex-col gap-2 mt-4">
      <div className="flex gap-2">
        <textarea
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          placeholder="Votre message..."
          maxLength={maxChars}
          className="flex-1 p-3 border rounded-md bg-gray-800 text-white placeholder-gray-400 min-h-[50px] transition duration-300 custom-scrollbar scrollbar-hide"
        ></textarea>
        <button
          onClick={onSend}
          disabled={loading || quotaExhausted || !value.trim() || value.length > maxChars}
          className={`px-4 py-3 rounded-md transition duration-300 ${
            loading || quotaExhausted || !value.trim() || value.length > maxChars
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800'
          } text-white`}
        >
          {loading ? 'Envoi...' : quotaExhausted ? 'Quota épuisé' : 'Envoyer'}
        </button>
      </div>
      <div className="text-xs text-gray-400 text-right">
        {remainingChars} caractères restants
      </div>
    </div>
  );
}

// ==========================
// Composant : SettingsMenu (menu des paramètres via Portal)
// ==========================
function SettingsMenu({ onClose, onLogout, onRequestChangePassword, handleDeleteAllSessions, confirmDeleteAll, setConfirmDeleteAll }) {
  const menuContent = (
    <div className="fixed inset-0 z-[11000] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black opacity-70"
        onClick={onClose}
      ></div>
      <div className="bg-gray-900 rounded-lg shadow-xl p-4 relative z-50">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-200"
          title="Fermer"
        >
          ✕
        </button>
        <h3 className="text-xl font-semibold text-gray-100 mb-4 text-center">
          Paramètres
        </h3>
        {confirmDeleteAll ? (
          <div className="flex flex-col gap-2 mb-4">
            <button
              onClick={handleDeleteAllSessions}
              className="w-full px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-md shadow-md transition duration-300"
            >
              Confirmer la suppression
            </button>
            <button
              onClick={() => setConfirmDeleteAll(false)}
              className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-md transition duration-300"
            >
              Annuler
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDeleteAll(true)}
            className="w-full mb-4 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-md shadow-md transition duration-300"
          >
            Supprimer toutes les sessions
          </button>
        )}
        <button
          onClick={() => {
            onRequestChangePassword();
            onClose();
          }}
          className="w-full mb-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow-md transition duration-300"
        >
          Changer le mot de passe
        </button>
        <button
          onClick={onLogout}
          className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md shadow-md transition duration-300"
        >
          Déconnexion
        </button>
      </div>
    </div>
  );
  return createPortal(menuContent, document.body);
}

// ==========================
// Composant : LeftMenu
// ==========================
function LeftMenu({ 
  user, 
  sessions, 
  selectedSession, 
  onSelectSession, 
  onCreateSession, 
  onDeleteSession, 
  selectedProvider, 
  selectedModel, 
  onProviderChange, 
  onModelChange, 
  quotaInfo, 
  onLogout,
  onRequestChangePassword,
  role
}) {
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [showAllSessions, setShowAllSessions] = useState(false);

  const displayedSessions = sessions.length > 5 && !showAllSessions ? sessions.slice(0, 5) : sessions;
  const canCreateSession = sessions.length < 100;

  const handleDeleteAllSessions = () => {
    sessions.forEach((session) => {
      onDeleteSession(session.id);
    });
    setConfirmDeleteAll(false);
    setShowSettings(false);
  };

  return (
    <div className="w-1/4 bg-gray-800 text-white p-4 h-screen sticky top-0 flex flex-col justify-between overflow-y-auto scrollbar-hide">
      <div>
        <div className="mb-6">
          <QuotaDisplay quotaInfo={quotaInfo} />
        </div>
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">Sessions</h3>
          <div className="space-y-2">
            {displayedSessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between">
                <button
                  onClick={() => {
                    setConfirmDeleteId(null);
                    onSelectSession(session);
                  }}
                  className={`w-full text-left p-2 rounded-md transition-colors duration-300 ${
                    selectedSession && selectedSession.id === session.id ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  {session.session_name || `Session ${session.id}`}
                </button>
                {confirmDeleteId === session.id ? (
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        onDeleteSession(session.id);
                        setConfirmDeleteId(null);
                      }}
                      className="p-1 bg-red-700 hover:bg-red-800 rounded"
                      title="Confirmer la suppression"
                    >
                      ✔
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="p-1 bg-gray-600 hover:bg-gray-500 rounded"
                      title="Annuler"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(session.id)}
                    className="ml-2 p-1 bg-red-500 hover:bg-red-600 rounded"
                    title="Supprimer la session"
                  >
                    🗑
                  </button>
                )}
              </div>
            ))}
          </div>
          {sessions.length > 5 && (
            <div className="mt-2 text-center">
              <button
                onClick={() => setShowAllSessions(!showAllSessions)}
                className="px-4 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-sm font-medium transition-colors"
              >
                {showAllSessions ? "Réduire la liste" : "Voir toutes les sessions"}
              </button>
            </div>
          )}
          <div className="mt-4">
            <input
              type="text"
              placeholder="Nom de la session..."
              disabled={!canCreateSession}
              className={`w-full p-2 border rounded-md bg-gray-700 text-white placeholder-gray-400 transition duration-300 ${
                !canCreateSession && 'opacity-50 cursor-not-allowed'
              }`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.value.trim() && canCreateSession) {
                  onCreateSession(e.target.value.trim());
                  e.target.value = '';
                }
              }}
            />
            <button
              onClick={(e) => {
                const input = e.currentTarget.previousSibling;
                if (input.value.trim() && canCreateSession) {
                  onCreateSession(input.value.trim());
                  input.value = '';
                }
              }}
              disabled={!canCreateSession}
              className={`w-full mt-2 px-3 py-2 bg-green-600 hover:bg-green-700 rounded-md transition duration-300 ${
                !canCreateSession && 'opacity-50 cursor-not-allowed'
              }`}
            >
              Nouvelle session
            </button>
            {!canCreateSession && (
              <p className="mt-1 text-xs text-red-400">
                Nombre maximum de sessions atteint (100)
              </p>
            )}
          </div>
          <div className="mt-6">
            <ProviderSelector
              selectedProvider={selectedProvider}
              selectedModel={selectedModel}
              onProviderChange={onProviderChange}
              onModelChange={onModelChange}
            />
          </div>
        </div>
      </div>
      <div className="flex justify-center">
        <button
          onClick={() => setShowSettings(true)}
          className="p-2 bg-gray-700 rounded-md hover:bg-gray-600 transition transform hover:scale-105"
          title="Paramètres"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm0-5c.69 0 1.332.178 1.888.488l.5.25 1.18-2.05a1 1 0 011.516 1.116l-.5 2.05 2.05.5a1 1 0 01.116 1.516l-2.05 1.18.25.5A7.978 7.978 0 0120 12c0 .69-.178 1.332-.488 1.888l-.25.5 2.05 1.18a1 1 0 01-1.116 1.516l-2.05-.5-.5 2.05A7.978 7.978 0 0112 20c-.69 0-1.332-.178-1.888-.488l-.5-.25-1.18 2.05a1 1 0 01-1.516-1.116l.5-2.05-2.05-.5a1 1 0 01-.116-1.516l2.05-1.18-.25-.5A7.978 7.978 0 014 12c0-.69.178-1.332.488-1.888l.25-.5-2.05-1.18a1 1 0 011.116-1.516l2.05.5.5-2.05A7.978 7.978 0 0112 4z"
            />
          </svg>
        </button>
      </div>
      {showSettings && (
        <SettingsMenu
          onClose={() => setShowSettings(false)}
          onLogout={onLogout}
          onRequestChangePassword={onRequestChangePassword}
          handleDeleteAllSessions={handleDeleteAllSessions}
          confirmDeleteAll={confirmDeleteAll}
          setConfirmDeleteAll={setConfirmDeleteAll}
        />
      )}
    </div>
  );
}

// ==========================
// Hook : useSessions
// ==========================
function useSessions(userId) {
  const [sessions, setSessions] = useState([]);

  const fetchSessions = async () => {
    try {
      const response = await fetch(`/api/chat/session?userId=${userId}`);
      if (!response.ok) throw new Error('Erreur lors de la récupération des sessions');
      const { sessions: data } = await response.json();
      setSessions(data);
    } catch (error) {
      console.error(error);
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
      console.error(error);
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
      console.error(error);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [userId]);

  return { sessions, fetchSessions, createSession, deleteSession };
}

// ==========================
// Hook : useChatMessages
// ==========================
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
      console.error(error);
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

// ==========================
// Hook : useQuota
// ==========================
function useQuota(userId, selectedModel) {
  const [quotaInfo, setQuotaInfo] = useState({
    current: 0,
    max: 10,
    remaining: 10,
  });

  const refreshQuota = async () => {
    try {
      const response = await fetch(`/api/quota?userId=${userId}&model=${selectedModel}`);
      if (!response.ok) throw new Error('Erreur lors de la récupération du quota');
      const data = await response.json();
      setQuotaInfo(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (userId) {
      refreshQuota();
      const interval = setInterval(refreshQuota, 60000);
      return () => clearInterval(interval);
    }
  }, [userId, selectedModel]);

  return { quotaInfo, refreshQuota };
}

// ==========================
// Composant principal : ChatInterface
// ==========================
export default function ChatInterface({ onLogout, onDashboard, role = 'user' }) {
  const user = { id: 1, username: 'admin' };

  // Chargement de l'IA favorite depuis le localStorage, ou utilisation de valeurs par défaut
  const defaultFavorite = (() => {
    const fav = localStorage.getItem('favoriteAI');
    if (fav) {
      try {
        return JSON.parse(fav);
      } catch (e) {
        console.error("Erreur lors du parsing de l'IA favorite", e);
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
  const { messages, loadingMessages, loadMoreMessages, totalMessages, setMessages } = useChatMessages(
    selectedSession ? selectedSession.id : null
  );
  const [chatInput, setChatInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

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
      console.error(error);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    if (chatInput.trim().length > 50000) {
      alert("Le message ne peut dépasser 50000 caractères.");
      return;
    }
    setSending(true);
    const userText = chatInput.trim();
    setChatInput('');

    let currentSessionId = selectedSession?.id;
    if (!currentSessionId) {
      const newSession = await createSession(userText);
      if (!newSession) {
        alert("Erreur lors de la création de la session.");
        setSending(false);
        return;
      }
      setSelectedSession(newSession);
      currentSessionId = newSession.id;
    }

    try {
      const quotaResponse = await fetch('/api/quota/decrement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: selectedModel }),
        credentials: 'include',
      });
      if (!quotaResponse.ok) {
        const errorData = await quotaResponse.json();
        alert(errorData.message || "Erreur de quota.");
        setSending(false);
        return;
      }
      refreshQuota();

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
        credentials: 'include'
      });
      if (!generateResponse.ok) throw new Error('Erreur lors de la génération');
      const result = await generateResponse.json();

      const botText = `${result.text}\n<MODEL>${selectedModel}</MODEL>`;

      await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSessionId,
          role: 'bot',
          message: botText,
        }),
        credentials: 'include'
      });

      setTimeout(async () => {
        const response = await fetch(`/api/chat/message?sessionId=${currentSessionId}&skip=0&take=20`);
        if (response.ok) {
          const { messages: newMessages } = await response.json();
          setMessages(Array.isArray(newMessages) ? newMessages : []);
        }
      }, 300);
    } catch (error) {
      console.error(error);
      await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSessionId,
          role: 'bot',
          message: "Désolé, une erreur s'est produite lors de la génération de la réponse.",
        }),
        credentials: 'include'
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
    <div className="min-h-screen bg-gray-900 text-gray-100 flex">
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
      <div className="w-3/4 flex flex-col">
        <Header user={user} onDashboard={onDashboard} />
        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar scrollbar-hide">
          {loadingMessages ? (
            <p>Chargement des messages...</p>
          ) : (
            <>
              {messages.length > 0 && (
                <div className="text-center mb-4">
                  <button
                    onClick={() => loadMoreMessages()}
                    disabled={messages.length >= totalMessages || loadingMessages}
                    className={`px-4 py-2 rounded-md ${
                      messages.length >= totalMessages || loadingMessages
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    } text-white transition-colors`}
                  >
                    {loadingMessages ? 'Chargement...' : 'Afficher les anciens messages'}
                  </button>
                </div>
              )}
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              {messages.length === 0 && (
                <p className="text-center text-gray-500">Aucun message pour cette session.</p>
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
    </div>
  );
}
