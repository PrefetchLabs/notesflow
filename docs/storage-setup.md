# Supabase Storage Setup for Image Uploads

To enable image pasting in the editor, you need to create a storage bucket in your Supabase dashboard.

## Steps to Create Storage Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Configure the bucket with these settings:
   - **Name**: `notes-assets`
   - **Public bucket**: ✅ (Enable this for easy access)
   - **File size limit**: 10MB
   - **Allowed MIME types**: 
     - `image/jpeg`
     - `image/png`
     - `image/gif`
     - `image/webp`
     - `image/svg+xml`

5. Click **Create bucket**

## RLS Policies (Optional)

If you want more control over who can upload/delete images, you can add these RLS policies:

1. **Upload Policy** (INSERT)
   - Policy name: `Authenticated users can upload images`
   - Target roles: `authenticated`
   - WITH CHECK: `true`

2. **View Policy** (SELECT)
   - Policy name: `Anyone can view images`
   - Target roles: `anon, authenticated`
   - USING: `true`

3. **Update Policy** (UPDATE)
   - Policy name: `Users can update their own images`
   - Target roles: `authenticated`
   - USING: `auth.uid()::text = owner`

4. **Delete Policy** (DELETE)
   - Policy name: `Users can delete their own images`
   - Target roles: `authenticated`
   - USING: `auth.uid()::text = owner`

## Testing

After creating the bucket, try pasting an image in the editor. The image should upload automatically and display inline.