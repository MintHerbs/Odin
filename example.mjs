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
    console.log(`🎲 Randomized genres: ${randomizedGenres.join(', ')}`);

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
      model: "gpt-4.1-nano",
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
      temperature: 0.8,
      max_tokens: 3000
    });

    const content = response.choices[0].message.content.trim();
    console.log("📄 Raw OpenAI Response:");
    console.log("---START RESPONSE---");
    console.log(content);
    console.log("---END RESPONSE---");

    // Parse and validate JSON
    const lyricsData = JSON.parse(content);
    
    // Validate structure
    if (!lyricsData.session_id || !lyricsData.lyrics || !Array.isArray(lyricsData.lyrics)) {
      throw new Error("Invalid JSON structure returned from OpenAI");
    }

    if (lyricsData.lyrics.length !== 6) {
      throw new Error(`Expected 6 lyrics, got ${lyricsData.lyrics.length}`);
    }

    console.log("✅ Successfully generated and parsed Sega lyrics!");
    console.log("🎵 PARSED RESULT:");
    console.log(JSON.stringify(lyricsData, null, 2));

    // Step 1: Initialize dbPayload with all 12 attributes set to "-"
    console.log("📦 Initializing database payload...");
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

    // Step 2: Iterate through AI results and populate dbPayload
    console.log("🔄 Processing AI lyrics and mapping to database structure...");
    lyricsData.lyrics.forEach((lyric, index) => {
      // Normalize genre to lowercase
      const normalizedGenre = lyric.genre.toLowerCase().trim();
      
      console.log(`  Processing lyric ${index + 1}: genre="${normalizedGenre}"`);
      
      // Step 3: Verify genre is in allowed list
      if (ALLOWED_GENRES.includes(normalizedGenre)) {
        const idKey = `${normalizedGenre}_ai_id`;
        const segaKey = `${normalizedGenre}_ai_sega`;
        
        // Generate ID in format: genre_1, genre_2, etc.
        dbPayload[idKey] = `${normalizedGenre}_${index + 1}`;
        dbPayload[segaKey] = lyric.lyrics;
        
        console.log(`    ✅ Mapped to ${idKey} and ${segaKey}`);
      } else {
        console.warn(`    ⚠️  Genre "${normalizedGenre}" not in allowed list, skipping`);
      }
    });

    console.log("📊 Final database payload:");
    console.log(JSON.stringify(dbPayload, null, 2));

    // Step 4: Upsert to database
    console.log("💾 Saving to database...");
    const { data: upsertData, error: upsertError } = await supabase
      .from('survey_ai_lyrics')
      .upsert(dbPayload, {
        onConflict: 'session_id'
      });

    if (upsertError) {
      console.error("❌ Database upsert error:", upsertError);
      throw new Error(`Failed to save to database: ${upsertError.message}`);
    }

    console.log("✅ Successfully saved to survey_ai_lyrics table!");
    console.log("💾 Upsert result:", upsertData);

    // Final success output
    const finalResult = {
      session_id: sessionId,
      status: "success",
      genres_processed: lyricsData.lyrics.length,
      database_saved: true,
      timestamp: new Date().toISOString()
    };

    console.log("🎉 FINAL RESULT:");
    console.log(JSON.stringify(finalResult, null, 2));

    return finalResult;

  } catch (error) {
    console.error("❌ Error generating Sega lyrics:", error.message);
    console.error("Stack trace:", error.stack);
    
    // Return error structure
    const errorResult = {
      session_id: sessionId,
      status: "error",
      error: error.message,
      timestamp: new Date().toISOString()
    };
    
    console.log("💥 ERROR RESULT:");
    console.log(JSON.stringify(errorResult, null, 2));
    
    process.exit(1);
  }
}

// Execute the main function
generateSegaLyrics();