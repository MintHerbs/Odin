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
    const { ip_address, session_id } = body;

    if (!ip_address || !session_id) {
      return Response.json({ 
        error: 'IP address and session_id are required' 
      }, { status: 400 });
    }

    console.log(`🔒 Locking vote for IP: ${ip_address}, Session: ${session_id}`);

    // NEVER lock the whitelist IP
    if (ip_address === WHITELIST_IP) {
      console.log('⚠️  Whitelist IP detected - skipping database lock');
      return Response.json({ 
        success: true,
        locked: false,
        message: 'Whitelisted IP - not locked in database'
      });
    }

    // Insert into session_trackers
    const { data, error } = await supabase
      .from('session_trackers')
      .insert({
        ip_address,
        session_id,
        created_at: new Date().toISOString()
      });

    if (error) {
      // Check if it's a duplicate key error
      if (error.code === '23505') {
        console.log('⚠️  IP already exists in session_trackers');
        return Response.json({ 
          success: true,
          locked: true,
          message: 'IP already locked (duplicate)'
        });
      }
      throw error;
    }

    console.log('✅ Vote locked successfully');

    return Response.json({ 
      success: true,
      locked: true,
      message: 'Vote locked successfully'
    });

  } catch (error) {
    console.error('❌ Error locking vote:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
}
