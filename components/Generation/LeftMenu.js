'use client';
import React, { useState } from 'react';
import ProviderSelector from './AISelector';
import QuotaDisplay from './QuotaDisplay';
import SettingsMenu from './SettingsMenu';

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
    <div className="w-80 bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4 h-screen sticky top-0 flex flex-col justify-between overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600">
      <div>
        <div className="mb-6">
          <QuotaDisplay quotaInfo={quotaInfo} />
        </div>
        <div className="mb-6">
          <h3 className="text-2xl font-bold mb-3 border-b border-gray-600 pb-2">Sessions</h3>
          <div className="space-y-2">
            {displayedSessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between bg-gray-700 rounded-md p-2 hover:bg-gray-600 transition-colors">
                <button
                  onClick={() => {
                    setConfirmDeleteId(null);
                    onSelectSession(session);
                  }}
                  className={`flex-1 text-left font-medium transition-colors duration-200 ${
                    selectedSession && selectedSession.id === session.id ? 'text-purple-300' : 'text-white'
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
                      className="p-1 bg-red-700 hover:bg-red-800 rounded transition-colors"
                      title="Confirmer la suppression"
                    >
                      ✔
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="p-1 bg-gray-600 hover:bg-gray-500 rounded transition-colors"
                      title="Annuler"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(session.id)}
                    className="ml-2 p-1 bg-red-500 hover:bg-red-600 rounded transition-colors"
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
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nom de la session..."
                disabled={!canCreateSession}
                className={`flex-1 p-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 transition duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 ${!canCreateSession ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                className={`px-3 py-2 bg-green-600 hover:bg-green-700 rounded-md transition duration-300 ${!canCreateSession ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Créer une nouvelle session"
              >
                +
              </button>
            </div>
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
          className="p-2 bg-gray-700 rounded-full hover:bg-gray-600 transition transform hover:scale-110"
          title="Paramètres"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
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

export default LeftMenu;
