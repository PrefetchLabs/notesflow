import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export async function uploadFile(file: File): Promise<string> {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Only image files are allowed');
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('File size must be less than 10MB');
    }

    const supabase = createClient();
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('You must be logged in to upload images');
    }
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `editor-images/${fileName}`;

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('notes-assets')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      // Provide more specific error messages
      if (error.message?.includes('Bucket not found')) {
        throw new Error('Storage bucket not configured. Please create "notes-assets" bucket in Supabase dashboard.');
      }
      throw new Error(`Failed to upload image: ${error.message || 'Unknown error'}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('notes-assets')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading file:', error);
    toast.error(error instanceof Error ? error.message : 'Failed to upload image');
    throw error;
  }
}