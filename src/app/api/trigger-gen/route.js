import { spawn } from 'child_process';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

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

    console.log(`🚀 Triggering background AI generation for session: ${session_id}`);

    // Get the absolute path to example.mjs
    const scriptPath = path.join(process.cwd(), 'example.mjs');
    
    console.log(`📂 Script path: ${scriptPath}`);
    console.log(`🔧 Spawning background process...`);

    // Spawn the background process
    const childProcess = spawn('node', [scriptPath, session_id], {
      detached: false, // Keep attached to see output
      stdio: ['ignore', 'pipe', 'pipe'], // Capture stdout and stderr
      env: {
        ...process.env, // Pass all environment variables including OPENAI_API_KEY
        NODE_ENV: process.env.NODE_ENV
      }
    });

    // Handle stdout (normal output)
    childProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        console.log(`[AI-GEN-${session_id}] ${output}`);
      }
    });

    // Handle stderr (error output)
    childProcess.stderr.on('data', (data) => {
      const error = data.toString().trim();
      if (error) {
        console.error(`[AI-GEN-ERROR-${session_id}] ${error}`);
      }
    });

    // Handle process completion
    childProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ [AI-GEN-${session_id}] Background process completed successfully`);
      } else {
        console.error(`❌ [AI-GEN-${session_id}] Background process failed with code: ${code}`);
      }
    });

    // Handle process errors
    childProcess.on('error', (error) => {
      console.error(`💥 [AI-GEN-${session_id}] Process error:`, error.message);
    });

    console.log(`✅ Background AI generation started for session: ${session_id}`);
    console.log(`🔄 Process PID: ${childProcess.pid}`);

    // Return immediately (non-blocking)
    return Response.json({
      success: true,
      message: 'Background AI generation started',
      session_id: session_id,
      process_id: childProcess.pid,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error starting background AI generation:', error);
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
  
  console.log(`🧪 Testing background AI generation with session: ${testSessionId}`);
  
  // Trigger the same process as POST
  return POST(new Request(request.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: testSessionId })
  }));
}