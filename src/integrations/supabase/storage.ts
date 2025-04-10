
import { supabase } from './client';

// Helper function to upload a file to a bucket
export const uploadFile = async (
  bucketName: 'test_files' | 'answer_images' | 'task_attachments', 
  filePath: string, 
  file: File
): Promise<string | null> => {
  try {
    console.log(`Uploading file to ${bucketName}/${filePath}`);
    
    // Upload the file
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error(`Error uploading file to ${bucketName}:`, uploadError);
      return null;
    }

    // Get the public URL
    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);
    
    console.log(`File uploaded successfully, public URL: ${data.publicUrl}`);
    return data.publicUrl;
  } catch (error) {
    console.error(`Error in uploadFile to ${bucketName}:`, error);
    return null;
  }
};

// Delete a file from a bucket
export const deleteFile = async (
  bucketName: 'test_files' | 'answer_images' | 'task_attachments',
  filePath: string
): Promise<boolean> => {
  try {
    console.log(`Deleting file from ${bucketName}: ${filePath}`);
    
    // Extract just the filename from the URL if it's a full URL
    let pathToDelete = filePath;
    if (filePath.includes('https://')) {
      const url = new URL(filePath);
      const pathname = url.pathname;
      const parts = pathname.split('/');
      // The last part after the bucket name should be the file name
      const bucketIndex = parts.findIndex(part => part === bucketName);
      if (bucketIndex >= 0 && bucketIndex < parts.length - 1) {
        pathToDelete = parts.slice(bucketIndex + 1).join('/');
      }
    }
    
    console.log(`Extracted path to delete: ${pathToDelete}`);
    
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([pathToDelete]);
    
    if (error) {
      console.error(`Error deleting file from ${bucketName}:`, error);
      return false;
    }
    
    console.log(`Successfully deleted file from ${bucketName}: ${pathToDelete}`);
    return true;
  } catch (error) {
    console.error(`Error in deleteFile from ${bucketName}:`, error);
    return false;
  }
};

// List all files in a bucket
export const listFiles = async (
  bucketName: 'test_files' | 'answer_images' | 'task_attachments',
  path?: string
): Promise<string[] | null> => {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(path || '');
    
    if (error) {
      console.error(`Error listing files in ${bucketName}:`, error);
      return null;
    }
    
    return data.map(item => item.name);
  } catch (error) {
    console.error(`Error in listFiles from ${bucketName}:`, error);
    return null;
  }
};
