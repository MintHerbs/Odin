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

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const session_id = searchParams.get('session_id');

    if (!session_id) {
      return Response.json({ error: 'session_id is required' }, { status: 400 });
    }

    // Check if lyrics exist for this session
    const { data, error } = await supabase
      .from('survey_ai_lyrics')
      .select('session_id, politics_ai_sega')
      .eq('session_id', session_id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Supabase error checking lyrics status:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Check if lyrics are actually generated (not just session_id inserted)
    const isReady = !!(data && data.politics_ai_sega);
    
    return Response.json({ 
      ready: isReady,
      session_id: session_id
    });

  } catch (error) {
    console.error('API error in lyrics-status:', error);
    return Response.json({ 
      error: `Failed to check lyrics status: ${error.message}` 
    }, { status: 500 });
  }
}