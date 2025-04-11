
import { Test } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const fetchTests = async (): Promise<Test[]> => {
  try {
    const { data, error } = await supabase
      .from('tests')
      .select(`
        id, 
        title, 
        description, 
        num_questions,
        duration_minutes,
        created_at,
        created_by,
        test_files (file_path)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tests:', error);
      return [];
    }

    if (data) {
      const formattedTests: Test[] = data.map((test: any) => ({
        id: test.id,
        title: test.title,
        description: test.description || undefined,
        pdfUrl: test.test_files && test.test_files.length > 0 ? 
          test.test_files[0].file_path : '/placeholder.svg',
        numQuestions: test.num_questions,
        durationMinutes: test.duration_minutes,
        createdAt: test.created_at,
        createdBy: test.created_by
      }));
      
      return formattedTests;
    }
    return [];
  } catch (error) {
    console.error('Error in fetchTests:', error);
    return [];
  }
};

export const addTest = async (
  test: Omit<Test, 'id' | 'createdAt'>,
  userId: string
): Promise<string | undefined> => {
  try {
    if (!userId) {
      toast.error('You must be logged in to create a test');
      return;
    }

    // Insert test directly
    const { data, error } = await supabase
      .from('tests')
      .insert({
        title: test.title,
        description: test.description || null,
        duration_minutes: test.durationMinutes,
        num_questions: test.numQuestions,
        created_by: userId
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (data) {
      const newTestId = data.id;
      toast.success('Test created successfully!');
      return newTestId;
    }
  } catch (error) {
    console.error('Error adding test:', error);
    toast.error('Failed to create test: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const deleteTest = async (
  testId: string,
  userRole: string | undefined
): Promise<boolean> => {
  try {
    if (!userRole || userRole !== 'teacher') {
      toast.error('Only teachers can delete tests');
      return false;
    }

    console.log('Starting test deletion process for test:', testId);
    
    // The actual deletion is handled by the database function
    // Only return success to update the UI state in the context
    return true;
  } catch (error) {
    console.error('Error in deleteTest operation:', error);
    toast.error('Failed to update UI after test deletion: ' + (error instanceof Error ? error.message : 'Unknown error'));
    return false;
  }
};
