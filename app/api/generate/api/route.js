import { queryHuggingFace } from '@/app/ai';

const MODELS = {
  mistral: "mistralai/Mistral-7B-Instruct-v0.3",
  zephyr: "HuggingFaceH4/zephyr-7b-beta",
};

export async function POST(request) {
  const { prompt, model } = await request.json();
  
  try {
    const selectedModel = MODELS[model] || MODELS.mistral;
    const result = await queryHuggingFace(selectedModel, prompt);
    return Response.json({ text: result || "⚠️ Réponse vide" });
  } catch (error) {
    try {
      const fallbackResult = await queryHuggingFace(MODELS.fallback, prompt);
      return Response.json({ text: fallbackResult || "⚠️ Réponse vide (Fallback)" });
    } catch (fallbackError) {
      return Response.json({ error: "Échec total de la génération" }, { status: 500 });
    }
  }
}