'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

const ParticlesComponent = dynamic(() => 
  import('./ParticlesComponent'), 
  { ssr: false }
);

const initialState = {
  generationType: 'local',
  modelType: 'Xenova/distilgpt2',
  apiModel: 'mistral',
  deepseekModel: 'deepseek-chat',
  prompt: '',
  isLoading: false,
  result: { text: '' },
  error: null
};

export default function GenerationForm({ modelsReady }) {
  const [formState, setFormState] = useState(initialState);

  const handleGenerationType = (type) => {
    setFormState(prev => ({
      ...prev,
      generationType: type,
      result: null,
      error: null
    }));
  };

  const handleModelChange = (e) => {
    setFormState(prev => ({
      ...prev,
      modelType: e.target.value,
      result: null,
      error: null
    }));
  };

  const handleApiModelChange = (e) => {
    setFormState(prev => ({
      ...prev,
      apiModel: e.target.value,
      result: null,
      error: null
    }));
  };

  const handleDeepseekModelChange = (e) => {
    setFormState(prev => ({
      ...prev,
      deepseekModel: e.target.value,
      result: null,
      error: null
    }));
  };

  const handlePromptChange = (e) => {
    setFormState(prev => ({
      ...prev,
      prompt: e.target.value
    }));
  };

  const clearPrompt = () => {
    setFormState(prev => ({
      ...prev,
      prompt: '',
      result: null,
      error: null
    }));
  };

  const copyToClipboard = async () => {
    if (formState.result?.text) {
      try {
        await navigator.clipboard.writeText(formState.result.text);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formState.prompt.trim()) return;

    setFormState(prev => ({
      ...prev,
      isLoading: true,
      result: null,
      error: null
    }));

    try {
      let endpoint;
      let payload;

      switch (formState.generationType) {
        case 'local':
          endpoint = '/api/generate';
          payload = {
            prompt: formState.prompt,
            model: formState.modelType
          };
          break;
        case 'api':
          endpoint = '/api/generate-api';
          payload = {
            prompt: formState.prompt,
            model: formState.apiModel
          };
          break;
        case 'gpt':
          endpoint = '/api/generate-gpt';
          payload = {
            prompt: formState.prompt
          };
          break;
        case 'deepseek':
          endpoint = '/api/generate-deepseek';
          payload = {
            prompt: formState.prompt,
            model: formState.deepseekModel
          };
          break;
        default:
          throw new Error('Type de génération invalide');
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      setFormState(prev => ({
        ...prev,
        isLoading: false,
        result: data,
        error: null
      }));
    } catch (error) {
      console.error('Erreur lors de la génération:', error);
      setFormState(prev => ({
        ...prev,
        isLoading: false,
        result: null,
        error: error instanceof Error ? error.message : 'Une erreur est survenue'
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 overflow-x-hidden relative">
      <ParticlesComponent />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        <main className="max-w-4xl mx-auto space-y-8">
          <h1 className="text-4xl font-bold text-center gradient-text animate-fade-in">
            Projet WebGPU & API IA
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Generation Type Selector */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['local', 'api', 'gpt', 'deepseek'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleGenerationType(type)}
                  className={`model-selector ${
                    formState.generationType === type ? 'active' : ''
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {{
                      local: '💻 Local',
                      api: '🌐 API',
                      gpt: '🤖 GPT',
                      deepseek: '🧠 Deepseek'
                    }[type]}
                  </span>
                  {formState.generationType === type && (
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                  )}
                </button>
              ))}
            </div>

            {/* Model Selection */}
            {(formState.generationType === 'local' || 
              formState.generationType === 'api' || 
              formState.generationType === 'deepseek') && (
              <div className="glass-morphism p-5 rounded-xl">
                <label className="block text-sm font-medium mb-3 gradient-text">
                  {{
                    local: 'Modèle Local',
                    api: 'Modèle API',
                    deepseek: 'Modèle Deepseek'
                  }[formState.generationType]}
                </label>
                <select
                  value={{
                    local: formState.modelType,
                    api: formState.apiModel,
                    deepseek: formState.deepseekModel
                  }[formState.generationType]}
                  onChange={
                    formState.generationType === 'local' ? handleModelChange :
                    formState.generationType === 'api' ? handleApiModelChange :
                    handleDeepseekModelChange
                  }
                  className="w-full"
                >
                  {formState.generationType === 'local' && (
                    <>
                      <option value="Xenova/distilgpt2">DistilGPT2 (124M)</option>
                      <option value="Xenova/gpt2">GPT2 (124M)</option>
                    </>
                  )}
                  {formState.generationType === 'api' && (
                    <>
                      <option value="mistral">Mistral</option>
                      <option value="llama">Llama 2</option>
                    </>
                  )}
                  {formState.generationType === 'deepseek' && (
                    <>
                      <option value="deepseek-chat">Deepseek Chat</option>
                      <option value="deepseek-reasoner">Deepseek Reasoner</option>
                    </>
                  )}
                </select>
              </div>
            )}

            {/* Prompt Input */}
            <div className="glass-morphism p-5 rounded-xl animated-border">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium gradient-text">
                  Votre Prompt
                </label>
                <button
                  type="button"
                  onClick={clearPrompt}
                  className="text-purple-300 hover:text-purple-100 transition-colors text-sm flex items-center gap-1"
                >
                  <span>🗑️</span>
                  Effacer
                </button>
              </div>
              <textarea
                value={formState.prompt}
                onChange={handlePromptChange}
                rows={4}
                className="w-full placeholder-gray-400"
                placeholder="Écrivez votre prompt ici..."
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={formState.isLoading || !modelsReady}
              className="modern-button w-full py-4 text-sm uppercase tracking-wider"
            >
              {formState.isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Génération en cours...
                </div>
              ) : (
                '🚀 Lancer la Génération'
              )}
            </button>
          </form>

          {/* Results Section */}
          {(formState.result || formState.error) && (
            <div className="glass-morphism p-5 rounded-xl animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <h2 className="gradient-text font-semibold text-lg">📋 Résultat</h2>
                {formState.result?.text && (
                  <button
                    onClick={copyToClipboard}
                    className="text-purple-300 hover:text-purple-100 flex items-center gap-1 text-sm"
                  >
                    📄 Copier
                  </button>
                )}
              </div>

              {formState.error ? (
                <div className="text-red-400 bg-red-900/20 p-3 rounded-lg">
                  ⚠️ {formState.error}
                </div>
              ) : (
                <div className="space-y-4">
                  <pre className="result-text">{formState.result?.text}</pre>
                  {formState.result?.text && (
                    <div className="token-badge">
                      Tokens: ~{formState.result.text.split(/\s+/).length}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>

        <footer className="mt-12 text-center text-gray-400 text-sm animate-fade-in">
          <p className="gradient-text inline-block font-medium">
            Fait avec ❤️ par Andoni Recart • {new Date().getFullYear()}
          </p>
        </footer>
      </div>
    </div>
  );
}