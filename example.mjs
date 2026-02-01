import OpenAI from "openai";
import { createClient } from '@supabase/supabase-js';

// Get session_id from command line arguments
const sessionId = process.argv[2];

if (!sessionId) {
  console.error("❌ Error: session_id is required as first argument");
  process.exit(1);
}

// Initialize OpenAI client with the specific Munazir Organization ID
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, 
  organization: "org-TNbp13HHLuhYEKqloGkvVfg6" // Added to match your successful Python test
});

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

// All 8 allowed genres
const ALLOWED_GENRES = ["politics", "engager", "romance", "celebration", "tipik", "seggae", "hotel", "modern"];

// Shuffle array function
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

async function generateSegaLyrics() {
  try {
    console.log(`🎵 Starting specialized Sega generation for session: ${sessionId}`);
    
    // Randomize genres and select only 5
    const randomizedGenres = shuffleArray(ALLOWED_GENRES);
    const selectedGenres = randomizedGenres.slice(0, 5); 
    
    console.log(`🎲 Selected genres: ${selectedGenres.join(', ')}`);

    const prompt = `
Generate exactly 5 original Sega/Seggae lyrics in Mauritian Creole using your specialized training.

GENRE SEQUENCE: ${selectedGenres.join(', ')}

STRUCTURE & FLOW:
- Each song MUST have exactly 3 stanzas (separated by \\n\\n).
- Avoid short, clipped lines. Aim for a natural "rhythme trainé" where each stanza has 4-6 descriptive lines.
- Develop a narrative or a specific "tableau" (scene) for each verse to ensure the lyrics feel substantial and human-written.
- Use authentic local phrasing that captures the "tripo" of the island.

Return ONLY a valid JSON object in this exact format:
{
  "session_id": "${sessionId}",
  "lyrics": [
    { "genre": "${selectedGenres[0]}", "lyrics": "verse 1\\n\\nverse 2\\n\\nverse 3" },
    { "genre": "${selectedGenres[1]}", "lyrics": "verse 1\\n\\nverse 2\\n\\nverse 3" },
    { "genre": "${selectedGenres[2]}", "lyrics": "verse 1\\n\\nverse 2\\n\\nverse 3" },
    { "genre": "${selectedGenres[3]}", "lyrics": "verse 1\\n\\nverse 2\\n\\nverse 3" },
    { "genre": "${selectedGenres[4]}", "lyrics": "verse 1\\n\\nverse 2\\n\\nverse 3" }
  ]
}

IMPORTANT: Return valid JSON only. Use lowercase genre names. No preamble.
`;

    console.log("🚀 Calling fine-tuned model...");
    
    const response = await client.chat.completions.create({
      model: "ft:gpt-4o-mini-2024-07-18:munazir:sega-llm-primary-odin:D4BxIHVt",
      messages: [
        { 
          role: "system", 
          content: "You are a master Mauritian Sega lyricist specialized in authentic storytelling. You only output valid JSON." 
        },
        { 
          role: "user", 
          content: prompt 
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.75,
      max_tokens: 3500
    });

    const content = response.choices[0].message.content.trim();
    const lyricsData = JSON.parse(content);
    
    if (!lyricsData.lyrics || !Array.isArray(lyricsData.lyrics)) {
      throw new Error("Invalid JSON structure returned from model");
    }

    // Prepare rows for Supabase
    const normalizedRows = lyricsData.lyrics.slice(0, 5).map((lyric) => {
      const normalizedGenre = lyric.genre.toLowerCase().trim();
      const randomNum = Math.floor(Math.random() * 1001);
      const aiId = `${normalizedGenre}_${randomNum}`;
      
      return {
        session_id: sessionId,
        genre: normalizedGenre,
        ai_id: aiId,
        lyrics: lyric.lyrics
      };
    });

    console.log("💾 Inserting into session_ai_lyrics...");
    const { data: insertData, error: insertError } = await supabase
      .from('session_ai_lyrics')
      .insert(normalizedRows);

    if (insertError) throw insertError;

    console.log(`🎉 SUCCESS: 5 lyrics saved for session: ${sessionId}`);
    return { status: "success", count: normalizedRows.length };

  } catch (error) {
    console.error("❌ Error in generation process:", error.message);
    process.exit(1);
  }
}

generateSegaLyrics();