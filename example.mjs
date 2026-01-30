import OpenAI from "openai";
import { createClient } from '@supabase/supabase-js';

// Get session_id from command line arguments
const sessionId = process.argv[2];

if (!sessionId) {
  console.error("❌ Error: session_id is required as first argument");
  process.exit(1);
}

// Initialize OpenAI client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, 
});

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

// All 6 allowed genres
const ALLOWED_GENRES = ["politics", "engager", "romance", "celebration", "tipik", "seggae"];

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
    console.log(`🎵 Starting Sega lyrics generation for session: ${sessionId}`);
    
    // Randomize genres for this session
    const randomizedGenres = shuffleArray(ALLOWED_GENRES);
    console.log(`🎲 Randomized genres order: ${randomizedGenres.join(', ')}`);

    const prompt = `
You are a master Mauritian Sega and Seggae lyricist. Generate exactly 6 Sega/Seggae lyrics, each with exactly 3 verses.

Use these genres in this exact order: ${randomizedGenres.join(', ')}

Requirements:
- Each lyric must have exactly 3 verses
- Each verse should be 4-6 lines long
- Use authentic Mauritian Creole words and expressions where appropriate
- Capture the rhythm and soul of traditional Sega music
- Make them culturally authentic and meaningful
- Separate verses with double newlines (\\n\\n)

Genre descriptions:
- Politics: Social issues, governance, community concerns in Mauritius
- Engager: Modern social engagement, contemporary issues, activism
- Tipik: Traditional authentic Mauritian Sega with cultural elements
- Romance: Love, relationships, heartbreak in Mauritian context
- Celebration: Festive songs for parties, joy, community gatherings
- Seggae: Fusion of Sega and Reggae, with social consciousness themes

Return ONLY a valid JSON object in this exact format:
{
  "session_id": "${sessionId}",
  "lyrics": [
    {
      "genre": "${randomizedGenres[0]}",
      "lyrics": "verse 1\\n\\nverse 2\\n\\nverse 3"
    },
    {
      "genre": "${randomizedGenres[1]}", 
      "lyrics": "verse 1\\n\\nverse 2\\n\\nverse 3"
    },
    {
      "genre": "${randomizedGenres[2]}",
      "lyrics": "verse 1\\n\\nverse 2\\n\\nverse 3"
    },
    {
      "genre": "${randomizedGenres[3]}",
      "lyrics": "verse 1\\n\\nverse 2\\n\\nverse 3"
    },
    {
      "genre": "${randomizedGenres[4]}",
      "lyrics": "verse 1\\n\\nverse 2\\n\\nverse 3"
    },
    {
      "genre": "${randomizedGenres[5]}",
      "lyrics": "verse 1\\n\\nverse 2\\n\\nverse 3"
    }
  ]
}

IMPORTANT: Use the exact genre names in lowercase: ${randomizedGenres.join(', ')}
`;

    console.log("🚀 Sending request to OpenAI...");
    
    const response = await client.chat.completions.create({
      model: "gpt-4.1-nano", // Updated to a valid model name
      messages: [
        { 
          role: "system", 
          content: "You are a master Mauritian Sega lyricist. Always respond with valid JSON only." 
        },
        { 
          role: "user", 
          content: prompt 
        }
      ],
      response_format: { type: "json_object" }, // Ensures valid JSON output
      temperature: 0.8,
      max_tokens: 3000
    });

    const content = response.choices[0].message.content.trim();
    
    // Parse and validate JSON
    const lyricsData = JSON.parse(content);
    
    if (!lyricsData.session_id || !lyricsData.lyrics || !Array.isArray(lyricsData.lyrics)) {
      throw new Error("Invalid JSON structure returned from OpenAI");
    }

    // Step 1: Initialize dbPayload with default values
    const dbPayload = {
      session_id: sessionId,
      politics_ai_id: "-",
      politics_ai_sega: "-",
      engager_ai_id: "-",
      engager_ai_sega: "-",
      romance_ai_id: "-",
      romance_ai_sega: "-",
      celebration_ai_id: "-",
      celebration_ai_sega: "-",
      tipik_ai_id: "-",
      tipik_ai_sega: "-",
      seggae_ai_id: "-",
      seggae_ai_sega: "-"
    };

    // Step 2: Populate dbPayload with custom ID logic
    console.log("🔄 Mapping genres to specific IDs...");
    lyricsData.lyrics.forEach((lyric) => {
      const normalizedGenre = lyric.genre.toLowerCase().trim();
      
      if (ALLOWED_GENRES.includes(normalizedGenre)) {
        const idKey = `${normalizedGenre}_ai_id`;
        const segaKey = `${normalizedGenre}_ai_sega`;
        
        // Generate a random number between 0 and 1000
        const randomNum = Math.floor(Math.random() * 1001);
        
        // Format: politics_452, tipik_12, etc.
        dbPayload[idKey] = `${normalizedGenre}_${randomNum}`;
        dbPayload[segaKey] = lyric.lyrics;
        
        console.log(` ✅ Generated ID for ${normalizedGenre}: ${dbPayload[idKey]}`);
      }
    });

    // Step 4: Upsert to database
    console.log("💾 Saving to database...");
    const { data: upsertData, error: upsertError } = await supabase
      .from('survey_ai_lyrics')
      .upsert(dbPayload, {
        onConflict: 'session_id'
      });

    if (upsertError) throw upsertError;

    console.log("🎉 SUCCESS: Lyrics saved with unique genre IDs.");
    return { status: "success", session_id: sessionId };

  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

generateSegaLyrics();