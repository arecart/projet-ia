import { useState } from 'react';

const models = {
  text: [
    {
      provider: 'gpt',
      model: 'gpt-3.5-turbo',
      label: 'GPT-3.5',
      icon: '🤖',
      description: 'Un modèle polyvalent pour des tâches créatives et analytiques.'
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
      model: 'o3-mini-2025-01-31',
      label: 'O3 Mini',
      icon: '🧠',
      description: 'Modèle optimisé pour le raisonnement et l\'analyse.'
    }
  ],
  image: [] // À venir
};

export default function AISelector({
  selectedProvider,
  selectedModel,
  onProviderChange,
  onModelChange,
}) {
  const [isPopupOpen, setPopupOpen] = useState(false);

  const allModels = [...models.text, ...models.reasoning, ...models.image];
  const selectedAI =
    allModels.find(
      (ai) => ai.provider === selectedProvider && ai.model === selectedModel
    ) || models.text[0];

  const handleSelectAI = (ai) => {
    onProviderChange(ai.provider);
    onModelChange(ai.model);
    setPopupOpen(false);
  };

  return (
    <div className="relative">
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

      {isPopupOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black opacity-70 backdrop-blur-sm z-[100000]"
            onClick={() => setPopupOpen(false)}
          ></div>
          <div className="bg-gray-900 rounded-lg shadow-xl p-4 relative z-[100001] w-11/12 max-w-4xl animate-slideIn">
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
              <div className="w-1/3 px-2">
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
              <div className="w-1/3 px-2">
                <h4 className="text-lg font-medium text-gray-300 border-b border-gray-700 pb-1 mb-2">
                  Modèle de raisonnement
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
              <div className="w-1/3 px-2">
                <h4 className="text-lg font-medium text-gray-300 border-b border-gray-700 pb-1 mb-2">
                  Image
                </h4>
                <div className="p-2 bg-gray-800 rounded text-center text-gray-500 italic">
                  Bientôt disponible
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}