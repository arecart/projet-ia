// components/GenerationResult.jsx
export default function GenerationResult({ result, selectedProvider, selectedModel, onCopy, copySuccess }) {
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
  
  return (
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
          onClick={onCopy}
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
        {result.text}
      </p>
    </div>
  );
}
