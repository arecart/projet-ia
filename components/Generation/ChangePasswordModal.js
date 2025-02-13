'use client';
import React, { useState } from 'react';

export default function ChangePasswordModal({ onClose, onShowToast, userId }) {
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Mise à jour des champs du formulaire
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { oldPassword, newPassword, confirmNewPassword } = formData;
  
    // Vérification de la saisie
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      setErrorMsg("Tous les champs sont requis.");
      return;
    }
  
    if (newPassword !== confirmNewPassword) {
      setErrorMsg("Les nouveaux mots de passe ne correspondent pas.");
      return;
    }
  
    setLoading(true);
    try {
      const res = await fetch(`/api/users/modify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        // Ici, on peut omettre userId puisque le serveur utilisera le token
        body: JSON.stringify({ oldPassword, newPassword }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors du changement de mot de passe.");
      }
      setSuccessMsg("Mot de passe changé avec succès !");
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };
  

  // Ferme la modale si l'utilisateur clique sur l'overlay
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity"
      onClick={handleOverlayClick}
    >
      <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md shadow-2xl mx-4 animate-fadeIn">
        <h2 className="text-2xl font-bold text-gray-200 mb-6 text-center">
          Changer le mot de passe
        </h2>

        {/* Notifications */}
        {errorMsg && (
          <div className="mb-4 p-2 bg-red-600 text-white rounded">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-2 bg-green-600 text-white rounded">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">
              Ancien mot de passe
            </label>
            <input
              type="password"
              value={formData.oldPassword}
              onChange={(e) => handleInputChange("oldPassword", e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-300 mb-2">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              value={formData.newPassword}
              onChange={(e) => handleInputChange("newPassword", e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-300 mb-2">
              Confirmer le nouveau mot de passe
            </label>
            <input
              type="password"
              value={formData.confirmNewPassword}
              onChange={(e) =>
                handleInputChange("confirmNewPassword", e.target.value)
              }
              className="w-full px-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors focus:outline-none"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors focus:outline-none"
            >
              {loading ? 'Envoi...' : 'Changer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
