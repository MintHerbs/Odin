import { generateLyricsSequentially } from '../../lib/generateLyrics';

// Use Edge Runtime for better timeout handling (up to 25s on Hobby plan)
export const runtime = 'edge';
export const maxDuration = 25; // Maximum duration in seconds

/**
 * Generate AI lyrics for a session
 * This route generates lyrics sequentially and stores them one by one
 * to avoid timeout issues and provide progressive updates
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

    console.log(`🚀 Starting AI lyrics generation for session: ${session_id}`);

    // Generate lyrics sequentially with progress tracking
    const result = await generateLyricsSequentially(
      session_id,
      (progress) => {
        console.log(`📊 Progress: ${progress.current}/${progress.total} - ${progress.genre} completed`);
      }
    );

    console.log(`✅ AI lyrics generation completed for session: ${session_id}`);

    return Response.json({
      success: true,
      message: 'AI lyrics generated successfully',
      session_id: session_id,
      genres_generated: result.results.length,
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
