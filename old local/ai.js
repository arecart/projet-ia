import OpenAI from 'openai';
import axios from 'axios';

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const HF_AUTH_TOKEN = process.env.HF_AUTH_TOKEN;

export async function queryHuggingFace(model, prompt) {
  try {
    const response = await axios.post(
      `https://api-inference.huggingface.co/models/${model}`,
      {
        inputs: `Réponds uniquement en français: ${prompt}`,
        parameters: {
          temperature: 0.7,
          max_new_tokens: 1200,
          top_p: 0.95,
          top_k: 50,
          do_sample: true
        }
      },
      {
        headers: { 
          "Authorization": `Bearer ${HF_AUTH_TOKEN}`,
          "Content-Type": "application/json"
        },
        timeout: 60000
      }
    );
    
    return response.data[0]?.generated_text;
  } catch (error) {
    throw new Error(`Erreur API Hugging Face: ${error.message}`);
  }
}