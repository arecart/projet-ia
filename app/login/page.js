'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ParticlesComponent from '@/components/ParticlesComponent';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });

      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Erreur de connexion');
        return;
      }

      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 100);

    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center">
      <ParticlesComponent />
      <div className="dynamic-background" />

      <form
        onSubmit={handleSubmit}
        className="glass-morphism p-8 rounded-lg flex flex-col gap-6 max-w-md w-full mx-4"
      >
        <h1 className="text-center text-3xl font-bold title-gradient">Connexion</h1>

        {error && (
          <div className="p-3 text-red-400 bg-red-900/20 rounded-md text-center">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Nom d'utilisateur"
            className="w-full input-focus p-3 rounded bg-transparent text-white border border-white/20"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading}
          />

          <input
            type="password"
            placeholder="Mot de passe"
            className="w-full input-focus p-3 rounded bg-transparent text-white border border-white/20"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`modern-button text-white py-3 px-4 rounded font-medium 
            ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
        >
          {isLoading ? 'Connexion en cours...' : 'Se connecter'}
        </button>
      </form>
    </div>
  );
}
