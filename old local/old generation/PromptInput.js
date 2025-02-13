// components/PromptInput.jsx
export default function PromptInput({ prompt, charCount, onChange, onClear }) {
  return (
    <div className="mb-6">
      <label className="block font-semibold text-lg mb-3">Prompt :</label>
      <textarea
        value={prompt}
        onChange={onChange}
        className="w-full p-4 border rounded-xl bg-gray-800/80 text-white input-focus placeholder-gray-400 min-h-[150px] transition-all duration-300 custom-scrollbar"
        placeholder="Décrivez votre requête..."
        maxLength="1000"
      ></textarea>
      <div className="text-sm text-gray-400 mt-2 flex justify-between">
        <span>{charCount} / 1000</span>
        <button 
          onClick={onClear} 
          className="hover:text-white transition-colors duration-300"
        >
          Effacer
        </button>
      </div>
    </div>
  );
}
