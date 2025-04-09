
import { supabase } from './client';

// Helper function to upload a file to a bucket
export const uploadFile = async (
  bucketName: 'test_files' | 'answer_images', 
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
  bucketName: 'test_files' | 'answer_images',
  filePath: string
): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);
    
    if (error) {
      console.error(`Error deleting file from ${bucketName}:`, error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Error in deleteFile from ${bucketName}:`, error);
    return false;
  }
};
