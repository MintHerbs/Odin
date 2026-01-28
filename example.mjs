import 'dotenv/config';
import OpenAI from "openai";
import { createClient } from '@supabase/supabase-js';

const sessionId = process.argv[2];

if (!sessionId) {
  console.error("❌ Error: session_id is required as a command-line argument");
  process.exit(1);
}

// Initialize Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// The 6 specific genres for the study
const ALL_GENRES = ["politics", "engager", "romance", "celebration", "tipik", "seggae"];

async function generateSegaLyrics() {
  try {
    console.log(`🎵 Starting Sega lyrics generation for session: ${sessionId}`);

    // Randomize genres and pick exactly 5 out of 6
    const shuffled = [...ALL_GENRES].sort(() => 0.5 - Math.random());
    const selectedGenres = shuffled.slice(0, 5);
    const skippedGenre = shuffled[5];

    const prompt = `
      You are an expert Mauritian Sega and Seggae lyricist. 
      Generate exactly 5 Sega/Seggae lyrics (3 verses each) for these specific genres: ${selectedGenres.join(', ')}.
      
      Requirements:
      1. Use authentic Mauritian Creole.
      2. Each lyric must have 3 distinct verses.
      3. Return ONLY a valid JSON object.

      JSON Format:
      {
        "lyrics": [
          { "genre": "politics", "id": "politics_gen_1", "text": "verse1\\n\\nverse2\\n\\nverse3" },
          ...
        ]
      }
    `;

    console.log("🚀 Requesting lyrics from OpenAI using gpt-4.1-nano...");
    const response = await client.chat.completions.create({
      model: "gpt-4.1-nano", // Explicitly using the requested model name
      messages: [
        { role: "system", content: "You are a professional songwriter specializing in Mauritian Sega and Seggae." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    });

    const content = JSON.parse(response.choices[0].message.content);
    const aiLyrics = content.lyrics;

    // Prepare Database Payload for the flat survey_ai_lyrics table
    const dbPayload = {
      session_id: sessionId,
      // Default the skipped genre to "-" for analysis consistency
      [`${skippedGenre}_ai_id`]: "-",
      [`${skippedGenre}_ai_sega`]: "-"
    };

    // Map AI results to the flat table structure
    aiLyrics.forEach(item => {
      const genreKey = item.genre.toLowerCase();
      dbPayload[`${genreKey}_ai_id`] = item.id;
      dbPayload[`${genreKey}_ai_sega`] = item.text;
    });

    console.log("💾 Upserting data into survey_ai_lyrics...");
    const { error } = await supabase
      .from('survey_ai_lyrics')
      .upsert(dbPayload);

    if (error) throw error;

    console.log("✅ Successfully populated survey_ai_lyrics table!");
    process.exit(0);

  } catch (error) {
    console.error("❌ Process failed:", error.message);
    process.exit(1);
  }
}

generateSegaLyrics();