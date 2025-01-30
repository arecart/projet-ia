import { NextResponse } from 'next/server';
import { handleMistralGeneration } from './mistral/route';
import { handleGPTGeneration } from './gpt/route';

export async function POST(request) {
  try {
    const data = await request.json();
    const { provider, model, prompt } = data;

    console.log('DEBUG - Route principale:');
    console.log('Provider reçu:', provider);
    console.log('Autres données:', { model, prompt });

    let response;
    
    if (provider === 'mistral') {
      console.log('DEBUG - Redirection vers Mistral');
      // Passer les données déjà extraites
      response = await handleMistralGeneration(request, { model, prompt });
    } else {
      console.log('DEBUG - Redirection vers GPT');
      response = await handleGPTGeneration(request, { model, prompt });
    }

    return response;

  } catch (error) {
    console.error('Error in main generate route:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
