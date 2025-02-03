import React, { useState, useEffect } from 'react';
import ParticlesComponent from '../../ParticlesComponent';

const CopyIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

export default function GenerationForm({ onLogout, role = 'user', onDashboard, userId }) {
  const [formState, setFormState] = useState({
    error: null,
    result: null,
  });
  const [prompt, setPrompt] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('gpt');
  const [selectedModel, setSelectedModel] = useState('gpt-3.5-turbo');
  const [copySuccess, setCopySuccess] = useState('');
  const [quotaInfo, setQuotaInfo] = useState({
    current: 0,
    max: 0,
    remaining: 0
  });

  useEffect(() => {
    setFormState({ error: null, result: null });
  }, [selectedProvider]);

  const refreshQuota = async () => {
    try {
      const response = await fetch('/api/quota');
      if (!response.ok) throw new Error('Erreur lors de la récupération du quota');
      const data = await response.json();
      setQuotaInfo(data);
    } catch (error) {
      console.error('Erreur de quota:', error);
    }
  };

  useEffect(() => {
    refreshQuota();
    const interval = setInterval(refreshQuota, 60000);
    return () => clearInterval(interval);
  }, []);

  const handlePromptChange = (e) => {
    setPrompt(e.target.value);
    setCharCount(e.target.value.length);
  };

  const handleClearPrompt = () => {
    setPrompt('');
    setCharCount(0);
  };

  const handleProviderChange = (provider) => {
    setSelectedProvider(provider);
    setSelectedModel(provider === 'gpt' ? 'gpt-3.5-turbo' : 'mistral-small-latest');
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    try {
      setLoading(true);

      // Décrémenter le quota
      const quotaResponse = await fetch('/api/quota/decrement', {
        method: 'POST',
        credentials: 'include'
      });

      if (!quotaResponse.ok) {
        const errorData = await quotaResponse.json();
        if (quotaResponse.status === 403) {
          alert("Votre quota de générations est épuisé");
          return;
        }
        throw new Error(errorData.error || 'Erreur de quota');
      }

      // Mettre à jour l'affichage du quota
      const quotaData = await quotaResponse.json();
      setQuotaInfo(quotaData);

      // Génération du texte
      const generationResponse = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: selectedProvider,
          model: selectedModel,
          prompt: prompt,
        }),
        credentials: 'include'
      });

      if (!generationResponse.ok) {
        throw new Error('Erreur lors de la génération');
      }

      const result = await generationResponse.json();
      setFormState({ error: null, result });

    } catch (error) {
      console.error('Erreur:', error);
      setFormState({ error: error.message, result: null });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(formState.result.text).then(() => {
        setCopySuccess('Copié !');
        setTimeout(() => setCopySuccess(''), 2000);
      }).catch(err => {
        console.error('Failed to copy: ', err);
      });
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = formState.result.text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopySuccess('Copié !');
        setTimeout(() => setCopySuccess(''), 2000);
        console.log('Fallback: Copying text command was successful');
      } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col">
      <div className="dynamic-background"></div>
      <ParticlesComponent />

      <div className="absolute top-4 right-4 z-20 flex gap-4">
        {role === 'admin' && (
          <button
            onClick={onDashboard}
            className="modern-button text-white py-2 px-4 rounded"
          >
            Dashboard
          </button>
        )}
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
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => handleProviderChange('gpt')}
                className={`provider-btn ${selectedProvider === 'gpt'
                  ? 'modern-button'
                  : 'bg-gray-700 hover:bg-gray-600'} p-3 rounded-xl transition-all`}
              >
                🤖 OpenAI
                <span className="model-badge ml-2">GPT-3.5 Turbo</span>
              </button>
              <button
                onClick={() => handleProviderChange('mistral')}
                className={`provider-btn ${selectedProvider === 'mistral'
                  ? 'modern-button'
                  : 'bg-gray-700 hover:bg-gray-600'} p-3 rounded-xl transition-all`}
              >
                🚀 Mistral
                <span className="model-badge ml-2">
                  {selectedModel === 'mistral-small-latest' ? 'Small 24.09' : 'Codestral'}
                </span>
              </button>
            </div>

            {selectedProvider === 'mistral' && (
              <div className="mb-4">
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full p-3 border rounded-xl bg-gray-800/80 text-white"
                >
                  <option value="mistral-small-latest">Mistral Small 24.09</option>
                  <option value="codestral-latest">Codestral</option>
                </select>
              </div>
            )}

            <div className="mb-4 p-4 rounded-xl bg-gray-800/50">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">Quota disponible :</span>
                <span className="text-sm font-medium">
                  {quotaInfo.remaining} / {quotaInfo.max} requêtes
                </span>
              </div>
              <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${(quotaInfo.current / quotaInfo.max) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="block font-semibold text-lg mb-3">Prompt :</label>
            <textarea
              value={prompt}
              onChange={handlePromptChange}
              className="w-full p-4 border rounded-xl bg-gray-800/80 text-white input-focus placeholder-gray-400 min-h-[150px] transition-all duration-300 custom-scrollbar"
              placeholder="Décrivez votre requête..."
              maxLength="1000"
            ></textarea>
            <div className="text-sm text-gray-400 mt-2 flex justify-between">
              <span>{charCount} / 1000</span>
              <button onClick={handleClearPrompt} className="hover:text-white transition-colors duration-300">
                Effacer
              </button>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            className="modern-button loading-button w-full text-white font-bold py-4 px-6 rounded-xl transition-all duration-500 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            disabled={loading || quotaInfo.remaining <= 0}
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                <span>Génération en cours...</span>
              </>
            ) : quotaInfo.remaining <= 0 ? (
              "Quota épuisé"
            ) : (
              `🚀 Générer avec ${selectedProvider === 'gpt' ? 'GPT-3.5 Turbo' : selectedModel}`
            )}
          </button>

          {quotaInfo.remaining <= 5 && quotaInfo.remaining > 0 && (
            <div className="mt-4 p-3 bg-yellow-500/20 text-yellow-300 rounded-xl text-sm">
              ⚠️ Attention : Il ne vous reste que {quotaInfo.remaining} requête{quotaInfo.remaining > 1 ? 's' : ''} !
            </div>
          )}

          {quotaInfo.remaining <= 0 && (
            <div className="mt-4 p-3 bg-red-500/20 text-red-300 rounded-xl text-sm">
              ❌ Quota épuisé ! Veuillez attendre la prochaine réinitialisation.
            </div>
          )}

          {formState.error && (
            <div className="mt-6 p-4 bg-red-900/50 rounded-xl animate-pulse">
              ⚠️ Erreur : {formState.error}
            </div>
          )}

          {formState.result && (
            <div className="mt-6 glass-morphism p-4 rounded-xl animate__animated animate__fadeInUp">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📜</span>
                  <span className="font-semibold">Résultat</span>
                  <span className="text-sm text-gray-300 ml-2">
                    {selectedProvider === 'gpt'
                      ? 'GPT-3.5 Turbo'
                      : selectedModel.replace(/-latest/g, '')}
                  </span>
                </div>
                <button
                  onClick={handleCopy}
                  className={`copy-button flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-300 ${
                    copySuccess
                      ? 'bg-green-500/20 text-green-300'
                      : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 hover:text-purple-200'
                  }`}
                >
                  {copySuccess ? <CheckIcon /> : <CopyIcon />}
                  <span className="text-sm">
                    {copySuccess ? 'Copié !' : 'Copier'}
                  </span>
                </button>
              </div>
              <p className="break-words whitespace-pre-wrap text-gray-100">
                {formState.result.text}
              </p>
              <div className="mt-4 text-sm text-gray-300 flex justify-between items-center">
                {/*<span>Requêtes restantes : {quotaInfo.remaining}</span>*/}
               {/* <span>🕒 {new Date().toLocaleTimeString()}</span>*/}
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="mt-12 text-center text-gray-400 text-sm pb-4">
        <p className="inline-block font-medium">
          Fait avec ❤️ par Andoni Recart • {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}