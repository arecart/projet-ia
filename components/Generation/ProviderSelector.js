// ProviderSelector.jsx
export default function ProviderSelector({ selectedProvider, selectedModel, onProviderChange, onModelChange }) {
  const handleChange = (e) => {
    const newProvider = e.target.value;
    onProviderChange(newProvider);
    // Mettez à jour le modèle par défaut selon le provider choisi
    if (newProvider === 'mistral') {
      onModelChange('mistral-small-latest');
    } else {
      onModelChange('gpt-3.5-turbo');
    }
  };

  return (
    <div className="mb-6">
      <label className="block text-white font-semibold mb-2">Choisissez votre fournisseur :</label>
      <select
        value={selectedProvider}
        onChange={handleChange}
        className="w-full p-3 border rounded-xl bg-gray-800 text-white transition-all duration-300"
      >
        <option value="gpt">OpenAI (GPT-3.5 Turbo)</option>
        <option value="mistral">Mistral (Small 24.09 / Codestral)</option>
      </select>
      {selectedProvider === 'mistral' && (
        <div className="mt-4">
          <label className="block text-white font-semibold mb-2">Sélectionnez le modèle :</label>
          <select
            value={selectedModel}
            onChange={(e) => onModelChange(e.target.value)}
            className="w-full p-3 border rounded-xl bg-gray-800/80 text-white"
          >
            <option value="mistral-small-latest">Mistral Small 24.09</option>
            <option value="codestral-latest">Codestral</option>
          </select>
        </div>
      )}
    </div>
  );
}
