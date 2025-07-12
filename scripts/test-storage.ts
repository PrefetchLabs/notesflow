#!/usr/bin/env bun

import { createClient } from '@/lib/supabase/server';

async function testStorage() {
  console.log('Testing Supabase storage setup...\n');

  try {
    const supabase = await createClient();
    
    // List all buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError.message);
      return;
    }

    console.log('📦 Available storage buckets:');
    if (buckets && buckets.length > 0) {
      buckets.forEach(bucket => {
        console.log(`  - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
      });
    } else {
      console.log('  No buckets found');
    }

    // Check if notes-assets bucket exists
    const notesAssetsBucket = buckets?.find(b => b.name === 'notes-assets');
    
    if (notesAssetsBucket) {
      console.log('\n✅ "notes-assets" bucket exists and is', notesAssetsBucket.public ? 'public' : 'private');
    } else {
      console.log('\n⚠️  "notes-assets" bucket not found!');
      console.log('   Please create it in Supabase dashboard:');
      console.log('   1. Go to Storage section');
      console.log('   2. Create new bucket named "notes-assets"');
      console.log('   3. Make it public');
      console.log('   4. Set 10MB file size limit');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testStorage();