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

export async function POST(request) {
  try {
    const body = await request.json();
    const { session_id, participant_age, sega_familiarity, ai_sentiment } = body;

    console.log('API received data:', { session_id, participant_age, sega_familiarity, ai_sentiment });

    if (!session_id) {
      return Response.json({ error: 'session_id is required' }, { status: 400 });
    }

    // Use upsert to insert or update if session_id already exists
    const { data, error } = await supabase
      .from('session')
      .upsert([
        {
          session_id,
          participant_age: participant_age || null,
          sega_familiarity: sega_familiarity || null,
          ai_sentiment: ai_sentiment || null
        }
      ], {
        onConflict: 'session_id'
      });

    if (error) {
      console.error('Supabase error:', error);
      return Response.json({ error: `Database error: ${error.message}` }, { status: 500 });
    }

    console.log('Successfully upserted session data:', data);
    return Response.json({ success: true, data });
  } catch (error) {
    console.error('API error:', error);
    return Response.json({ error: `Server error: ${error.message}` }, { status: 500 });
  }
}
