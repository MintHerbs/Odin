import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

/* CLI */
const sessionId = process.argv[2];
if (!sessionId) {
  console.error("session_id required");
  process.exit(1);
}

/* Validate environment variables */
const openaiKey = process.env.OPENAI_API_KEY;
const openaiOrg = process.env.OPENAI_ORG_ID;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!openaiKey) {
  console.error("❌ OPENAI_API_KEY is missing");
  process.exit(1);
}

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Supabase environment variables are missing");
  console.error("  - NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "✓" : "✗");
  console.error("  - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:", supabaseKey ? "✓" : "✗");
  process.exit(1);
}

/* Clients */
const openai = new OpenAI({
  apiKey: openaiKey,
  organization: openaiOrg || "org-TNbp13HHLuhYEKqloGkvVfg6"
});

const supabase = createClient(supabaseUrl, supabaseKey);

/* Config */
const MODEL_ID =
  "ft:gpt-4o-mini-2024-07-18:munazir:sega-llm-primary-odin:D4BxIHVt";

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

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* Generation */
async function generateLyrics(genre) {
  const prompt = `
Generate a full Mauritian Sega song in the genre "${genre}".

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
- No explanations
`;

  const response = await openai.responses.create({
    model: MODEL_ID,
    input: prompt,
    temperature: 0.85,
    max_output_tokens: 1200
  });

  return response.output_text.trim();
}

/* Main */
async function run() {
  try {
    const selectedGenres = shuffle(GENRES).slice(0, 5);
    console.log("Generating:", selectedGenres.join(", "));

    const rows = await Promise.all(
      selectedGenres.map(async (genre) => ({
        session_id: sessionId,
        genre,
        ai_id: `${genre}_${Math.floor(Math.random() * 100000)}`,
        lyrics: await generateLyrics(genre)
      }))
    );

    const { error } = await supabase
      .from("session_ai_lyrics")
      .insert(rows);

    if (error) throw error;

    console.log("Done. Stored", rows.length, "lyrics");
    process.exit(0);

  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

run();
