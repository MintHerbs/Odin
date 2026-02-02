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

// Helper to extract IP from request
function getClientIP(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  return null;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { session_id } = body;

    if (!session_id) {
      return Response.json({ error: 'session_id is required' }, { status: 400 });
    }

    // API PROTECTION: Check if IP has already voted
    const clientIP = getClientIP(request);
    console.log(`📍 Request from IP: ${clientIP || 'unknown'}`);

    if (clientIP && clientIP !== WHITELIST_IP) {
      console.log('🔍 Checking if IP has already used API...');
      
      const { data, error } = await supabase
        .from('session_trackers')
        .select('*')
        .eq('ip_address', clientIP)
        .single();

      if (data && !error) {
        console.log('🚫 IP has already voted - blocking API access');
        return Response.json({ 
          error: 'Access denied: You have already participated',
          code: 'ALREADY_VOTED'
        }, { status: 403 });
      }
    } else if (clientIP === WHITELIST_IP) {
      console.log('✅ Whitelisted IP - bypassing check');
    }

    console.log(`🚀 Triggering AI generation for session: ${session_id}`);

    // Call the serverless-compatible generation API
    // This works on both local and Vercel environments
    try {
      const baseUrl = request.headers.get('host');
      const protocol = request.headers.get('x-forwarded-proto') || 'http';
      const apiUrl = `${protocol}://${baseUrl}/api/generate-ai-lyrics`;
      
      console.log(`📡 Calling generation API: ${apiUrl}`);
      
      // Make internal API call (non-blocking on Vercel)
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_id })
      });

      const result = await response.json();

      if (!response.ok) {
        console.error(`❌ Generation API failed:`, result);
        return Response.json({
          success: false,
          error: result.error || 'Failed to start AI generation',
          timestamp: new Date().toISOString()
        }, { status: response.status });
      }

      console.log(`✅ AI generation completed for session: ${session_id}`);

      return Response.json({
        success: true,
        message: 'AI lyrics generated successfully',
        session_id: session_id,
        timestamp: new Date().toISOString()
      });

    } catch (fetchError) {
      console.error('❌ Error calling generation API:', fetchError);
      return Response.json({
        success: false,
        error: `Failed to trigger generation: ${fetchError.message}`,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Error in trigger-gen:', error);
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
  
  console.log(`🧪 Testing AI generation with session: ${testSessionId}`);
  
  // Trigger the same process as POST
  return POST(new Request(request.url, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'host': request.headers.get('host'),
      'x-forwarded-proto': request.headers.get('x-forwarded-proto') || 'http'
    },
    body: JSON.stringify({ session_id: testSessionId })
  }));
}