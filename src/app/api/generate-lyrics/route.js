import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Generate AI lyrics for all genres
const generateAllLyrics = async (sessionId) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `
Generate 5 Mauritian sega lyrics, each with exactly 3 verses. Each lyric should be in a different genre:

1. Politics - A sega about political themes, social issues, or governance in Mauritius
2. Romance - A romantic sega about love, relationships, or heartbreak
3. Celebration - A festive sega for celebrations, parties, or joyful occasions
4. Sega Tipik - Traditional authentic Mauritian sega with cultural elements
5. Sega Engager - Modern engaging sega with contemporary themes

Requirements:
- Each lyric must have exactly 3 verses
- Keep the authentic Mauritian sega style and rhythm
- Use some Mauritian Creole words where appropriate
- Each verse should be 4-6 lines long
- Make them culturally authentic and meaningful

Return the response as a JSON object with this exact structure:
{
  "politics": "verse 1\\n\\nverse 2\\n\\nverse 3",
  "romance": "verse 1\\n\\nverse 2\\n\\nverse 3",
  "celebration": "verse 1\\n\\nverse 2\\n\\nverse 3",
  "tipik": "verse 1\\n\\nverse 2\\n\\nverse 3",
  "engager": "verse 1\\n\\nverse 2\\n\\nverse 3"
}

Only return the JSON object, no additional text.
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response
    const lyricsData = JSON.parse(text);
    
    // Generate IDs and structure the data for database insertion
    const structuredData = {
      politics_ai_id: `politics_${Math.floor(Math.random() * 1000) + 1}`,
      politics_ai_sega: lyricsData.politics,
      engager_ai_id: `engager_${Math.floor(Math.random() * 1000) + 1}`,
      engager_ai_sega: lyricsData.engager,
      romance_ai_id: `romance_${Math.floor(Math.random() * 1000) + 1}`,
      romance_ai_sega: lyricsData.romance,
      celebration_ai_id: `celebration_${Math.floor(Math.random() * 1000) + 1}`,
      celebration_ai_sega: lyricsData.celebration,
      tipik_ai_id: `tipik_${Math.floor(Math.random() * 1000) + 1}`,
      tipik_ai_sega: lyricsData.tipik
    };

    return structuredData;
  } catch (error) {
    console.error('Error generating AI lyrics:', error);
    throw new Error(`Failed to generate AI lyrics: ${error.message}`);
  }
};

export async function POST(request) {
  try {
    const body = await request.json();
    const { session_id } = body;

    console.log('Starting AI lyrics generation for session:', session_id);

    if (!session_id) {
      return Response.json({ error: 'session_id is required' }, { status: 400 });
    }

    // Check if lyrics already exist for this session
    const { data: existing, error: checkError } = await supabase
      .from('survey_ai_lyrics')
      .select('session_id')
      .eq('session_id', session_id)
      .single();

    if (existing) {
      console.log('AI lyrics already exist for session:', session_id);
      return Response.json({ success: true, message: 'Lyrics already generated' });
    }

    // First, insert the session_id immediately into survey_ai_lyrics table ONLY
    console.log('Inserting session_id into survey_ai_lyrics...');
    const { error: insertError } = await supabase
      .from('survey_ai_lyrics')
      .insert([{ session_id }]);

    if (insertError) {
      console.error('Error inserting session_id:', insertError);
      return Response.json({ 
        error: `Failed to insert session_id: ${insertError.message}` 
      }, { status: 500 });
    }

    // Now generate AI lyrics using Gemini (this happens in background)
    console.log('Generating AI lyrics with Gemini...');
    try {
      const lyricsData = await generateAllLyrics(session_id);

      // Update the existing record with the generated lyrics
      console.log('Updating record with generated lyrics...');
      const { error: updateError } = await supabase
        .from('survey_ai_lyrics')
        .update({
          politics_ai_id: lyricsData.politics_ai_id,
          politics_ai_sega: lyricsData.politics_ai_sega,
          engager_ai_id: lyricsData.engager_ai_id,
          engager_ai_sega: lyricsData.engager_ai_sega,
          romance_ai_id: lyricsData.romance_ai_id,
          romance_ai_sega: lyricsData.romance_ai_sega,
          celebration_ai_id: lyricsData.celebration_ai_id,
          celebration_ai_sega: lyricsData.celebration_ai_sega,
          tipik_ai_id: lyricsData.tipik_ai_id,
          tipik_ai_sega: lyricsData.tipik_ai_sega,
          seggae_ai_id: lyricsData.seggae_ai_id,
          seggae_ai_sega: lyricsData.seggae_ai_sega
        })
        .eq('session_id', session_id);

      if (updateError) {
        console.error('Error updating with lyrics:', updateError);
        return Response.json({ 
          success: true, 
          message: 'Session created but lyrics generation failed',
          error: updateError.message 
        });
      }

      console.log('AI lyrics generation completed for session:', session_id);
      return Response.json({ 
        success: true, 
        message: 'AI lyrics generated and stored successfully',
        data: lyricsData 
      });

    } catch (lyricsError) {
      console.error('Error generating lyrics:', lyricsError);
      // Session_id is already inserted, just return success with error note
      return Response.json({ 
        success: true, 
        message: 'Session created but lyrics generation failed',
        error: lyricsError.message 
      });
    }

  } catch (error) {
    console.error('API error in generate-lyrics:', error);
    return Response.json({ 
      error: `Failed to process request: ${error.message}` 
    }, { status: 500 });
  }
}