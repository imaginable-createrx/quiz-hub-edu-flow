
import { supabase } from './client';

// Create Storage buckets if they don't exist
export const ensureStorageBuckets = async () => {
  try {
    // Check if test_files bucket exists, create if not
    const { data: testFilesBuckets, error: testFilesError } = await supabase
      .storage
      .getBucket('test_files');
    
    if (testFilesError && !testFilesBuckets) {
      await supabase.storage.createBucket('test_files', {
        public: true,
        fileSizeLimit: 10485760, // 10MB limit
      });
    }
    
    // Check if answer_images bucket exists, create if not
    const { data: answerImagesBuckets, error: answerImagesError } = await supabase
      .storage
      .getBucket('answer_images');
    
    if (answerImagesError && !answerImagesBuckets) {
      await supabase.storage.createBucket('answer_images', {
        public: true,
        fileSizeLimit: 5242880, // 5MB limit
      });
    }
  } catch (error) {
    console.error('Error ensuring storage buckets exist:', error);
  }
};

// Initialize buckets on app startup
ensureStorageBuckets();
