import { useState } from 'react';

export const useGeneration = (setQuotaInfo) => {
  const [formState, setFormState] = useState({ error: null, result: null });
  const [loading, setLoading] = useState(false);

  const generateText = async (prompt, selectedProvider, selectedModel, context = "") => {
    if (!prompt.trim()) return;
    
    try {
      setLoading(true);
      
      const quotaResponse = await fetch('/api/quota/decrement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

      const quotaData = await quotaResponse.json();
      setQuotaInfo(quotaData);

      const generationResponse = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          provider: selectedProvider, 
          model: selectedModel, 
          prompt,
          context,
        }),
        credentials: 'include'
      });

      if (!generationResponse.ok) throw new Error('Erreur lors de la génération');

      const result = await generationResponse.json();
      // Assurez-vous que le résultat inclut le provider
      setFormState({ 
        error: null, 
        result: { 
          text: result.text, 
          provider: selectedProvider // Inclure explicitement le provider
        } 
      });
    } catch (error) {
      setFormState({ error: error.message, result: null });
    } finally {
      setLoading(false);
    }
  };

  return { formState, loading, generateText };
};

export default useGeneration;