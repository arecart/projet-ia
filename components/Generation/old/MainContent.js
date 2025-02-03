// components/MainContent.jsx
import React from 'react';
import ProviderSelector from '../AISelector';
import QuotaDisplay from './QuotaDisplay';
import PromptInput from './PromptInput';
import GenerationResult from './GenerationResult';

export default function MainContent({
  selectedProvider,
  selectedModel,
  onProviderChange,
  onModelChange,
  quotaInfo,
  prompt,
  charCount,
  onPromptChange,
  onClearPrompt,
  onGenerate,
  loading,
  formState,
  onCopy,
  copySuccess
}) {
  // Calcul du pourcentage du quota restant (en évitant la division par zéro)
  const quotaPercentage = quotaInfo.max ? quotaInfo.remaining / quotaInfo.max : 1;

  return (
    <div className="glass-morphism text-white shadow-2xl rounded-2xl p-8 w-full max-w-lg animate__animated animate__fadeIn hover-card">
      <h1 className="text-4xl font-extrabold text-center mb-8">
        <span className="title-gradient">Projet WebGPU & API IA</span>
      </h1>

      {/* Sélecteur de provider (ex : GPT ou Mistral) */}
      <ProviderSelector
        selectedProvider={selectedProvider}
        selectedModel={selectedModel}
        onProviderChange={onProviderChange}
        onModelChange={onModelChange}
      />

      {/* Affichage du quota associé au provider sélectionné */}
      <QuotaDisplay quotaInfo={quotaInfo} />

      {/* Zone de saisie du prompt */}
      <PromptInput
        prompt={prompt}
        charCount={charCount}
        onChange={onPromptChange}
        onClear={onClearPrompt}
      />

      {/* Bouton de génération, désactivé en cas de chargement ou si le quota est épuisé */}
      <button
        onClick={onGenerate}
        className="modern-button loading-button w-full"
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

      {/* Alerte si le quota est presque épuisé */}
      {quotaInfo.remaining <= 5 && quotaInfo.remaining > 0 && (
        <div className="mt-4 p-3 bg-yellow-500/20 text-yellow-300 rounded-xl text-sm">
          ⚠️ Attention : Il ne vous reste que {quotaInfo.remaining} requête
          {quotaInfo.remaining > 1 ? 's' : ''} !
        </div>
      )}


      {/* Affichage du résultat de génération */}
      {formState.result && (
        <GenerationResult
          result={formState.result}
          selectedProvider={selectedProvider}
          selectedModel={selectedModel}
          onCopy={onCopy}
          copySuccess={copySuccess}
        />
      )}
    </div>
  );
}
