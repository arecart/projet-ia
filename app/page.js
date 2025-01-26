'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import '@/app/globals.css';

// Import dynamique des composants pour éviter les problèmes d'hydratation
const GenerationForm = dynamic(() => import('@/components/GenerationForm'), {
  ssr: false,
  loading: () => (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
      <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
    </div>
  )
});

const Particles = dynamic(() => import('@/components/ParticlesComponent'), { 
  ssr: false,
  loading: () => null
});

export default function Home() {
  const [modelsReady, setModelsReady] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const initializeModels = async () => {
      try {
        const res = await fetch('/api/init-models');
        if (!res.ok) throw new Error('Échec du chargement des modèles');
        setModelsReady(true);
      } catch (error) {
        console.error('Erreur lors de initialisation des modèles:', error);
        setModelsReady(false);
      }
    };

    if (mounted) {
      initializeModels();
    }

    return () => setMounted(false);
  }, [mounted]);

  if (!mounted) return null;

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-gray-900">
      <div className="absolute inset-0 z-0">
        <Particles />
      </div>
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <GenerationForm modelsReady={modelsReady} />
      </div>
    </main>
  );
}
