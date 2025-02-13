'use client';
import React from 'react';

export default function QuotaModal({
  user,
  onClose,
  onSaveQuotas,
  setQuotaModalUser,
  onShowToast,
}) {
  // Mise à jour d'un champ (normal ou long) pour un quota donné
  const handleChange = (index, field, value) => {
    const updatedQuotas = user.quotas.map((q, i) =>
      i === index ? { ...q, [field]: parseInt(value, 10) } : q
    );
    setQuotaModalUser({ ...user, quotas: updatedQuotas });
  };

  const handleDelete = (index) => {
    const updatedQuotas = user.quotas.filter((_, i) => i !== index);
    setQuotaModalUser({ ...user, quotas: updatedQuotas });
    onShowToast("Modèle supprimé avec succès !", "success");
  };

  // Sauvegarde les modifications apportées aux quotas via l'endpoint d'update
  const handleSave = async () => {
    try {
      const response = await fetch('/api/quota/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, quotas: user.quotas }),
      });
      const data = await response.json();
      if (data.success) {
        onShowToast("Quotas mis à jour avec succès !", "success");
        onSaveQuotas();
      } else {
        onShowToast("Erreur lors de la mise à jour des quotas.", "error");
      }
    } catch (error) {
      onShowToast("Erreur serveur lors de la mise à jour.", "error");
    }
  };
  

  // Réinitialise uniquement le quota actuel via l'ancien endpoint reset-manual
  const handleReset = async () => {
    try {
      const response = await fetch(`/api/quota/reset-manual?userId=${user.id}`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        onShowToast("Quota actuel réinitialisé avec succès !", "success");
        onSaveQuotas();
      } else {
        onShowToast("Erreur lors de la réinitialisation des quotas.", "error");
      }
    } catch (err) {
      onShowToast("Erreur serveur lors de la réinitialisation.", "error");
    }
  };

  // Réinitialise tous les quotas IA via l'endpoint users/reset-models
  const handleResetModels = async () => {
    try {
      const response = await fetch('/api/users/reset-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await response.json();
      if (data.success) {
        onShowToast(data.message || "Tous les quotas IA réinitialisés avec succès !", "success");
        onSaveQuotas();
      } else {
        onShowToast(data.error || "Erreur lors de la réinitialisation des quotas IA.", "error");
      }
    } catch (err) {
      onShowToast("Erreur serveur lors de la réinitialisation.", "error");
    }
  };

  // Ferme le modal en cliquant sur l'overlay
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fadeIn"
      onClick={handleOverlayClick}
    >
      <div className="bg-gray-800 p-8 rounded-lg w-full max-w-lg shadow-2xl relative">
        {/* Bouton de fermeture */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-300 hover:text-gray-100 text-xl"
          title="Fermer"
        >
          ✕
        </button>
        <h2 className="text-3xl font-bold text-gray-200 mb-8">
          Gérer les quotas de <span className="text-blue-300">{user.username}</span>
        </h2>

        {/* Liste des quotas */}
        <div className="mb-8 space-y-4 max-h-96 overflow-y-auto">
          {user.quotas?.map((q, index) => (
            <div
              key={q.model_name}
              className="flex items-center justify-between border-b border-gray-700 pb-3"
            >
              <div className="w-56 text-gray-200 font-medium">
                {q.model_name}/long
              </div>
              <div className="flex items-center gap-4 w-full">
                <div className="flex flex-col">
                  <label className="text-xs text-gray-400">Normal</label>
                  <input
                    type="number"
                    className="bg-gray-700 text-white rounded px-3 py-2 w-24 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    value={q.max_requests ?? ''}
                    onChange={(e) => handleChange(index, 'max_requests', e.target.value)}
                    min="0"
                    placeholder="Normal"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-gray-400">Long</label>
                  <input
                    type="number"
                    className="bg-gray-700 text-white rounded px-3 py-2 w-24 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    value={q.max_long_requests ?? ''}
                    onChange={(e) => handleChange(index, 'max_long_requests', e.target.value)}
                    min="0"
                    placeholder="Long"
                  />
                </div>
                <button
                  onClick={() => handleDelete(index)}
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Boutons d'action */}
        <div className="flex flex-col sm:flex-row justify-end gap-4">
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
            Réinitialiser le quota actuel
          </button>
          <button
            onClick={handleResetModels}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
          >
            Mettre à jour
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
          >
            Sauvegarder
          </button>
        </div>
      </div>
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        @keyframes zoomInContent {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-zoomInContent {
          animation: zoomInContent 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
