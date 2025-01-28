import { getModel } from '@/old local/transformers';

export async function POST(request) {
  const { prompt, model } = await request.json();
  
  try {
    const generator = getModel(model);
    const output = await generator(prompt, {
      max_new_tokens: 100,
      temperature: 0.7
    });
    
    return Response.json({ text: output[0].generated_text });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}