// app/api/test-story/route.js
import { formatUserStory } from '@/utils/gpt';

export async function POST(request) {
  try {
    const body = await request.json();
    const { transcription } = body;
    
    const formattedStory = await formatUserStory(transcription);
    
    return Response.json({ formattedStory });
  } catch (error) {
    console.error('Server error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}