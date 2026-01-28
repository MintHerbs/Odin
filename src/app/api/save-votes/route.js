import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

// All 6 genres for the study
const GENRES = ['politics', 'engager', 'romance', 'celebration', 'tipik', 'seggae'];

export async function POST(request) {
  try {
    const body = await request.json();
    const { session_id, votes } = body;

    if (!session_id || !votes) {
      return Response.json({ error: 'Missing session_id or votes' }, { status: 400 });
    }

    // Initialize payload with default values for all genres
    const votePayload = { session_id: session_id };

    GENRES.forEach(genre => {
      // AI Columns
      votePayload[`${genre}_ai_id`] = "-";
      votePayload[`${genre}_ai_vote`] = null;
      // Human (Sega) Columns
      votePayload[`${genre}_sega_id`] = null;
      votePayload[`${genre}_sega_vote`] = null;
    });

    // Map the array of votes into the flat table structure
    votes.forEach((vote) => {
      const { lyricId, genre, vote: voteValue, isAI } = vote;
      if (!genre) return;

      const normalizedGenre = genre.toLowerCase().trim();
      
      if (GENRES.includes(normalizedGenre)) {
        if (isAI) {
          votePayload[`${normalizedGenre}_ai_id`] = String(lyricId);
          votePayload[`${normalizedGenre}_ai_vote`] = voteValue;
        } else {
          // Ensure human IDs are stored as integers
          votePayload[`${normalizedGenre}_sega_id`] = parseInt(lyricId);
          votePayload[`${normalizedGenre}_sega_vote`] = voteValue;
        }
      }
    });

    const { error } = await supabase
      .from('session_votes')
      .upsert(votePayload, { onConflict: 'session_id' });

    if (error) throw error;

    return Response.json({ success: true, votes_saved: votes.length });
  } catch (error) {
    console.error('❌ API Error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}