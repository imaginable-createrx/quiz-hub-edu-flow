
import { supabase } from './client';

// Create Storage buckets if they don't exist
export const ensureStorageBuckets = async () => {
  try {
    // Check if test_files bucket exists, create if not
    const { data: testFilesBuckets, error: testFilesError } = await supabase
      .storage
      .getBucket('test_files');
    
    if (testFilesError && !testFilesBuckets) {
      console.log('Creating test_files bucket');
      const { error } = await supabase.storage.createBucket('test_files', {
        public: true,
        fileSizeLimit: 10485760, // 10MB limit
      });
      
      if (error) {
        console.error('Error creating test_files bucket:', error);
      } else {
        console.log('test_files bucket created successfully');
      }
    } else {
      console.log('test_files bucket already exists');
    }
    
    // Check if answer_images bucket exists, create if not
    const { data: answerImagesBuckets, error: answerImagesError } = await supabase
      .storage
      .getBucket('answer_images');
    
    if (answerImagesError && !answerImagesBuckets) {
      console.log('Creating answer_images bucket');
      const { error } = await supabase.storage.createBucket('answer_images', {
        public: true,
        fileSizeLimit: 5242880, // 5MB limit
      });
      
      if (error) {
        console.error('Error creating answer_images bucket:', error);
      } else {
        console.log('answer_images bucket created successfully');
      }
    } else {
      console.log('answer_images bucket already exists');
    }
    
    // Ensure buckets are public
    await ensureBucketsArePublic();
    
  } catch (error) {
    console.error('Error ensuring storage buckets exist:', error);
  }
};

// Make sure buckets are public
const ensureBucketsArePublic = async () => {
  try {
    // Update test_files bucket to be public
    const { error: testFilesError } = await supabase.storage.updateBucket('test_files', {
      public: true
    });
    
    if (testFilesError) {
      console.error('Error updating test_files bucket to public:', testFilesError);
    }
    
    // Update answer_images bucket to be public
    const { error: answerImagesError } = await supabase.storage.updateBucket('answer_images', {
      public: true
    });
    
    if (answerImagesError) {
      console.error('Error updating answer_images bucket to public:', answerImagesError);
    }
  } catch (error) {
    console.error('Error ensuring buckets are public:', error);
  }
};

// Initialize buckets on app startup
ensureStorageBuckets();

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
