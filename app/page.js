'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import '@/app/globals.css';

const GenerationForm = dynamic(() => import('@/components/NeuroForm'), {
  ssr: false,
  loading: () => (
    <div className="cyber-loader">
      <div className="hologram-beam" />
      <span className="neon-text-sm">INITIALIZING NEURO CORE...</span>
    </div>
  )
});

const NeuroParticles = dynamic(() => import('@/components/NeuroParticles'), { 
  ssr: false,
  loading: () => (
    <div className="cyber-bg-pattern animate-pulse" />
  )
});

export default function NeuroLab() {
  const [modelsReady, setModelsReady] = useState(false);
  const [systemStatus, setSystemStatus] = useState('BOOTING...');

  useEffect(() => {
    const initializeNeuralEngine = async () => {
      try {
        const response = await fetch('/api/neuro/init');
        const data = await response.json();
        
        setSystemStatus('SYNCING QUANTUM MATRIX...');
        await new Promise(r => setTimeout(r, 1500));
        
        setSystemStatus('ACTIVATING NEURO CORES...');
        await new Promise(r => setTimeout(r, 1000));
        
        setModelsReady(true);
        setSystemStatus('READY');
      } catch (error) {
        setSystemStatus('SYSTEM ERROR');
        console.error('NeuroCore failure:', error);
      }
    };

    initializeNeuralEngine();
  }, []);

  return (
    <main className="neuro-container">
      <div className="cyber-dimension">
        <NeuroParticles />
        
        <div className="neuro-interface">
          <div className="system-status neon-text-outline">
            {systemStatus}
          </div>
          
          <GenerationForm modelsReady={modelsReady} />
          
          <div className="cyber-hud">
            <div className="hud-line animate-neon-pulse" />
            <div className="neuro-stats">
              <span className="neon-badge">v2.3.1</span>
              <span className="neon-badge">WEBGPU ENABLED</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}