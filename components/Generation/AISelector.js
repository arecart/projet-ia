'use client';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';

const openaiLogo = "/openai-logo.png";
const mistralLogo = "/mistral-logo.png";

const models = {
  gpt: [
    { provider: 'gpt', model: 'gpt-4o-mini-2024-07-18', label: 'GPT-4o Mini', icon: openaiLogo, description: 'Modèle léger pour des réponses rapides.' },
    { provider: 'gpt', model: 'gpt-4o', label: 'GPT-4o', icon: openaiLogo, description: 'Modèle puissant pour des tâches exigeantes.' },
    { provider: 'gpt', model: 'o1-mini-2024-09-12', label: 'O1 Mini', icon: openaiLogo, description: 'Optimisé pour le raisonnement et l’analyse.' },
    { provider: 'gpt', model: 'dall-e-3', label: 'DALL-E 3', icon: openaiLogo, description: 'Générateur d’images à partir de texte ou d’images.' }, // Added DALL-E 3
  ],
  mistral: [
    { provider: 'mistral', model: 'mistral-small-latest', label: 'Mistral Small 3', icon: mistralLogo, description: 'Modèle léger pour des réponses rapides.' },
    { provider: 'mistral', model: 'mistral-large-latest', label: 'Mistral Large 24.11', icon: mistralLogo, description: 'Modèle puissant pour des tâches exigeantes.' },
    { provider: 'mistral', model: 'pixtral-large-latest', label: 'Pixtral Large', icon: mistralLogo, description: 'Optimisé pour le raisonnement et l’analyse.' },
  ],
};

export default function AISelector({ selectedProvider, selectedModel, onProviderChange, onModelChange, debug = false }) {
  const [isPopupOpen, setPopupOpen] = useState(false);
  const allModels = Object.values(models).flat();
  const selectedAI = allModels.find((ai) => ai.provider === selectedProvider && ai.model === selectedModel) || allModels[0];

  const handleSelectAI = (ai) => {
    onProviderChange(ai.provider);
    onModelChange(ai.model);
    setPopupOpen(false);
  };

  const popupContent = (
    <div className="fixed inset-0 z-[11000] flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-70 backdrop-blur-sm" onClick={() => setPopupOpen(false)}></div>
      <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-6 relative w-11/12 max-w-4xl animate-slideIn">
        <button
          onClick={() => setPopupOpen(false)}
          className="absolute top-3 right-3 text-gray-300 hover:text-white transition-colors"
          title="Fermer"
        >
          ✕
        </button>
        <h3 className="text-2xl font-bold text-white mb-6 text-center">Sélectionnez une IA</h3>
        <div className="flex gap-6">
          {Object.entries(models).map(([providerName, providerModels]) => (
            <div key={providerName} className="flex-1">
              <h4 className="text-lg font-medium text-gray-300 border-b border-gray-600 pb-1 mb-4 text-center">
                {providerName.toUpperCase()}
              </h4>
              <div className="flex flex-col gap-4">
                {providerModels.map((ai) => (
                  <button
                    key={`${ai.provider}-${ai.model}`}
                    onClick={() => handleSelectAI(ai)}
                    className="flex items-center p-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-transform transform hover:scale-105"
                  >
                    <div className="mr-3">
                      <Image src={ai.icon} alt={ai.label} width={40} height={40} />
                    </div>
                    <div className="text-left">
                      <span className="block text-white font-semibold">{ai.label}</span>
                      <span className="block text-xs text-gray-200">{ai.description}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative z-[10000]">
      <label className="block text-gray-300 font-semibold mb-2">Choisissez votre IA :</label>
      <button
        onClick={() => setPopupOpen(true)}
        className="w-full p-4 modern-button rounded-lg text-white text-left flex items-center gap-3 shadow glass-morphism"
      >
        <div className="mr-3">
          <Image src={selectedAI.icon} alt={selectedAI.label} width={40} height={40} />
        </div>
        <div>
          <span className="block font-medium">{selectedAI.label}</span>
          <span className="block text-sm text-gray-400">{selectedAI.description}</span>
        </div>
      </button>
      {isPopupOpen && createPortal(popupContent, document.body)}
    </div>
  );
}