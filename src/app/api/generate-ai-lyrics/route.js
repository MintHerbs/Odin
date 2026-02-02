import { generateAllLyrics } from '../../lib/generateLyrics';

// Use Edge Runtime for better timeout handling
export const runtime = 'edge';
export const maxDuration = 20; // 20 seconds is enough for 3 lyrics

/**
 * Generate 3 AI lyrics for a session (optimized for speed)
 * Completes in ~9-15 seconds, well within Vercel's timeout
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { session_id } = body;

    if (!session_id) {
      return Response.json({ 
        error: 'session_id is required' 
      }, { status: 400 });
    }

    console.log(`🚀 Starting AI lyrics generation (2 lyrics) for session: ${session_id}`);

    // Generate 2 lyrics in parallel (faster than sequential)
    const result = await generateAllLyrics(session_id);

    console.log(`✅ AI lyrics generation completed for session: ${session_id}`);

    return Response.json({
      success: true,
      message: 'AI lyrics generated successfully',
      session_id: session_id,
      genres_generated: result.count,
      genres: result.genres,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error generating AI lyrics:', error);
    
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
  
  console.log(`🧪 Testing AI lyrics generation with session: ${testSessionId}`);
  
  // Trigger the same process as POST
  return POST(new Request(request.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: testSessionId })
  }));
}
