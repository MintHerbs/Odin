import { createClient } from '@supabase/supabase-js';

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ CRITICAL: Supabase environment variables are missing!');
  console.error('Required variables:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
  console.error('  - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:', supabaseKey ? '✓ Set' : '✗ Missing');
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Get AI lyrics from the warm pool or wait for current generation
 * 
 * Strategy:
 * 1. Check if there are ANY lyrics in session_ai_lyrics (regardless of session_id)
 * 2. If yes: Return the 5 most recent lyrics (warm pool)
 * 3. If no: Wait for the current session's generation to complete
 * 
 * This creates a "warm pool" where each user's generation benefits the next user
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { session_id } = body;

    if (!session_id) {
      return Response.json({ 
        error: 'session_id is required' 
      }, { status: 400 });
    }

    console.log(`🔍 Checking for available AI lyrics (session: ${session_id})`);

    // Step 1: Check if there are ANY lyrics in the pool (from any session)
    const { data: poolLyrics, error: poolError } = await supabase
      .from('session_ai_lyrics')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (poolError) {
      console.error('❌ Error checking lyrics pool:', poolError);
      throw new Error(`Failed to check lyrics pool: ${poolError.message}`);
    }

    // Step 2: If we have 5 or more lyrics in the pool, use them immediately
    if (poolLyrics && poolLyrics.length >= 5) {
      console.log(`✅ Found ${poolLyrics.length} lyrics in warm pool - using immediately`);
      
      // Take the 5 most recent
      const selectedLyrics = poolLyrics.slice(0, 5);
      
      // Transform to expected format
      const formattedLyrics = selectedLyrics.map((row) => {
        const genreName = row.genre.charAt(0).toUpperCase() + row.genre.slice(1);
        return {
          id: row.id,
          ai_id: row.ai_id,
          genre: genreName,
          lyrics: row.lyrics,
          created_at: row.created_at,
          source: 'warm_pool'
        };
      });

      console.log('📦 Warm pool lyrics:');
      formattedLyrics.forEach((lyric, idx) => {
        console.log(`  ${idx + 1}. ${lyric.genre} (created: ${lyric.created_at})`);
      });

      return Response.json({
        success: true,
        source: 'warm_pool',
        lyrics: formattedLyrics,
        session_id: session_id,
        message: 'Using lyrics from warm pool',
        pool_size: poolLyrics.length,
        timestamp: new Date().toISOString()
      });
    }

    // Step 3: No lyrics in pool - need to wait for current generation
    console.log('⏳ No lyrics in warm pool - waiting for current generation...');

    // Poll for lyrics from the current session (with timeout)
    const maxAttempts = 30; // 30 attempts
    const pollInterval = 2000; // 2 seconds
    let attempts = 0;

    while (attempts < maxAttempts) {
      attempts++;
      console.log(`🔄 Polling attempt ${attempts}/${maxAttempts}...`);

      const { data: sessionLyrics, error: sessionError } = await supabase
        .from('session_ai_lyrics')
        .select('*')
        .eq('session_id', session_id)
        .order('created_at', { ascending: false });

      if (sessionError) {
        console.error('❌ Error polling for lyrics:', sessionError);
        throw new Error(`Failed to poll for lyrics: ${sessionError.message}`);
      }

      // Check if we have all 5 lyrics
      if (sessionLyrics && sessionLyrics.length >= 5) {
        console.log(`✅ Generation complete! Found ${sessionLyrics.length} lyrics`);

        // Take the 5 most recent
        const selectedLyrics = sessionLyrics.slice(0, 5);

        // Transform to expected format
        const formattedLyrics = selectedLyrics.map((row) => {
          const genreName = row.genre.charAt(0).toUpperCase() + row.genre.slice(1);
          return {
            id: row.id,
            ai_id: row.ai_id,
            genre: genreName,
            lyrics: row.lyrics,
            created_at: row.created_at,
            source: 'fresh_generation'
          };
        });

        console.log('📦 Fresh generation lyrics:');
        formattedLyrics.forEach((lyric, idx) => {
          console.log(`  ${idx + 1}. ${lyric.genre} (created: ${lyric.created_at})`);
        });

        return Response.json({
          success: true,
          source: 'fresh_generation',
          lyrics: formattedLyrics,
          session_id: session_id,
          message: 'Generation completed successfully',
          attempts: attempts,
          timestamp: new Date().toISOString()
        });
      }

      // Log progress if we have partial results
      if (sessionLyrics && sessionLyrics.length > 0) {
        console.log(`📊 Progress: ${sessionLyrics.length}/5 lyrics generated`);
      }

      // Wait before next poll
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }

    // Timeout reached
    console.error('❌ Timeout: Generation did not complete in time');
    return Response.json({
      success: false,
      error: 'Generation timeout - lyrics not ready',
      session_id: session_id,
      attempts: attempts,
      timestamp: new Date().toISOString()
    }, { status: 408 });

  } catch (error) {
    console.error('❌ Error in get-or-wait-lyrics:', error);
    return Response.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Optional: GET endpoint for testing
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const testSessionId = searchParams.get('session_id') || 'test-session-' + Date.now();
  
  console.log(`🧪 Testing get-or-wait-lyrics with session: ${testSessionId}`);
  
  return POST(new Request(request.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: testSessionId })
  }));
}
