import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test real-time subscription
async function testRealtime() {
  console.log('Testing Supabase Realtime...');
  
  const channel = supabase
    .channel('test-channel')
    .on(
      'postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table: 'time_blocks' 
      },
      (payload) => {
        console.log('Realtime event received:', payload);
      }
    )
    .subscribe((status) => {
      console.log('Subscription status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('✅ Successfully subscribed to realtime');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Failed to subscribe to realtime');
      }
    });

  // Keep the script running
  setTimeout(() => {
    console.log('Cleaning up...');
    supabase.removeChannel(channel);
    process.exit(0);
  }, 10000);
}

testRealtime();