'use client';
import { useState } from 'react';
import { FaTrash, FaEdit, FaSlidersH } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

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
}) {
  const [verificationError, setVerificationError] = useState(null);
  const router = useRouter();

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
        setVerificationError(
          'Le rôle de l’utilisateur a été modifié côté serveur. Vous allez être déconnecté.'
        );
        await fetch('/api/logout', { method: 'POST' });
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
        return;
      } else {
        setVerificationError(null);
      }

      // 4. Quitter le mode édition
      setEditingUser(null);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde ou de la vérification :', error);
      setVerificationError("Erreur lors de la sauvegarde ou de la vérification.");
    }
  }

  return (
    <div>

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
              <th className="p-4 text-left text-gray-200">ID</th>
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
                        type="number"
                        value={editingUser.id}
                        onChange={(e) =>
                          setEditingUser({ ...editingUser, id: e.target.value })
                        }
                        className="bg-gray-700 text-white rounded px-2 py-1 w-20"
                      />
                    </td>
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
                      {user.last_login
                        ? new Date(user.last_login).toLocaleDateString()
                        : 'Jamais'}
                    </td>
                    <td className="p-4 text-gray-300">{user.login_count}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={handleSave}
                          className="text-green-500 hover:text-green-400"
                        >
                          Sauvegarder
                        </button>
                        <button
                          onClick={() => setEditingUser(null)}
                          className="text-gray-500 hover:text-gray-400"
                        >
                          Annuler
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-4 text-gray-300">{user.id}</td>
                    <td className="p-4 text-gray-300">{user.username}</td>
                    <td className="p-4 text-gray-300">{user.role}</td>
                    <td className="p-4 text-gray-300">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-gray-300">
                      {user.last_login
                        ? new Date(user.last_login).toLocaleDateString()
                        : 'Jamais'}
                    </td>
                    <td className="p-4 text-gray-300">{user.login_count}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => onStartEditing({ ...user, originalId: user.id })}
                          className="text-blue-500 hover:text-blue-400"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => onOpenQuotaModal(user)}
                          className="text-purple-500 hover:text-purple-400"
                        >
                          <FaSlidersH />
                        </button>
                        <button
                          onClick={() => onDeleteUser(user.id)}
                          className="text-red-500 hover:text-red-400"
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
