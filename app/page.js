'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ParticlesComponent from '@/components/ParticlesComponent';
import ChatInterface from '@/components/Generation/ChatInterface';
import AdminDashboard from '@/components/Dashboard/AdminDashboard';

export default function HomePage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const response = await fetch('/api/role', {
          credentials: 'include',
        });
        const data = await response.json();
        if (data.error) {
          router.push('/login');
        } else {
          setIsAdmin(data.role === 'admin');
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du rôle:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
      });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        <ParticlesComponent />
        <div className="dynamic-background" />
        <div className="text-white">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen custom-scrollbar">
      <ParticlesComponent />
      <div className="dynamic-background" />
      {isAdmin ? (
        <AdminDashboard onLogout={handleLogout} />
      ) : (
        <ChatInterface onLogout={handleLogout} />
      )}
    </div>
  );
}