'use client';
import { useState } from 'react';

export default function AddUserModal({ onClose, refreshUsers, onShowToast }) {
  const [userData, setUserData] = useState({
    username: '',
    password: '',
    role: 'user',
    is_active: true, // L'utilisateur est activé par défaut
    quotas: [
      { model_name: 'gpt-4o-mini-2024-07-18', max_requests: 200, max_long_requests: 30 },
      { model_name: 'gpt-4o',                max_requests: 30, max_long_requests: 5 },
      { model_name: 'o1-mini-2024-09-12',      max_requests: 50,  max_long_requests: 10 },
      { model_name: 'mistral-large-latest',    max_requests: 60,  max_long_requests: 10 },
      { model_name: 'mistral-small-latest',    max_requests: 400, max_long_requests: 30 },
      { model_name: 'pixtral-large-latest',    max_requests: 60,  max_long_requests: 10 },
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

  // Mise à jour du quota normal
  const handleQuotaChange = (index, value) => {
    const updatedQuotas = userData.quotas.map((quota, i) =>
      i === index ? { ...quota, max_requests: parseInt(value, 10) || 0 } : quota
    );
    setUserData({ ...userData, quotas: updatedQuotas });
  };

  // Mise à jour du quota long
  const handleLongQuotaChange = (index, value) => {
    const updatedQuotas = userData.quotas.map((quota, i) =>
      i === index ? { ...quota, max_long_requests: parseInt(value, 10) || 0 } : quota
    );
    setUserData({ ...userData, quotas: updatedQuotas });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md shadow-2xl">
        <h2 className="text-xl font-bold text-gray-200 mb-6">Ajouter un utilisateur</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-200 mb-2">Nom d’utilisateur</label>
            <input
              type="text"
              value={userData.username}
              onChange={(e) =>
                setUserData({ ...userData, username: e.target.value })
              }
              className="w-full bg-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
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
              className="w-full bg-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
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
              className="w-full bg-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
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
              <div
                key={quota.model_name}
                className="flex items-center gap-2 mb-2"
              >
                <span className="text-sm text-gray-400 w-48">
                  {quota.model_name}:
                </span>
                <input
                  type="number"
                  value={quota.max_requests}
                  onChange={(e) => handleQuotaChange(index, e.target.value)}
                  className="w-full bg-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  min="0"
                  required
                  placeholder="Normal"
                />
                <input
                  type="number"
                  value={quota.max_long_requests}
                  onChange={(e) => handleLongQuotaChange(index, e.target.value)}
                  className="w-full bg-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  min="0"
                  required
                  placeholder="Long"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-gray-100 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
            >
              Ajouter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
