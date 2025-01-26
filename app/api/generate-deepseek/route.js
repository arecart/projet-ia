import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { prompt, model, stream = false } = await req.json();
    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

    if (!DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { error: 'Clé API Deepseek non configurée' },
        { status: 500 }
      );
    }

    const apiUrl = 'https://api.deepseek.com/v1/chat/completions';

    let modelName;
    if (model === 'deepseek-chat') {
      modelName = 'deepseek-chat';
    } else {
      modelName = 'deepseek-reasoner';
    }

    const requestBody = {
      model: modelName,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 5000,
      stream: stream
    };

    console.log('Sending request to Deepseek:', {
      url: apiUrl,
      body: requestBody
    });

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Deepseek API error:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      
      return NextResponse.json(
        { 
          error: `Erreur API Deepseek: ${response.status} - ${errorData.error?.message || response.statusText}` 
        },
        { status: response.status }
      );
    }

    if (stream) {
      // Mode streaming
      return new Response(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      const data = await response.json();
      
      if (!data.choices || !data.choices[0]) {
        throw new Error('Réponse invalide de l\'API Deepseek');
      }

      const responseData = {
        text: data.choices[0].message?.content,
      };

      if (data.choices[0].message?.reasoning_content) {
        responseData.reasoning_content = data.choices[0].message.reasoning_content;
      }

      return NextResponse.json(responseData);
    }

  } catch (error) {
    console.error('Erreur complète Deepseek:', error);
    
    return NextResponse.json(
      { 
        error: "Erreur lors de la génération avec Deepseek: " + 
               (error.message || 'Erreur inconnue')
      },
      { status: 500 }
    );
  }
}
