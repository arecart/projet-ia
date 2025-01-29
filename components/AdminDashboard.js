'use client';
import { useState, useEffect } from 'react';
import { FaTrash, FaEdit, FaUserPlus } from 'react-icons/fa';

export default function AdminDashboard({ onLogout }) {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({
    username: '',
    password: ''
  });
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des utilisateurs');
      }
      const data = await response.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      setUsers([]);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSelectUser = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user.id));
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedUsers.length) return;
    
    try {
      const response = await fetch('/api/users/bulk-delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userIds: selectedUsers }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      await fetchUsers();
      setSelectedUsers([]);
    } catch (error) {
      console.error('Erreur lors de la suppression des utilisateurs:', error);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/users/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'ajout');
      }

      setShowAddUserModal(false);
      setNewUser({ username: '', password: '' });
      await fetchUsers();
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'utilisateur:', error);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      const response = await fetch(`/api/users/${editingUser.originalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: editingUser.username,
          newId: editingUser.id !== editingUser.originalId ? parseInt(editingUser.id) : undefined
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour');
      }

      setEditingUser(null);
      await fetchUsers();
    } catch (error) {
      console.error('Erreur lors de la modification de l\'utilisateur:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      await fetchUsers();
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    }
  };

  const startEditing = (user) => {
    setEditingUser({
      ...user,
      originalId: user.id
    });
  };

  return (
    <div className="p-8 relative z-10">
      <nav className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Dashboard Admin</h1>
        <button
          onClick={onLogout}
          className="modern-button text-white py-2 px-4 rounded"
        >
          Déconnexion
        </button>
      </nav>

      <main className="glass-morphism p-6 rounded-md">
        <h2 className="text-2xl font-bold title-gradient mb-6">
          Gestion des utilisateurs
        </h2>
        
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowAddUserModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <FaUserPlus />
            Ajouter un utilisateur
          </button>
        </div>

        {selectedUsers.length > 0 && (
          <div className="mb-4">
            <button
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <FaTrash />
              Supprimer la sélection ({selectedUsers.length})
            </button>
          </div>
        )}

        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th className="p-4">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === users.length}
                    onChange={handleSelectAll}
                    className="rounded text-blue-600"
                  />
                </th>
                <th className="p-4 text-left text-sm font-semibold text-gray-200">ID</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-200">Utilisateur</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-200">Date de création</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-200">Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(users) && users.map(user => (
                <tr key={user.id} className="border-t border-gray-700">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                      className="rounded text-blue-600"
                    />
                  </td>
                  {editingUser?.originalId === user.id ? (
                    <>
                      <td className="p-4">
                        <input
                          type="number"
                          value={editingUser.id}
                          onChange={(e) => setEditingUser({...editingUser, id: e.target.value})}
                          className="bg-gray-700 text-white rounded px-2 py-1 w-20"
                        />
                      </td>
                      <td className="p-4">
                        <input
                          type="text"
                          value={editingUser.username}
                          onChange={(e) => setEditingUser({...editingUser, username: e.target.value})}
                          className="bg-gray-700 text-white rounded px-2 py-1"
                        />
                      </td>
                      <td className="p-4 text-gray-300">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            onClick={handleUpdateUser}
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
                      <td className="p-4 text-gray-300">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEditing(user)}
                            className="text-blue-500 hover:text-blue-400"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
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

        {showAddUserModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
              <h2 className="text-xl font-bold text-gray-200 mb-4">Ajouter un utilisateur</h2>
              <form onSubmit={handleAddUser}>
                <div className="mb-4">
                  <label className="block text-gray-200 mb-2">Nom d'utilisateur</label>
                  <input
                    type="text"
                    value={newUser.username}
                    onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                    className="w-full bg-gray-700 text-white rounded px-3 py-2"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-200 mb-2">Mot de passe</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    className="w-full bg-gray-700 text-white rounded px-3 py-2"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddUserModal(false)}
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
        )}
      </main>
    </div>
  );
}