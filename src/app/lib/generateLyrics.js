import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

/* Config */
const MODEL_ID = "ft:gpt-4o-mini-2024-07-18:munazir:sega-llm-primary-odin:D4BxIHVt";

const GENRES = [
  "politics",
  "engager",
  "romance",
  "celebration",
  "tipik",
  "seggae",
  "hotel",
  "modern"
];

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Generate lyrics for a single genre using fine-tuned OpenAI model
 */
async function generateLyricsForGenre(openai, genre) {
  const prompt = `Generate a full Mauritian Sega song in the genre "${genre}".

FORMAT RULES:
- Do NOT include a title
- Do NOT label sections like verse or chorus
- Do NOT use french words unless it helps develop the theme
- Each stanza should have around 3 to 4 lines
- Each line should be at least 5 words long
- No markdown, no asterisks
- Write lyrics only with natural stanza breaks

STYLE:
- Sega rhythm
- Emotional and descriptive
- No explanations`;

  const response = await openai.chat.completions.create({
    model: MODEL_ID,
    messages: [
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.85,
    max_tokens: 1200,
    frequency_penalty: 0.3
  });

  return response.choices[0].message.content.trim();
}

/**
 * Main function to generate all lyrics for a session
 * This is designed to work in Vercel's serverless environment
 */
export async function generateAllLyrics(sessionId) {
  // Validate environment variables
  const openaiKey = process.env.OPENAI_API_KEY;
  const openaiOrg = process.env.OPENAI_ORG_ID;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!openaiKey) {
    throw new Error("OPENAI_API_KEY is missing");
  }

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase environment variables are missing");
  }

  // Initialize clients
  const openai = new OpenAI({
    apiKey: openaiKey,
    organization: openaiOrg || "org-TNbp13HHLuhYEKqloGkvVfg6"
  });

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Select 5 random genres
  const selectedGenres = shuffle(GENRES).slice(0, 5);
  console.log(`🎵 Generating lyrics for session ${sessionId}:`, selectedGenres.join(", "));

  // Generate lyrics for all genres in parallel
  const rows = await Promise.all(
    selectedGenres.map(async (genre) => {
      console.log(`🎤 Generating ${genre} lyrics...`);
      const lyrics = await generateLyricsForGenre(openai, genre);
      console.log(`✅ ${genre} lyrics generated (${lyrics.length} chars)`);
      
      return {
        session_id: sessionId,
        genre,
        ai_id: `${genre}_${Math.floor(Math.random() * 100000)}`,
        lyrics
      };
    })
  );

  // Insert all lyrics into Supabase
  console.log(`💾 Storing ${rows.length} lyrics in Supabase...`);
  const { error } = await supabase
    .from("session_ai_lyrics")
    .insert(rows);

  if (error) {
    console.error("❌ Supabase insert error:", error);
    throw new Error(`Failed to store lyrics: ${error.message}`);
  }

  console.log(`✅ Successfully stored ${rows.length} lyrics for session ${sessionId}`);
  
  return {
    success: true,
    session_id: sessionId,
    genres: selectedGenres,
    count: rows.length
  };
}

/**
 * Generate lyrics one at a time (for streaming/progressive updates)
 */
export async function generateLyricsSequentially(sessionId, onProgress) {
  const openaiKey = process.env.OPENAI_API_KEY;
  const openaiOrg = process.env.OPENAI_ORG_ID;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!openaiKey || !supabaseUrl || !supabaseKey) {
    throw new Error("Missing required environment variables");
  }

  const openai = new OpenAI({
    apiKey: openaiKey,
    organization: openaiOrg || "org-TNbp13HHLuhYEKqloGkvVfg6"
  });

  const supabase = createClient(supabaseUrl, supabaseKey);

  const selectedGenres = shuffle(GENRES).slice(0, 5);
  console.log(`🎵 Generating lyrics sequentially for session ${sessionId}`);

  const results = [];

  for (let i = 0; i < selectedGenres.length; i++) {
    const genre = selectedGenres[i];
    console.log(`🎤 [${i + 1}/5] Generating ${genre} lyrics...`);
    
    try {
      const lyrics = await generateLyricsForGenre(openai, genre);
      
      const row = {
        session_id: sessionId,
        genre,
        ai_id: `${genre}_${Math.floor(Math.random() * 100000)}`,
        lyrics
      };

      // Insert immediately after generation
      const { error } = await supabase
        .from("session_ai_lyrics")
        .insert([row]);

      if (error) {
        console.error(`❌ Failed to store ${genre} lyrics:`, error);
        throw error;
      }

      console.log(`✅ [${i + 1}/5] ${genre} lyrics stored`);
      results.push({ genre, success: true });

      // Call progress callback if provided
      if (onProgress) {
        onProgress({
          current: i + 1,
          total: 5,
          genre,
          session_id: sessionId
        });
      }

    } catch (error) {
      console.error(`❌ Error generating ${genre}:`, error);
      results.push({ genre, success: false, error: error.message });
      throw error;
    }
  }

  return {
    success: true,
    session_id: sessionId,
    results
  };
}
