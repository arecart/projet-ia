// components/QuotaModal.jsx
'use client';
import React from 'react';

export default function QuotaModal({ user, onClose, onSaveQuotas, setQuotaModalUser }) {
  // user est une copie de l’utilisateur, contenant user.quotas

  const handleChange = (index, value) => {
    const updatedQuotas = [...user.quotas];
    updatedQuotas[index].max_requests = parseInt(value, 10) || 0;
    setQuotaModalUser({ ...user, quotas: updatedQuotas });
  };

  const handleSave = async () => {
    try {
      // Appel de l'endpoint PUT pour mettre à jour uniquement max_requests
      const response = await fetch('/api/quota/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quotas: user.quotas })
      });
      const data = await response.json();
      if (data.success) {
        alert("Quota mis à jour avec succès !");
        onSaveQuotas(); // Rafraîchit les données de l'utilisateur
      } else {
        alert("Erreur lors de la mise à jour du quota.");
      }
    } catch (error) {
      console.error(error);
      alert("Erreur serveur lors de la mise à jour.");
    }
  };

  const handleReset = async () => {
    try {
      const response = await fetch(`/api/quota/reset-manual?userId=${user.id}`, {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        alert("Quota réinitialisé avec succès !");
        onSaveQuotas(); 
      } else {
        alert("Erreur lors de la réinitialisation du quota.");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur serveur lors de la réinitialisation.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md shadow-lg">
        <h2 className="text-2xl font-bold text-gray-200 mb-6">
          Gérer les quotas de <span className="text-blue-300">{user.username}</span>
        </h2>

        <div className="mb-6 space-y-4">
          {user.quotas?.map((q, index) => (
            <div key={q.model_name} className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="w-40 text-gray-200 font-medium">{q.model_name} :</label>
                <span className="text-gray-400 text-sm">
                  Déjà effectué : {q.request_count ?? 0} requêtes
                </span>
              </div>
              <input
                type="number"
                className="bg-gray-700 text-white rounded px-3 py-2"
                value={q.max_requests}
                onChange={(e) => handleChange(index, e.target.value)}
                min="0"
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-300 hover:text-gray-100 border border-gray-500 rounded transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
          >
            Réinitialiser le quota
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
          >
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
}
