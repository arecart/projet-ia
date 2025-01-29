import React, { useState, useEffect } from 'react';
import ParticlesComponent from './ParticlesComponent';

export default function GenerationForm({ onLogout }) {
  const [formState, setFormState] = useState({
    error: null,
    result: null,
  });
  const [generationType, setGenerationType] = useState('gpt');
  const [prompt, setPrompt] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedGenerationType = localStorage.getItem('generationType');
    if (savedGenerationType) {
      setGenerationType(savedGenerationType);
    }
  }, []);

  const handleGenerationTypeChange = (type) => {
    setGenerationType(type);
    localStorage.setItem('generationType', type);
  };

  const handlePromptChange = (e) => {
    setPrompt(e.target.value);
    setCharCount(e.target.value.length);
  };

  const handleClearPrompt = () => {
    setPrompt('');
    setCharCount(0);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert("⚠️ Veuillez saisir un prompt.");
      return;
    }

    setFormState({ ...formState, error: null, result: null });
    setLoading(true);

    try {
      let response;
      if (generationType === 'api') {
        response = await fetch('/api/generate/api', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'mistral', prompt }),
        });
      } else if (generationType === 'gpt') {
        response = await fetch('/api/generate/gpt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        });
      }

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        setFormState({ ...formState, error: data.error });
      } else {
        setFormState({ ...formState, result: data });
      }
    } catch (err) {
      setFormState({ ...formState, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col">
      <div className="dynamic-background"></div>
      <ParticlesComponent />

      {/* Bouton de déconnexion */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={onLogout}
          className="modern-button text-white py-2 px-4 rounded"
        >
          Déconnexion
        </button>
      </div>

      <main className="flex-grow flex items-center justify-center p-6 relative z-10">
        <div className="glass-morphism text-white shadow-2xl rounded-2xl p-8 w-full max-w-lg animate__animated animate__fadeIn hover-card">
          <h1 className="text-4xl font-extrabold text-center mb-8">
            <span className="title-gradient">
              Projet WebGPU & API IA
            </span>
          </h1>

          <div className="mb-6">
            <label className="block font-semibold text-lg mb-3">Mode de génération :</label>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => handleGenerationTypeChange('api')} 
                className={`generation-type-btn ${generationType === 'api' ? 'modern-button' : 'bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-600 hover:to-gray-800'} py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 font-semibold shadow-lg`}
              >
                🌐 API
              </button>
              <button 
                onClick={() => handleGenerationTypeChange('gpt')} 
                className={`generation-type-btn ${generationType === 'gpt' ? 'modern-button' : 'bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-600 hover:to-gray-800'} py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 font-semibold shadow-lg`}
              >
                🤖 GPT
              </button>
            </div>
          </div>

          <div className={`mb-6 ${generationType === 'api' ? '' : 'hidden'} animate__animated animate__fadeIn`}>
            <label className="block font-semibold text-lg mb-3">Modèle API :</label>
            <select className="w-full p-3 border rounded-xl bg-gray-800/80 text-white input-focus transition-all duration-300">
              <option value="mistral">Mistral-7B (v0.3)</option>
              <option value="zephyr">Zephyr-7B</option>
            </select>
          </div>

          <div className={`mb-6 ${generationType === 'gpt' ? '' : 'hidden'} animate__animated animate__fadeIn`}>
            <label className="block font-semibold text-lg mb-3">Modèle GPT :</label>
            <select className="w-full p-3 border rounded-xl bg-gray-800/80 text-white input-focus transition-all duration-300">
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="block font-semibold text-lg mb-3">Votre prompt :</label>
            <textarea 
              value={prompt}
              onChange={handlePromptChange}
              className="w-full p-4 border rounded-xl bg-gray-800/80 text-white input-focus placeholder-gray-400 min-h-[150px] transition-all duration-300 custom-scrollbar" 
              placeholder="Décrivez ce que vous souhaitez générer..."
              maxLength="1000"
            ></textarea>
            <div className="text-sm text-gray-400 mt-2 flex justify-between">
              <span>{charCount} / 1000</span>
              <button onClick={handleClearPrompt} className="hover:text-white transition-colors duration-300">Effacer</button>
            </div>
          </div>

          <button 
            onClick={handleGenerate}
            className="modern-button loading-button w-full text-white font-bold py-4 px-6 rounded-xl transition-all duration-500 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                <span>Chargement...</span>
              </>
            ) : (
              '🚀 Générer'
            )}
          </button>

          {formState.error ? (
            <div className="error-message mt-6">
              ⚠️ {formState.error}
            </div>
          ) : (
            formState.result && (
              <div id="result" className="mt-6 glass-morphism p-4 rounded-xl animate__animated animate__fadeInUp">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <span>📜</span>
                    <span className="font-semibold">Résultat</span>
                  </div>
                  <button onClick={() => navigator.clipboard.writeText(formState.result.text)} className="text-sm text-violet-300 hover:text-violet-100 transition-colors duration-300">
                    📋 Copier
                  </button>
                </div>
                <p className="break-words whitespace-pre-wrap">{formState.result.text}</p>
                <p className="mt-3 text-sm text-gray-300">🔢 Nombre de tokens générés : ~{formState.result.text.split(/\s+/).length}</p>
              </div>
            )
          )}
        </div>
      </main>

      <footer className="mt-12 text-center text-gray-400 text-sm animate-fade-in">
        <p className="footer-text inline-block font-medium">
          Fait avec <span className="footer-heart">❤️</span> par Andoni Recart • {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
