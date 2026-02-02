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
    const { session_id, opinion } = body;

    console.log('💬 Saving opinion for session:', session_id);

    if (!session_id || !opinion) {
      return Response.json({ 
        error: 'Missing session_id or opinion' 
      }, { status: 400 });
    }

    // Validate word count
    const wordCount = opinion.trim().split(/\s+/).filter(word => word.length > 0).length;
    if (wordCount > 200) {
      return Response.json({ 
        error: 'Opinion exceeds 200 word limit',
        word_count: wordCount 
      }, { status: 400 });
    }

    console.log(`📝 Opinion word count: ${wordCount}/200`);

    // Update the session table with the opinion
    const { data, error } = await supabase
      .from('session')
      .update({ opinion: opinion.trim() })
      .eq('session_id', session_id);

    if (error) {
      console.error('❌ Database error:', error);
      throw error;
    }

    console.log('✅ Opinion saved successfully');

    return Response.json({ 
      success: true,
      session_id: session_id,
      word_count: wordCount,
      message: 'Opinion saved successfully'
    });

  } catch (error) {
    console.error('❌ API Error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
