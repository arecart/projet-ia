import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import { verify } from '@/utils/jwt';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function trackUsage(tokenCookie, userId, modelName, promptTokens, completionTokens, totalTokens) {
  try {
    const response = await fetch('http://localhost:3000/api/track-usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: `token=${tokenCookie}` },
      body: JSON.stringify({ userId, modelName, promptTokens, completionTokens, totalTokens }),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    return null;
  }
}

export async function handleDallEGeneration(request, data) {
  try {
    // Verify user authentication
    const cookieStore = request.cookies.get('token');
    const tokenCookie = cookieStore?.value;
    let userId = null;

    if (tokenCookie) {
      const decoded = await verify(tokenCookie);
      userId = decoded.userId;
    }
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Extract prompt and optional image from the request data
    const { prompt, image } = data;
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const modelName = "dall-e-3";

    // Prepare the request for DALL-E 3
    // DALL-E 3 primarily generates images from text prompts.
    // If an image is provided, we can describe it in the prompt to inspire the generation.
    let finalPrompt = prompt;

    if (image) {
      // If an image is provided, we can append a note to the prompt to inspire the generation
      finalPrompt = `${prompt} (inspired by the provided image)`;
      console.log('Image provided, using it as inspiration for DALL-E 3 generation.');
    }

    // Call DALL-E 3 API to generate an image
    const response = await openai.images.generate({
      model: modelName,
      prompt: finalPrompt,
      n: 1, // Number of images to generate (DALL-E 3 typically generates one at a time)
      size: "1024x1024", // DALL-E 3 supports specific sizes, e.g., 1024x1024
      response_format: "url", // Return the image as a URL
    });

    // Extract the generated image URL
    const imageUrl = response.data[0].url;

    // Since DALL-E 3 doesn't provide token usage for image generation, we can mock usage data
    const mockUsage = {
      prompt_tokens: prompt.length, // Approximate token count based on prompt length
      completion_tokens: 0, // No text output, so 0
      total_tokens: prompt.length,
    };

    // Track usage (if applicable)
    await trackUsage(tokenCookie, userId, modelName, mockUsage.prompt_tokens, mockUsage.completion_tokens, mockUsage.total_tokens);

    // Return the generated image URL
    return NextResponse.json({ imageUrl, usage: mockUsage });
  } catch (error) {
    console.error('Error in DALL-E 3 generation:', error);
    return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 });
  }
}

export async function POST(request) {
  const data = await request.json();
  return handleDallEGeneration(request, data);
}