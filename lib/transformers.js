import { pipeline } from '@xenova/transformers';

const MODEL_CONFIG = {
  'Xenova/distilgpt2': null,
  'Xenova/gpt2': null
};

let isInitialized = false;

export async function initializeModels() {
  if (isInitialized) return;
  
  console.log('Initialisation des modèles WebGPU...');
  
  for (const modelName of Object.keys(MODEL_CONFIG)) {
    try {
      MODEL_CONFIG[modelName] = await pipeline('text-generation', modelName, {
        device: 'webgpu',
        quantized: true
      });
      console.log(`${modelName} chargé ✅`);
    } catch (error) {
      console.error(`Erreur chargement ${modelName}:`, error);
      delete MODEL_CONFIG[modelName];
    }
  }
  
  isInitialized = true;
}

export function getModel(modelName) {
  if (!MODEL_CONFIG[modelName]) {
    throw new Error(`Modèle ${modelName} non disponible`);
  }
  return MODEL_CONFIG[modelName];
}