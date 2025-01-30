import { NextResponse } from 'next/server';
import { verify } from '@/utils/jwt';

async function trackUsage(tokenCookie, userId, modelName, promptTokens, completionTokens, totalTokens) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/track-usage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${tokenCookie}`,
      },
      body: JSON.stringify({
        userId,
        modelName,
        promptTokens,
        completionTokens,
        totalTokens,
      }),
    });

    if (!response.ok) {
      console.error('Track usage failed:', response.status);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error('Track usage error:', error.message);
    return null;
  }
}

export async function handleMistralGeneration(request, requestData) {
  try {
    const cookieStore = request.cookies.get('token');
    const tokenCookie = cookieStore?.value;
    if (!tokenCookie) {
      return NextResponse.json(
        { error: 'Authentication required (missing token)' },
        { status: 401 }
      );
    }

    const { prompt, model } = requestData;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    let userId;
    try {
      const decoded = await verify(tokenCookie);
      userId = decoded.userId;
    } catch {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    const endpointUrl = 'https://api.mistral.ai/v1/chat/completions';

    const requestBody = {
      model: model || 'mistral-small-latest',
      messages: [{ role: 'user', content: prompt }],
    };

    const mistralResponse = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!mistralResponse.ok) {
      console.error('Mistral error:', mistralResponse.status);
      return NextResponse.json(
        { error: `Mistral endpoint error: ${mistralResponse.status}` },
        { status: 500 }
      );
    }

    const responseData = await mistralResponse.json();

    const text = responseData?.choices?.[0]?.message?.content || '';
    let promptTokens = 0;
    let completionTokens = 0;
    let totalTokens = 0;

    if (responseData?.usage) {
      promptTokens = responseData.usage.prompt_tokens || 0;
      completionTokens = responseData.usage.completion_tokens || 0;
      totalTokens = responseData.usage.total_tokens || 0;
    }

    await trackUsage(tokenCookie, userId, model, promptTokens, completionTokens, totalTokens);

    return NextResponse.json({
      text,
      usage: responseData?.usage || null,
    });

  } catch (error) {
    console.error('Mistral route error:', error);
    return NextResponse.json(
      { error: error.message || 'Mistral Error' },
      { status: 500 }
    );
  }
}
