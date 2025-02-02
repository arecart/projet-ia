// ChatInterface.js
import React, { useState, useEffect, useRef } from 'react';
import ProviderSelector from './ProviderSelector';

// --------------------------
// Composant : Header (affiché dans la zone principale si besoin)
// --------------------------
function Header({ user, onDashboard }) {
  return (
    <div className="p-4 border-b border-gray-700 flex items-center justify-between">
      <h2 className="text-2xl font-bold">Bonjour - {user.username}</h2>
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

// --------------------------
// Composant : QuotaDisplay
// --------------------------
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

// --------------------------
// Composant : ChatMessage
// --------------------------
function ChatMessage({ message }) {
  const isUser = message.role === 'user';

  // Par défaut, afficher le message tel quel.
  // Pour les messages du bot, on s'attend à ce que le message contienne une ligne de séparation
  // avec le nom du modèle au format : <MODEL>nom_du_modèle</MODEL>
  let displayText = message.message;
  let modelName = null;
  if (!isUser) {
    const regex = /^(.*)\n<MODEL>(.*)<\/MODEL>$/s;
    const match = message.message.match(regex);
    if (match) {
      displayText = match[1];
      modelName = match[2];
    }
  }

  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(displayText);
      } else {
        // Fallback si l'API Clipboard n'est pas disponible
        const textArea = document.createElement("textarea");
        textArea.value = displayText;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erreur de copie:', error);
    }
  };

  return (
    <div className={`mb-4 flex ${isUser ? 'justify-end' : 'justify-start'} relative`}>
      <div className={`max-w-[70%] p-3 rounded-md ${isUser ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-200'} relative`}>
        {/* Bouton Copier positionné en haut à droite avec un léger décalage pour éviter la collision */}
        {!isUser && (
          <button
            onClick={handleCopy}
            style={{ bottom: '4px', right: '4px' }}
            className="absolute text-xs text-gray-400 hover:text-gray-200 p-1"
          >
            {copied ? '✔️' : '📋'}
          </button>
        )}
        <p className="whitespace-pre-wrap">{displayText}</p>
        {/* Affichage en petit du nom du modèle, si présent */}
        {!isUser && modelName && (
          <p className="mt-1 text-xs text-gray-500 italic">— {modelName}</p>
        )}
      </div>
    </div>
  );
}


// --------------------------
// Composant : ChatInput
// --------------------------
function ChatInput({ value, onChange, onSend, loading, quotaExhausted }) {
  return (
    <div className="flex gap-2 mt-4">
      <textarea
        value={value}
        onChange={onChange}
        placeholder="Votre message..."
        className="flex-1 p-3 border rounded-md bg-gray-800 text-white placeholder-gray-400 min-h-[50px] transition duration-300 custom-scrollbar scrollbar-hide"
        maxLength="1000"
      ></textarea>
      <button
        onClick={onSend}
        disabled={loading || quotaExhausted || !value.trim()}
        className={`px-4 py-3 rounded-md transition duration-300 ${
          loading || quotaExhausted || !value.trim()
            ? 'bg-gray-600 cursor-not-allowed'
            : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800'
        } text-white`}
      >
        {loading ? 'Envoi...' : quotaExhausted ? 'Quota épuisé' : 'Envoyer'}
      </button>
    </div>
  );
}

// --------------------------
// Composant : LeftMenu
// --------------------------
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
  role
}) {
  // État pour la confirmation de suppression
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  return (
    <div className="w-1/4 bg-gray-800 text-white p-4 h-screen sticky top-0 flex flex-col justify-between overflow-y-auto scrollbar-hide">
      {/* Partie supérieure : Quota */}
      <div>
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">Quota</h3>
          <QuotaDisplay quotaInfo={quotaInfo} />
        </div>

        {/* Partie centrale : Sessions et ProviderSelector */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">Sessions</h3>
          <div className="space-y-2">
            {sessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between">
                <button
                  onClick={() => {
                    setConfirmDeleteId(null);
                    onSelectSession(session);
                  }}
                  className={`w-full text-left p-2 rounded-md transition-colors duration-300 ${
                    selectedSession && selectedSession.id === session.id
                      ? 'bg-purple-600'
                      : 'bg-gray-700 hover:bg-gray-600'
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
          <div className="mt-4">
            <input
              type="text"
              placeholder="Nom de la session..."
              className="w-full p-2 border rounded-md bg-gray-700 text-white placeholder-gray-400"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                  onCreateSession(e.target.value.trim());
                  e.target.value = '';
                }
              }}
            />
            <button
              onClick={(e) => {
                const input = e.currentTarget.previousSibling;
                if (input.value.trim()) {
                  onCreateSession(input.value.trim());
                  input.value = '';
                }
              }}
              className="w-full mt-2 px-3 py-2 bg-green-600 hover:bg-green-700 rounded-md transition duration-300"
            >
              Nouvelle session
            </button>
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

      {/* Partie inférieure : Bouton Déconnexion */}
      <div>
        <button
          onClick={onLogout}
          className="w-full px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-md shadow-md transition duration-300"
        >
          Déconnexion
        </button>
      </div>
    </div>
  );
}

// --------------------------
// Hook : useSessions
// --------------------------
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

// --------------------------
// Hook : useChatMessages
// --------------------------
function useChatMessages(sessionId) {
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const fetchMessages = async () => {
    if (!sessionId) return;
    setLoadingMessages(true);
    try {
      const response = await fetch(`/api/chat/message?sessionId=${sessionId}`);
      if (!response.ok) throw new Error('Erreur lors de la récupération des messages');
      const { messages: data } = await response.json();
      setMessages(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 60000);
    return () => clearInterval(interval);
  }, [sessionId]);

  return { messages, loadingMessages, setMessages };
}

// --------------------------
// Hook : useQuota
// --------------------------
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
      console.error('Erreur de quota:', error);
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

// --------------------------
// Composant principal : ChatInterface
// --------------------------
export default function ChatInterface({ onLogout, onDashboard, role = 'user' }) {
  // Simulation de l'utilisateur connecté (à remplacer par votre système d'authentification)
  const user = { id: 1, username: 'admin' }; // Exemple : "admin" ou "user"
  const [selectedProvider, setSelectedProvider] = useState('gpt');
  const [selectedModel, setSelectedModel] = useState('gpt-3.5-turbo'); // Le nom complet du modèle
  const { quotaInfo, refreshQuota } = useQuota(user.id, selectedModel);
  const { sessions, createSession, deleteSession } = useSessions(user.id);
  const [selectedSession, setSelectedSession] = useState(null);
  const { messages, loadingMessages, setMessages } = useChatMessages(selectedSession ? selectedSession.id : null);
  const [chatInput, setChatInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

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
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    setSending(true);
    const userText = chatInput.trim();
    setChatInput('');

    // Si aucune session n'est sélectionnée, créer une session avec le message comme nom
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
      // Décrémenter le quota
      const quotaResponse = await fetch('/api/quota/decrement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: selectedModel }),
        credentials: 'include',
      });
      if (!quotaResponse.ok) {
        const errorData = await quotaResponse.json();
        console.error(errorData.error || 'Quota dépassé');
        setSending(false);
        return;
      }
      refreshQuota();

      // Envoyer le message utilisateur
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

      // Constitution du contexte de conversation à partir de l'historique
      const conversationHistory = messages
        .map(m => `${m.role}: ${m.message}`)
        .join('\n');

      // Appeler l'API de génération
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

      // Construire le message du bot en ajoutant le nom complet du modèle via des balises
      const botText = `${result.text}\n<MODEL>${selectedModel}</MODEL>`;

      // Envoyer le message du bot
      await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSessionId,
          role: 'bot',
          message: botText,
        }),
        credentials: 'include',
      });

      // Actualiser l'historique des messages
      const response = await fetch(`/api/chat/message?sessionId=${currentSessionId}`);
      if (response.ok) {
        const { messages: newMessages } = await response.json();
        setMessages(newMessages);
      }
    } catch (error) {
      console.error(error);
      // En cas d'erreur, envoyer un message d'erreur du bot
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
      {/* Menu de gauche fixe */}
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
        role={role}
      />

      {/* Zone principale du chat */}
      <div className="w-3/4 flex flex-col">
        <Header user={user} onDashboard={onDashboard} />
        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar scrollbar-hide">
          {loadingMessages ? (
            <p>Chargement des messages...</p>
          ) : (
            messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)
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
    </div>
  );
}
