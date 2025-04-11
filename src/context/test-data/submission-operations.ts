
import { Submission, AnswerImage } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const fetchSubmissions = async (user: { id: string; role: string } | null): Promise<Submission[]> => {
  try {
    if (!user) {
      return [];
    }

    // Use a different query based on user role
    let query = supabase
      .from('submissions')
      .select(`
        id,
        test_id,
        student_id,
        submitted_at,
        score,
        feedback,
        graded,
        answer_images (question_number, image_path)
      `);
      
    // Filter based on user role
    if (user.role === 'student') {
      query = query.eq('student_id', user.id);
    } else if (user.role === 'teacher') {
      // Teachers can see all submissions
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching submissions:', error);
      return [];
    }

    if (data) {
      const formattedSubmissions: Submission[] = data.map((sub: any) => {
        const answers: AnswerImage[] = sub.answer_images ? sub.answer_images.map((ans: any) => ({
          questionNumber: ans.question_number,
          imageUrl: ans.image_path
        })) : [];

        return {
          id: sub.id,
          testId: sub.test_id,
          studentId: sub.student_id,
          answers,
          submittedAt: sub.submitted_at,
          score: sub.score,
          feedback: sub.feedback,
          graded: sub.graded
        };
      });
      
      return formattedSubmissions;
    }
    return [];
  } catch (error) {
    console.error('Error in fetchSubmissions:', error);
    return [];
  }
};

export const addSubmission = async (
  submission: Omit<Submission, 'id' | 'submittedAt' | 'graded'>,
  userId: string | undefined
): Promise<string | undefined> => {
  try {
    if (!userId) {
      toast.error('You must be logged in to submit a test');
      return;
    }

    // Insert submission directly
    const { data, error } = await supabase
      .from('submissions')
      .insert({
        test_id: submission.testId,
        student_id: submission.studentId
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding submission:', error);
      throw error;
    }

    if (!data) {
      throw new Error('No data returned from submission creation');
    }

    const newSubmissionId = data.id;
    console.log('Created submission with ID:', newSubmissionId);
    
    return newSubmissionId;
  } catch (error) {
    console.error('Error adding submission:', error);
    toast.error('Failed to submit test: ' + (error instanceof Error ? error.message : 'Unknown error'));
    return undefined;
  }
};

export const gradeSubmission = async (
  submissionId: string,
  score: number,
  feedback: string | undefined,
  userRole: string | undefined
): Promise<boolean> => {
  try {
    if (!userRole || userRole !== 'teacher') {
      toast.error('Only teachers can grade submissions');
      return false;
    }

    // Update submission directly
    const { error } = await supabase
      .from('submissions')
      .update({
        score,
        feedback: feedback || null,
        graded: true
      })
      .eq('id', submissionId);

    if (error) {
      throw error;
    }

    toast.success('Submission graded successfully!');
    return true;
  } catch (error) {
    console.error('Error grading submission:', error);
    toast.error('Failed to grade submission: ' + (error instanceof Error ? error.message : 'Unknown error'));
    return false;
  }
};
