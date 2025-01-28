import { initializeModels } from '@/old local/transformers';

export async function GET() {
  try {
    await initializeModels();
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}