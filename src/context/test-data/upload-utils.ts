
import { supabase } from '@/integrations/supabase/client';
import { uploadFile } from '@/integrations/supabase/storage';
import { toast } from 'sonner';

export const uploadTestFile = async (testId: string, file: File): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${testId}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;

    // Use the uploadFile helper function
    const publicUrl = await uploadFile('test_files', filePath, file);
    
    if (!publicUrl) {
      throw new Error('Failed to upload file to storage');
    }

    // Save file info to database
    const { error: dbError } = await supabase
      .from('test_files')
      .insert({
        test_id: testId,
        file_path: publicUrl,
        file_name: file.name
      });

    if (dbError) {
      throw dbError;
    }

    return publicUrl;
  } catch (error) {
    console.error('Error uploading test file:', error);
    toast.error('Failed to upload test file');
    return null;
  }
};

export const uploadAnswerImage = async (
  submissionId: string, 
  questionNumber: number, 
  file: File
): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${submissionId}_${questionNumber}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;

    // Use the uploadFile helper function
    const publicUrl = await uploadFile('answer_images', filePath, file);
    
    if (!publicUrl) {
      throw new Error('Failed to upload file to storage');
    }

    // Save file info to database
    const { error: dbError } = await supabase
      .from('answer_images')
      .insert({
        submission_id: submissionId,
        question_number: questionNumber,
        image_path: publicUrl
      });

    if (dbError) {
      throw dbError;
    }

    return publicUrl;
  } catch (error) {
    console.error('Error uploading answer image:', error);
    toast.error('Failed to upload answer image');
    return null;
  }
};
