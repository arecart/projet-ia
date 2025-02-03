'use client';
import { useState } from 'react';

export default function AddUserModal({ onClose, refreshUsers, onShowToast }) {
  const [userData, setUserData] = useState({
    username: '',
    password: '',
    role: 'user',
    is_active: true, // Par défaut, l'utilisateur est activé
    quotas: [
      { model_name: 'gpt-3.5-turbo', max_requests: 100 },
      { model_name: 'mistral-small-latest', max_requests: 250 },
      { model_name: 'codestral-latest', max_requests: 150 },
      { model_name: 'o3-mini-2025-01-31', max_requests: 50 },
    ],
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/users/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (!res.ok) {
        throw new Error("Erreur lors de l'ajout de l'utilisateur");
      }
      await refreshUsers();
      onShowToast("Utilisateur ajouté avec succès !", "success");
      onClose();
    } catch (error) {
      onShowToast("Erreur lors de l'ajout de l'utilisateur.", "error");
    }
  };

  const handleQuotaChange = (index, value) => {
    const updatedQuotas = userData.quotas.map((quota, i) =>
      i === index ? { ...quota, max_requests: parseInt(value, 10) || 0 } : quota
    );
    setUserData({ ...userData, quotas: updatedQuotas });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md shadow-lg">
        <h2 className="text-xl font-bold text-gray-200 mb-4">Ajouter un utilisateur</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-200 mb-2">Nom d’utilisateur</label>
            <input
              type="text"
              value={userData.username}
              onChange={(e) =>
                setUserData({ ...userData, username: e.target.value })
              }
              className="w-full bg-gray-700 text-white rounded px-3 py-2"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-200 mb-2">Mot de passe</label>
            <input
              type="password"
              value={userData.password}
              onChange={(e) =>
                setUserData({ ...userData, password: e.target.value })
              }
              className="w-full bg-gray-700 text-white rounded px-3 py-2"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-200 mb-2">Rôle</label>
            <select
              value={userData.role}
              onChange={(e) =>
                setUserData({ ...userData, role: e.target.value })
              }
              className="w-full bg-gray-700 text-white rounded px-3 py-2"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="mb-4 flex items-center">
            <label className="block text-gray-200 mr-2">Activé</label>
            <input
              type="checkbox"
              checked={userData.is_active}
              onChange={(e) =>
                setUserData({ ...userData, is_active: e.target.checked })
              }
              className="accent-green-500"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-200 mb-2">Quotas par modèle</label>
            {userData.quotas.map((quota, index) => (
              <div key={quota.model_name} className="flex items-center gap-2 mb-2">
                <span className="text-sm text-gray-400">{quota.model_name}:</span>
                <input
                  type="number"
                  value={quota.max_requests}
                  onChange={(e) => handleQuotaChange(index, e.target.value)}
                  className="w-full bg-gray-700 text-white rounded px-3 py-2"
                  min="0"
                  required
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-gray-100"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Ajouter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
