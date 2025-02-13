'use client';
import React from 'react';
import { createPortal } from 'react-dom';

function SettingsMenu({ onClose, onLogout, onRequestChangePassword, handleDeleteAllSessions, confirmDeleteAll, setConfirmDeleteAll }) {
  const menuContent = (
    <div className="fixed inset-0 z-[11000] flex items-center justify-center">
      {/* Fond semi-transparent cliquable pour fermer la modale */}
      <div
        className="absolute inset-0 bg-black opacity-70 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Conteneur de la modale */}
      <div className="bg-gray-900 rounded-lg shadow-2xl p-6 relative z-50 max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
        {/* Bouton de fermeture */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-200 transition-colors"
          title="Fermer"
        >
          ✕
        </button>

        <h3 className="text-2xl font-bold text-gray-100 mb-6 text-center">
          Paramètres
        </h3>

        {confirmDeleteAll ? (
          <div className="flex flex-col gap-3 mb-6">
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
            className="w-full mb-6 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-md shadow-md transition duration-300"
          >
            Supprimer toutes les sessions
          </button>
        )}

        <button
          onClick={() => {
            onRequestChangePassword();
            onClose();
          }}
          className="w-full mb-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow-md transition duration-300"
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

export default SettingsMenu;
