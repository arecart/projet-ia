'use client';
import { useState } from 'react';
import { createPortal } from 'react-dom';

const models = {
  text: [
    {
      provider: 'gpt',
      model: 'gpt-4o-mini-2024-07-18',
      label: 'GPT-4o Mini',
      icon: '🚀',
      description: 'Modèle léger et performant pour des tâches complexes.'
    },
    {
      provider: 'gpt',
      model: 'gpt-4o',  // Nouveau modèle ajouté
      label: 'GPT-4o',
      icon: '🤖',
      description: 'Version améliorée et polyvalente pour vos applications.'
    },
    {
      provider: 'mistral',
      model: 'mistral-small-latest',
      label: 'Mistral',
      icon: '🐱',
      description: 'Rapide et efficace pour la génération de texte.'
    },
    {
      provider: 'mistral',
      model: 'codestral-latest',
      label: 'Codestral',
      icon: '🧩',
      description: 'Idéal pour le code et la documentation technique.'
    },
  ],
  reasoning: [
    {
      provider: 'gpt',
      model: 'o1-mini-2024-09-12',
      label: 'O1 Mini',
      icon: '🧠',
      description: 'Version optimisée pour le raisonnement et l’analyse.'
    }
  ],
  image: [] // Aucun modèle image pour le moment
};

export default function AISelector({
  selectedProvider,
  selectedModel,
  onProviderChange,
  onModelChange,
  debug = false,
}) {
  const [isPopupOpen, setPopupOpen] = useState(false);
  const allModels = [...models.text, ...models.reasoning, ...models.image];
  const selectedAI =
    allModels.find(
      (ai) => ai.provider === selectedProvider && ai.model === selectedModel
    ) || models.text[0];

  const handleSelectAI = (ai) => {
    if (debug) console.debug("AISelector: sélection de", ai);
    onProviderChange(ai.provider);
    onModelChange(ai.model);
    setPopupOpen(false);
  };

  const popupContent = (
    <div className="fixed inset-0 z-[11000] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black opacity-70 backdrop-blur-sm"
        onClick={() => setPopupOpen(false)}
      ></div>
      <div className="bg-gray-900 rounded-lg shadow-xl p-4 relative w-11/12 max-w-4xl animate-slideIn">
        <button
          onClick={() => setPopupOpen(false)}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-200 transition-colors"
          title="Fermer"
        >
          ✕
        </button>
        <h3 className="text-2xl font-semibold text-gray-100 mb-4 text-center">
          Sélectionnez une IA
        </h3>
        <div className="flex flex-row justify-around">
          {/* Section Texte */}
          <div className="w-1/2 px-2">
            <h4 className="text-lg font-medium text-gray-300 border-b border-gray-700 pb-1 mb-2">
              Texte
            </h4>
            <ul className="space-y-2">
              {models.text.map((ai) => (
                <li key={`${ai.provider}-${ai.model}`}>
                  <button
                    onClick={() => handleSelectAI(ai)}
                    className="w-full flex items-center p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded hover:from-indigo-600 hover:to-purple-600 transition transform hover:scale-105"
                  >
                    <span className="mr-2 text-xl">{ai.icon}</span>
                    <span className="text-gray-100">{ai.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          {/* Section Raisonnement */}
          <div className="w-1/2 px-2">
            <h4 className="text-lg font-medium text-gray-300 border-b border-gray-700 pb-1 mb-2">
              Modèles de raisonnement
            </h4>
            <ul className="space-y-2">
              {models.reasoning.map((ai) => (
                <li key={`${ai.provider}-${ai.model}`}>
                  <button
                    onClick={() => handleSelectAI(ai)}
                    className="w-full flex items-center p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded hover:from-indigo-600 hover:to-purple-600 transition transform hover:scale-105"
                  >
                    <span className="mr-2 text-xl">{ai.icon}</span>
                    <span className="text-gray-100">{ai.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative z-[10000]">
      <label className="block text-gray-300 font-semibold mb-2">
        Choisissez votre IA :
      </label>
      <button
        onClick={() => setPopupOpen(true)}
        className="w-full p-3 modern-button rounded-lg text-white text-left flex items-center gap-2 shadow glass-morphism"
      >
        <span className="text-2xl">{selectedAI.icon}</span>
        <span className="font-medium">{selectedAI.label}</span>
      </button>
      <p className="mt-2 text-sm text-gray-400 text-center">
        {selectedAI.description}
      </p>
      {isPopupOpen && createPortal(popupContent, document.body)}
    </div>
  );
}
