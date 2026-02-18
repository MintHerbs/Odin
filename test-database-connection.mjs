#!/usr/bin/env node

/**
 * Database Connection Test Script
 * 
 * This script tests the connection to Supabase and verifies all tables exist.
 * Run with: node test-database-connection.mjs
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

console.log('🔍 Testing Supabase Connection...\n');

// Check environment variables
console.log('Environment Variables:');
console.log('  NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log('  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:', supabaseKey ? '✅ Set' : '❌ Missing');
console.log('');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test connection and check tables
async function testDatabase() {
  const tables = ['session', 'votes', 'session_trackers', 'session_ai_lyrics'];
  
  console.log('Testing Database Tables:\n');
  
  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        if (error.code === '42P01') {
          console.log(`  ❌ ${table}: Table does not exist`);
        } else {
          console.log(`  ⚠️  ${table}: Error - ${error.message}`);
        }
      } else {
        console.log(`  ✅ ${table}: Table exists (${count || 0} records)`);
      }
    } catch (err) {
      console.log(`  ❌ ${table}: Connection error - ${err.message}`);
    }
  }
  
  console.log('\n📊 Testing Complete!\n');
  
  // Test a simple insert/delete to verify write permissions
  console.log('Testing Write Permissions:\n');
  
  try {
    const testSessionId = 'test-' + Date.now();
    
    // Try to insert a test session
    const { data: insertData, error: insertError } = await supabase
      .from('session')
      .insert({
        session_id: testSessionId,
        participant_age: 25,
        sega_familiarity: 3,
        ai_sentiment: 3
      })
      .select();
    
    if (insertError) {
      console.log('  ❌ Insert test failed:', insertError.message);
    } else {
      console.log('  ✅ Insert test passed');
      
      // Clean up test data
      const { error: deleteError } = await supabase
        .from('session')
        .delete()
        .eq('session_id', testSessionId);
      
      if (deleteError) {
        console.log('  ⚠️  Delete test failed (cleanup needed):', deleteError.message);
      } else {
        console.log('  ✅ Delete test passed (cleanup successful)');
      }
    }
  } catch (err) {
    console.log('  ❌ Write permission test error:', err.message);
  }
  
  console.log('\n✨ All tests complete!\n');
}

testDatabase().catch(console.error);
