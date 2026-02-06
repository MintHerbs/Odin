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

    // Try to insert with device_id first, fallback to IP-only if column doesn't exist
    let insertData = {
      ip_address: ip_address || null,
      session_id,
      created_at: new Date().toISOString()
    };

    // Only add device_id if it exists
    if (device_id) {
      insertData.device_id = device_id;
    }

    const { data, error } = await supabase
      .from('session_trackers')
      .insert(insertData);

    if (error) {
      // Check if it's a duplicate key error
      if (error.code === '23505') {
        console.log('⚠️  Device or IP already exists in session_trackers');
        return Response.json({ 
          success: true,
          locked: true,
          message: 'Already locked (duplicate)'
        });
      }
      
      // If device_id column doesn't exist, try without it
      if (error.message && error.message.includes('device_id')) {
        console.log('⚠️  device_id column not found, trying without it...');
        const { data: retryData, error: retryError } = await supabase
          .from('session_trackers')
          .insert({
            ip_address: ip_address || null,
            session_id,
            created_at: new Date().toISOString()
          });

        if (retryError) {
          if (retryError.code === '23505') {
            return Response.json({ 
              success: true,
              locked: true,
              message: 'Already locked (duplicate)'
            });
          }
          throw retryError;
        }

        console.log('✅ Vote locked successfully (without device_id)');
        return Response.json({ 
          success: true,
          locked: true,
          message: 'Vote locked successfully'
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
