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
    const { ip_address, device_id } = body;

    if (!ip_address && !device_id) {
      return Response.json({ error: 'IP address or device ID is required' }, { status: 400 });
    }

    console.log(`🔍 Checking vote status for IP: ${ip_address}, Device: ${device_id}`);

    // Whitelist check (IP-based)
    if (ip_address === WHITELIST_IP) {
      console.log('✅ Whitelisted IP detected - allowing access');
      return Response.json({ 
        hasVoted: false, 
        isWhitelisted: true,
        message: 'Whitelisted IP - unlimited access'
      });
    }

    // Check session_trackers table by device_id first (more reliable) - only if device_id exists
    if (device_id) {
      try {
        const { data: deviceData, error: deviceError } = await supabase
          .from('session_trackers')
          .select('*')
          .eq('device_id', device_id)
          .single();

        if (deviceError && deviceError.code !== 'PGRST116') {
          // If error is about device_id column not existing, skip this check
          if (!deviceError.message || !deviceError.message.includes('device_id')) {
            console.error('Database error checking device:', deviceError);
          }
        }

        if (deviceData) {
          console.log(`📊 Device has already voted`);
          return Response.json({ 
            hasVoted: true,
            isWhitelisted: false,
            session_id: deviceData.session_id,
            created_at: deviceData.created_at
          });
        }
      } catch (err) {
        console.log('⚠️  Device ID check skipped (column may not exist)');
      }
    }

    // Fallback: Check by IP (for logging purposes, not blocking)
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
