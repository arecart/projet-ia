// components/Dashboard/AdminDashboard.js
'use client';
import { useState, useEffect, useRef } from 'react';
import { FaUserPlus, FaComments } from 'react-icons/fa';
import UsersTable from './UsersTable';
import AddUserModal from './AddUserModal';
import QuotaModal from './QuotaModal';
import UsageStats from '../UsageStats';
import ChatInterface from '../Generation/ChatInterface';

function Toast({ message, type }) {
  return (
    <div
      className={`fixed bottom-4 right-4 z-50 px-4 py-2 rounded shadow-lg text-white
        ${type === 'success' ? 'bg-green-600' : 'bg-red-600'} animate-fadeInOut`}
    >
      {message}
    </div>
  );
}

export default function AdminDashboard({ onLogout }) {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [showUserInterface, setShowUserInterface] = useState(false);
  const [showUsage, setShowUsage] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [quotaModalUser, setQuotaModalUser] = useState(null);
  const [lastSelectedUser, setLastSelectedUser] = useState(null);
  const [toast, setToast] = useState(null); // { message, type }
  const [loading, setLoading] = useState(false);
  const usersRef = useRef([]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Erreur lors de la récupération des utilisateurs');
      const data = await response.json();
      const usersArray = Array.isArray(data) ? data : [data];
      setUsers(usersArray);
      usersRef.current = usersArray;
    } catch (error) {
      setUsers([]);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSelectUser = (userId, event) => {
    requestAnimationFrame(() => {
      if (event.shiftKey && lastSelectedUser !== null) {
        const startIndex = usersRef.current.findIndex(u => u.id === lastSelectedUser);
        const endIndex = usersRef.current.findIndex(u => u.id === userId);
        const range = [startIndex, endIndex].sort((a, b) => a - b);
        const newSelectedUsers = usersRef.current.slice(range[0], range[1] + 1).map(u => u.id);
        setSelectedUsers(prev => {
          const combined = new Set([...prev, ...newSelectedUsers]);
          return Array.from(combined);
        });
      } else {
        setSelectedUsers(prev =>
          prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
        setLastSelectedUser(userId);
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length && users.length > 0) {
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
      if (!response.ok) throw new Error('Erreur lors de la suppression multiple');
      await fetchUsers();
      setSelectedUsers([]);
    } catch (error) {
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erreur suppression utilisateur');
      await fetchUsers();
    } catch (error) {
    }
  };

  const startEditing = (user) => {
    setEditingUser({ ...user });
  };

  // Fonction onUpdateUser qui met à jour l'utilisateur (sans modification d'ID)
  async function onUpdateUser() {
    if (!editingUser) {
      return;
    }
    const response = await fetch(`/api/users/${editingUser.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: editingUser.username,
        role: editingUser.role,
        quotas: editingUser.quotas,
        is_active: editingUser.is_active,
      }),
    });
    return response;
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    setLoading(true);
    try {
      const res = await onUpdateUser();
      if (!res) {
        throw new Error("Aucune réponse reçue de la requête PUT");
      }
      const data = await res.json();
      if (data.success) {
        setEditingUser(null);
        showToast("Utilisateur mis à jour avec succès !", "success");
        await fetchUsers();
      } else {
        throw new Error("Erreur de mise à jour");
      }
    } catch (error) {
      showToast("Erreur lors de la mise à jour de l’utilisateur.", "error");
    } finally {
      setLoading(false);
    }
  };

  const openAddUserModal = () => setShowAddUserModal(true);
  const handleOpenQuotaModal = (user) => {
    const userCopy = JSON.parse(JSON.stringify(user));
    setQuotaModalUser(userCopy);
  };

  const handleSaveQuotas = async () => {
    if (!quotaModalUser) return;
    try {
      const res = await fetch(`/api/users/${quotaModalUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: quotaModalUser.username,
          role: quotaModalUser.role,
          quotas: quotaModalUser.quotas,
          is_active: quotaModalUser.is_active,
        }),
      });
      if (!res.ok) throw new Error('Erreur lors de la mise à jour des quotas');
      setQuotaModalUser(null);
      await fetchUsers();
      showToast("Quota mis à jour avec succès !", "success");
    } catch (error) {
      showToast("Erreur lors de la mise à jour du quota.", "error");
    }
  };

  // Fonction pour afficher un toast pendant 5 secondes
  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 5000);
  };

  return (
    <>
      {showUsage ? (
        <UsageStats onClose={() => setShowUsage(false)} />
      ) : showUserInterface ? (
        <ChatInterface
          onLogout={onLogout}
          role="admin"
          onDashboard={() => setShowUserInterface(false)}
        />
      ) : (
        <div className="p-8 relative z-10">
          <nav className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-white">Dashboard Admin</h1>
            <div className="flex gap-4">
              <button onClick={() => setShowUsage(true)} className="modern-button text-white py-2 px-4 rounded">
                Usage
              </button>
              <button onClick={() => setShowUserInterface(true)} className="modern-button text-white py-2 px-4 rounded flex items-center gap-2">
                <FaComments />
                Chat
              </button>
              <button onClick={onLogout} className="modern-button text-white py-2 px-4 rounded">
                Déconnexion
              </button>
            </div>
          </nav>

          <main className="glass-morphism p-6 rounded-md">
            <h2 className="text-2xl font-bold title-gradient mb-6">Gestion des utilisateurs</h2>
            <div className="flex justify-end mb-4">
              <button onClick={openAddUserModal} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                <FaUserPlus />
                Ajouter un utilisateur
              </button>
            </div>
            {selectedUsers.length > 0 && (
              <div className="mb-4">
                <button onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                  Supprimer la sélection ({selectedUsers.length})
                </button>
              </div>
            )}
            <UsersTable
              users={users}
              selectedUsers={selectedUsers}
              onSelectUser={handleSelectUser}
              onSelectAll={handleSelectAll}
              editingUser={editingUser}
              setEditingUser={setEditingUser}
              onStartEditing={startEditing}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
              onOpenQuotaModal={handleOpenQuotaModal}
              onShowToast={showToast}
            />
          </main>
          <footer className="mt-12 text-center text-gray-400 text-sm pb-4">
            <p className="inline-block font-medium">
              Fait avec ❤️ par Andoni Recart • {new Date().getFullYear()}
            </p>
          </footer>
        </div>
      )}
      {showAddUserModal && (
        <AddUserModal
          onClose={() => setShowAddUserModal(false)}
          refreshUsers={fetchUsers}
          onShowToast={showToast}
        />
      )}
      {quotaModalUser && (
        <QuotaModal
          user={quotaModalUser}
          onClose={() => setQuotaModalUser(null)}
          onSaveQuotas={handleSaveQuotas}
          setQuotaModalUser={setQuotaModalUser}
          onShowToast={showToast}
        />
      )}
      {toast && <Toast message={toast.message} type={toast.type} />}
      <style jsx>{`
        @keyframes fadeInOut {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          20% {
            opacity: 1;
            transform: translateY(0);
          }
          80% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateY(-20px);
          }
        }
        .animate-fadeInOut {
          animation: fadeInOut 5s ease-in-out forwards;
        }
      `}</style>
    </>
  );
}
