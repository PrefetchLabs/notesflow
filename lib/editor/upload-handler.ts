import { toast } from 'sonner';

export async function uploadFile(file: File): Promise<string> {
  try {
    // Create FormData
    const formData = new FormData();
    formData.append('file', file);

    // Upload via API route
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to upload image');
    }

    return data.url;
  } catch (error) {
    // [REMOVED_CONSOLE]
    toast.error(error instanceof Error ? error.message : 'Failed to upload image');
    throw error;
  }
}