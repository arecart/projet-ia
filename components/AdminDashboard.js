'use client';

import { useState, useEffect, useRef } from 'react';
import { FaTrash, FaEdit, FaUserPlus, FaComments } from 'react-icons/fa';
import GenerationForm from './GenerationForm';
import UsageStats from './UsageStats';

export default function AdminDashboard({ onLogout }) {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [showUserInterface, setShowUserInterface] = useState(false);
  const [showUsage, setShowUsage] = useState(false);

  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    role: 'user',
    max_requests: 100, 
  });

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [lastSelectedUser, setLastSelectedUser] = useState(null);
  const usersRef = useRef([]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Erreur lors de la récupération');
      const data = await response.json();
      setUsers(Array.isArray(data) ? data : [data]);
      usersRef.current = Array.isArray(data) ? data : [data];
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      setUsers([]);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSelectUser = (userId, event) => {
    requestAnimationFrame(() => {
      if (event.shiftKey && lastSelectedUser !== null) {
        const startIndex = usersRef.current.findIndex(user => user.id === lastSelectedUser);
        const endIndex = usersRef.current.findIndex(user => user.id === userId);
        const range = [startIndex, endIndex].sort((a, b) => a - b);
        const newSelectedUsers = usersRef.current.slice(range[0], range[1] + 1).map(user => user.id);
        setSelectedUsers(prevSelectedUsers => {
          const uniqueSelectedUsers = new Set([...prevSelectedUsers, ...newSelectedUsers]);
          return Array.from(uniqueSelectedUsers);
        });
      } else {
        if (selectedUsers.includes(userId)) {
          setSelectedUsers(selectedUsers.filter(id => id !== userId));
        } else {
          setSelectedUsers([...selectedUsers, userId]);
        }
        setLastSelectedUser(userId);
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u.id));
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedUsers.length) return;
    try {
      const response = await fetch('/api/users/bulk-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: selectedUsers }),
      });
      if (!response.ok) throw new Error('Erreur lors de la suppression en masse');
      await fetchUsers();
      setSelectedUsers([]);
    } catch (error) {
      console.error('Erreur lors de la suppression en masse:', error);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/users/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      if (!res.ok) throw new Error('Erreur lors de l\'ajout user');

      setShowAddUserModal(false);
      setNewUser({ username: '', password: '', role: 'user', max_requests: 0 });
      await fetchUsers();
    } catch (error) {
      console.error('Erreur ajout user:', error);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    try {
      const res = await fetch(`/api/users/${editingUser.originalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: editingUser.username,
          role: editingUser.role,
          maxRequests: editingUser.max_requests,
          newId: editingUser.id !== editingUser.originalId ? parseInt(editingUser.id) : undefined,
        }),
      });
      if (!res.ok) throw new Error('Erreur lors de la mise à jour');

      setEditingUser(null);
      await fetchUsers();
    } catch (error) {
      console.error('Erreur update user:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erreur suppression user');
      await fetchUsers();
    } catch (error) {
      console.error('Erreur suppression user:', error);
    }
  };

  const startEditing = (user) => {
    setEditingUser({
      ...user,
      originalId: user.id,
    });
  };

  return (
    <>
      {showUsage ? (
        <UsageStats onClose={() => setShowUsage(false)} />
      ) : showUserInterface ? (
        <GenerationForm 
          onLogout={onLogout}
          role="admin"
          onDashboard={() => setShowUserInterface(false)}
        />
      ) : (
        <div className="p-8 relative z-10">
          <nav className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-white">Dashboard Admin</h1>
            <div className="flex gap-4">
              <button
                onClick={() => setShowUsage(true)}
                className="modern-button text-white py-2 px-4 rounded"
              >
                Usage
              </button>
              <button
                onClick={() => setShowUserInterface(true)}
                className="modern-button text-white py-2 px-4 rounded flex items-center gap-2"
              >
                Chat
              </button>
              <button onClick={onLogout} className="modern-button text-white py-2 px-4 rounded">
                Déconnexion
              </button>
            </div>
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

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === users.length}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th className="p-4 text-left text-gray-200">ID</th>
                    <th className="p-4 text-left text-gray-200">Nom d'utilisateur</th>
                    <th className="p-4 text-left text-gray-200">Rôle</th>
                    <th className="p-4 text-left text-gray-200">Créé le</th>
                    <th className="p-4 text-left text-gray-200">Dernière connexion</th>
                    <th className="p-4 text-left text-gray-200">Nombre de connexions</th>
                    <th className="p-4 text-left text-gray-200">Quota Utilisé</th>
                    <th className="p-4 text-left text-gray-200">Quota Max</th>
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
                          onChange={(event) => handleSelectUser(user.id, event)}
                        />
                      </td>
                      {editingUser?.originalId === user.id ? (
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
                            <span className="text-gray-300">{user.request_count || 0}</span>
                          </td>
                          <td className="p-4">
                            <input
                              type="number"
                              value={editingUser.max_requests || 0}
                              onChange={(e) =>
                                setEditingUser({ ...editingUser, max_requests: parseInt(e.target.value) })
                              }
                              className="bg-gray-700 text-white rounded px-2 py-1 w-20"
                            />
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
                          <td className="p-4 text-gray-300">
                            {user.request_count || 0} / {user.max_requests || 0}
                          </td>
                          <td className="p-4 text-gray-300">{user.max_requests || 0}</td>
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
                        onChange={(e) =>
                          setNewUser({ ...newUser, username: e.target.value })
                        }
                        className="w-full bg-gray-700 text-white rounded px-3 py-2"
                        required
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-gray-200 mb-2">Mot de passe</label>
                      <input
                        type="password"
                        value={newUser.password}
                        onChange={(e) =>
                          setNewUser({ ...newUser, password: e.target.value })
                        }
                        className="w-full bg-gray-700 text-white rounded px-3 py-2"
                        required
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-gray-200 mb-2">Rôle</label>
                      <select
                        value={newUser.role}
                        onChange={(e) =>
                          setNewUser({ ...newUser, role: e.target.value })}
                        className="w-full bg-gray-700 text-white rounded px-3 py-2"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>

                    <div className="mb-4">
                      <label className="block text-gray-200 mb-2">Quota Maximum</label>
                      <input
                        type="number"
                        value={newUser.max_requests}
                        onChange={(e) =>
                          setNewUser({ ...newUser, max_requests: parseInt(e.target.value) })
                        }
                        className="w-full bg-gray-700 text-white rounded px-3 py-2"
                        required
                        min="0"
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
          <footer className="mt-12 text-center text-gray-400 text-sm pb-4">
            <p className="inline-block font-medium">
              Fait avec ❤️ par Andoni Recart • {new Date().getFullYear()}
            </p>
          </footer>
        </div>
      )}
    </>
  );
}