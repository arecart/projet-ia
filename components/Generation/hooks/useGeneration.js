// hooks/useGeneration.js
import { useState } from 'react';

export const useGeneration = (setQuotaInfo) => {
  const [formState, setFormState] = useState({ error: null, result: null });
  const [loading, setLoading] = useState(false);

  /**
   * Génère du texte en décrémentant d'abord le quota, puis en envoyant la requête de génération.
   * @param {string} prompt Le prompt à envoyer.
   * @param {string} selectedProvider Le provider sélectionné (par ex. 'gpt' ou 'mistral').
   * @param {string} selectedModel Le modèle sélectionné.
   * @param {string} context Le contexte (ex : l'historique des 20 derniers messages) à inclure dans la requête.
   */
  const generateText = async (prompt, selectedProvider, selectedModel, context = "") => {
    if (!prompt.trim()) return;
    
    try {
      setLoading(true);
      
      // Décrémente le quota
      const quotaResponse = await fetch('/api/quota/decrement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ model: selectedModel }),
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

      // Met à jour le quota avec la réponse de l'API
      const quotaData = await quotaResponse.json();
      setQuotaInfo(quotaData);

      // Lancement de la génération en incluant le contexte
      const generationResponse = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          provider: selectedProvider, 
          model: selectedModel, 
          prompt,
          context,  // Contexte pour permettre à l'IA de se rappeler de l'historique
        }),
        credentials: 'include'
      });

      if (!generationResponse.ok) throw new Error('Erreur lors de la génération');

      const result = await generationResponse.json();
      setFormState({ error: null, result });
    } catch (error) {
      setFormState({ error: error.message, result: null });
    } finally {
      setLoading(false);
    }
  };

  return { formState, loading, generateText };
};

export default useGeneration;
