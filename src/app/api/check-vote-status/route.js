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

const WHITELIST_IP = '102.115.222.233';

export async function POST(request) {
  try {
    const body = await request.json();
    const { ip_address } = body;

    if (!ip_address) {
      return Response.json({ error: 'IP address is required' }, { status: 400 });
    }

    console.log(`🔍 Checking vote status for IP: ${ip_address}`);

    // Whitelist check
    if (ip_address === WHITELIST_IP) {
      console.log('✅ Whitelisted IP detected - allowing access');
      return Response.json({ 
        hasVoted: false, 
        isWhitelisted: true,
        message: 'Whitelisted IP - unlimited access'
      });
    }

    // Check session_trackers table
    const { data, error } = await supabase
      .from('session_trackers')
      .select('*')
      .eq('ip_address', ip_address)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Database error:', error);
      throw error;
    }

    const hasVoted = !!data;

    console.log(`📊 Vote status: ${hasVoted ? 'Already voted' : 'New user'}`);

    return Response.json({ 
      hasVoted,
      isWhitelisted: false,
      session_id: data?.session_id || null,
      created_at: data?.created_at || null
    });

  } catch (error) {
    console.error('❌ Error checking vote status:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
}
