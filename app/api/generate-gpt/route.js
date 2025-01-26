import { openai } from '@/lib/ai';

export async function POST(request) {
  const { prompt } = await request.json();

  if (!prompt?.trim()) {
    return Response.json({ error: "Prompt vide" }, { status: 400 });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
      temperature: 0.7,
    });

    return Response.json({ 
      text: completion.choices[0].message.content 
    });
    
  } catch (error) {
    console.error('Erreur GPT:', error);
    return Response.json({ 
      error: "Erreur lors de la génération GPT" 
    }, { status: 500 });
  }
}