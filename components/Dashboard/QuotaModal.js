// components/QuotaModal.jsx
'use client';
import React from 'react';

export default function QuotaModal({
  user,
  onClose,
  onSaveQuotas,
  setQuotaModalUser,
  onShowToast
}) {
  const handleChange = (index, value) => {
    const updatedQuotas = [...user.quotas];
    updatedQuotas[index].max_requests = parseInt(value, 10) || 0;
    setQuotaModalUser({ ...user, quotas: updatedQuotas });
  };

  const handleDelete = (index) => {
    const updatedQuotas = user.quotas.filter((_, i) => i !== index);
    setQuotaModalUser({ ...user, quotas: updatedQuotas });
    onShowToast("IA supprimée avec succès !", "success");
  };

  const handleSave = async () => {
    try {
      const response = await fetch('/api/quota/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quotas: user.quotas })
      });
      const data = await response.json();
      if (data.success) {
        onShowToast("Quota mis à jour avec succès !", "success");
        onSaveQuotas();
      } else {
        onShowToast("Erreur lors de la mise à jour du quota.", "error");
      }
    } catch (error) {
      onShowToast("Erreur serveur lors de la mise à jour.", "error");
    }
  };

  const handleReset = async () => {
    try {
      const response = await fetch(`/api/quota/reset-manual?userId=${user.id}`, {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        onShowToast("Quota réinitialisé avec succès !", "success");
        onSaveQuotas();
      } else {
        onShowToast("Erreur lors de la réinitialisation du quota.", "error");
      }
    } catch (err) {
      onShowToast("Erreur serveur lors de la réinitialisation.", "error");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md shadow-lg">
        <h2 className="text-2xl font-bold text-gray-200 mb-6">
          Gérer les quotas de <span className="text-blue-300">{user.username}</span>
        </h2>

        {/* Conteneur défilable en cas de trop d'éléments */}
        <div className="mb-6 space-y-4 max-h-80 overflow-y-auto">
          {user.quotas?.map((q, index) => (
            <div key={q.model_name} className="flex flex-col gap-1 border-b border-gray-700 pb-2">
              <div className="flex items-center justify-between">
                <label className="w-40 text-gray-200 font-medium">
                  {q.model_name} :
                </label>
                <span className="text-gray-400 text-sm">
                  Déjà effectué : {q.request_count ?? 0} requêtes
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  className="bg-gray-700 text-white rounded px-3 py-2 flex-1"
                  value={q.max_requests}
                  onChange={(e) => handleChange(index, e.target.value)}
                  min="0"
                />
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
