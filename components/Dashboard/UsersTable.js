// components/Dashboard/UsersTable.js
'use client';
import { useState, useEffect } from 'react';
import { FaTrash, FaEdit, FaSlidersH } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

/**
 * Composant de confirmation de suppression d'utilisateur.
 */
function DeleteUserModal({ user, onConfirm, onCancel }) {
  const [confirmName, setConfirmName] = useState('');

  const handleConfirm = () => {
    onConfirm(confirmName);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Fond semi-transparent sombre */}
      <div className="absolute inset-0 bg-black opacity-60"></div>
      <div className="bg-gray-900 p-6 rounded shadow-lg z-10 max-w-md w-full border border-gray-700">
        <h2 className="text-2xl font-bold mb-4 text-white">Attention</h2>
        <p className="mb-4 text-gray-300">
          Êtes-vous sûr de vouloir supprimer l’utilisateur <span className="font-bold text-white">{user.username}</span> ?<br />
          Cette action supprimera toutes les données associées.
        </p>
        <p className="mb-4 text-gray-300">Pour confirmer, tapez le nom de l’utilisateur :</p>
        <input
          type="text"
          value={confirmName}
          onChange={(e) => setConfirmName(e.target.value)}
          className="border border-gray-600 bg-gray-800 text-white rounded p-2 w-full mb-4 focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        <div className="flex justify-end gap-4">
          <button
            onClick={handleConfirm}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            OK
          </button>
          <button
            onClick={onCancel}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Composant UsersTable affichant la liste des utilisateurs sans afficher leur ID.
 */
export default function UsersTable({
  users,
  selectedUsers,
  onSelectUser,
  onSelectAll,
  editingUser,
  setEditingUser,
  onStartEditing,
  onUpdateUser,
  onDeleteUser,
  onOpenQuotaModal,
  onShowToast,
}) {
  const [verificationError, setVerificationError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
  }, [users]);

  async function handleSave() {
    try {
      // 1. Mise à jour de l'utilisateur côté serveur
      await onUpdateUser();
  
      // 2. Requête pour récupérer les données mises à jour de l'utilisateur
      const response = await fetch(`/api/users/${editingUser.id}`);
      if (!response.ok) {
        throw new Error("Erreur lors de la vérification de l'utilisateur");
      }
      const updatedUser = await response.json();
  
      // 3. Vérification du rôle
      if (updatedUser.role !== editingUser.role) {
        onShowToast(
          'Le rôle de l’utilisateur a été modifié côté serveur. Vous allez être déconnecté.',
          "error"
        );
        await fetch('/api/logout', { method: 'POST' });
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
        return;
      }
  
      // 4. Quitter le mode édition
      setEditingUser(null);
      onShowToast("Utilisateur mis à jour avec succès !", "success");
    } catch (error) {
      onShowToast("Erreur lors de la mise à jour de l’utilisateur.", "error");
    }
  }

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = async (confirmName) => {
    if (confirmName !== userToDelete.username) {
      alert("Le nom saisi ne correspond pas au nom de l'utilisateur.");
      return;
    }
    setLoading(true);
    try {
      await onDeleteUser(userToDelete.id);
      setShowDeleteModal(false);
      setUserToDelete(null);
      onShowToast("Utilisateur supprimé avec succès.", "success");
    } catch (error) {
      alert("Erreur lors de la suppression de l’utilisateur.");
      onShowToast("Erreur lors de la suppression de l’utilisateur.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {showDeleteModal && userToDelete && (
        <DeleteUserModal
          user={userToDelete}
          onConfirm={confirmDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setUserToDelete(null);
          }}
        />
      )}
      <div className="overflow-x-auto">
        {verificationError && (
          <div className="mb-4 p-2 bg-red-500 text-white">{verificationError}</div>
        )}
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="p-4">
                <input
                  type="checkbox"
                  checked={selectedUsers.length === users.length && users.length > 0}
                  onChange={onSelectAll}
                />
              </th>
              <th className="p-4 text-left text-gray-200">Nom d'utilisateur</th>
              <th className="p-4 text-left text-gray-200">Rôle</th>
              <th className="p-4 text-left text-gray-200">Créé le</th>
              <th className="p-4 text-left text-gray-200">Dernière connexion</th>
              <th className="p-4 text-left text-gray-200">Connexions</th>
              <th className="p-4 text-left text-gray-200">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-gray-700">
                <td className="p-4">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={(e) => onSelectUser(user.id, e)}
                  />
                </td>
                {editingUser && editingUser.originalId === user.id ? (
                  <>
                    <td className="p-4">
                      <input
                        type="text"
                        value={editingUser.username}
                        onChange={(e) =>
                          setEditingUser({ ...editingUser, username: e.target.value })
                        }
                        className="bg-gray-700 text-white rounded px-2 py-1"
                      />
                    </td>
                    <td className="p-4">
                      <select
                        value={editingUser.role}
                        onChange={(e) =>
                          setEditingUser({ ...editingUser, role: e.target.value })
                        }
                        className="bg-gray-700 text-white rounded px-2 py-1"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="p-4 text-gray-300">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-gray-300">
                      {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Jamais'}
                    </td>
                    <td className="p-4 text-gray-300">{user.login_count}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={handleSave}
                          className="text-green-500 hover:text-green-400"
                          disabled={loading}
                        >
                          Sauvegarder
                        </button>
                        <button
                          onClick={() => setEditingUser(null)}
                          className="text-gray-500 hover:text-gray-400"
                          disabled={loading}
                        >
                          Annuler
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-4 text-gray-300">{user.username}</td>
                    <td className="p-4 text-gray-300">{user.role}</td>
                    <td className="p-4 text-gray-300">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-gray-300">
                      {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Jamais'}
                    </td>
                    <td className="p-4 text-gray-300">{user.login_count}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => onStartEditing({ ...user, originalId: user.id })}
                          className="text-blue-500 hover:text-blue-400"
                          disabled={loading}
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => onOpenQuotaModal(user)}
                          className="text-purple-500 hover:text-purple-400"
                          disabled={loading}
                        >
                          <FaSlidersH />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(user)}
                          className="text-red-500 hover:text-red-400"
                          disabled={loading}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
