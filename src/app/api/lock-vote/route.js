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
    const { ip_address, session_id, device_id } = body;

    if (!session_id) {
      console.error('❌ Missing session_id in lock-vote request');
      return Response.json({ 
        error: 'session_id is required' 
      }, { status: 400 });
    }

    console.log(`🔒 Locking vote for IP: ${ip_address}, Device: ${device_id}, Session: ${session_id}`);

    // NEVER lock the whitelist IP
    if (ip_address === WHITELIST_IP) {
      console.log('⚠️  Whitelist IP detected - skipping database lock');
      return Response.json({ 
        success: true,
        locked: false,
        message: 'Whitelisted IP - not locked in database'
      });
    }

    // Check if Supabase is configured
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Supabase not configured - skipping lock');
      return Response.json({ 
        success: true,
        locked: false,
        message: 'Database not configured - lock skipped'
      });
    }

    // Insert into session_trackers with both IP and device_id
    const { data, error } = await supabase
      .from('session_trackers')
      .insert({
        ip_address: ip_address || null,
        device_id: device_id || null,
        session_id,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('❌ Supabase error:', error);
      
      // Check if it's a duplicate key error
      if (error.code === '23505') {
        console.log('⚠️  Device or IP already exists in session_trackers');
        return Response.json({ 
          success: true,
          locked: true,
          message: 'Already locked (duplicate)'
        });
      }
      
      // Check if table doesn't exist
      if (error.code === '42P01') {
        console.error('❌ session_trackers table does not exist!');
        return Response.json({ 
          success: true,
          locked: false,
          message: 'Database table not found - lock skipped'
        });
      }
      
      // Check if foreign key constraint fails
      if (error.code === '23503') {
        console.error('❌ Foreign key constraint failed - session may not exist');
        return Response.json({ 
          success: true,
          locked: false,
          message: 'Session not found - lock skipped'
        });
      }
      
      // For any other error, log it but don't fail the request
      console.error('❌ Unexpected database error:', error.code, error.message);
      return Response.json({ 
        success: true,
        locked: false,
        message: `Database error - lock skipped: ${error.message}`
      });
    }

    console.log('✅ Vote locked successfully');

    return Response.json({ 
      success: true,
      locked: true,
      message: 'Vote locked successfully'
    });

  } catch (error) {
    console.error('❌ Error locking vote:', error);
    // Return success even on error to prevent blocking the user
    return Response.json({ 
      success: true,
      locked: false,
      message: `Error occurred but continuing: ${error.message}`
    });
  }
}
