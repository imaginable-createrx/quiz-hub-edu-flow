
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useTestData } from '@/context/TestDataContext';
import { Spinner } from '@/components/ui/spinner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface DeleteTestButtonProps {
  testId: string;
  testTitle: string;
  pdfUrl: string;
}

const DeleteTestButton: React.FC<DeleteTestButtonProps> = ({ testId, testTitle, pdfUrl }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Check for context availability to prevent errors
  let deleteTestFunction;
  try {
    const { deleteTest } = useTestData();
    deleteTestFunction = deleteTest;
  } catch (error) {
    console.error('TestDataContext not available:', error);
    toast.error('Unable to access test data context');
  }

  const handleDelete = async () => {
    try {
      // Safety check - if context is not available, show error
      if (!deleteTestFunction) {
        toast.error('TestDataContext is not available. Cannot delete test.');
        setIsOpen(false);
        return;
      }

      setIsDeleting(true);
      console.log('Starting deletion process for test:', testId);

      // 1. Get submissions related to this test
      const { data: submissionsData, error: fetchError } = await supabase
        .from('submissions')
        .select('id')
        .eq('test_id', testId);

      if (fetchError) {
        console.error('Error fetching submissions:', fetchError);
        throw new Error(`Failed to fetch submissions: ${fetchError.message}`);
      }

      // 2. For each submission, delete its answer images
      if (submissionsData && submissionsData.length > 0) {
        for (const submission of submissionsData) {
          // First get all answer images for this submission
          const { data: imagesData, error: imagesError } = await supabase
            .from('answer_images')
            .select('image_path')
            .eq('submission_id', submission.id);

          if (imagesError) {
            console.error('Error fetching answer images:', imagesError);
            continue;
          }

          // Delete images from storage
          if (imagesData && imagesData.length > 0) {
            for (const image of imagesData) {
              if (image.image_path) {
                const fileName = image.image_path.split('/').pop();
                if (fileName) {
                  const { error: storageError } = await supabase.storage
                    .from('answer_images')
                    .remove([fileName]);
                    
                  if (storageError) {
                    console.error('Error deleting image from storage:', storageError);
                  }
                }
              }
            }
          }

          // Delete answer images records
          const { error: deleteImagesError } = await supabase
            .from('answer_images')
            .delete()
            .eq('submission_id', submission.id);

          if (deleteImagesError) {
            console.error('Error deleting answer images records:', deleteImagesError);
          }
        }
      }

      // 3. Delete all submissions for this test
      const { error: deleteSubmissionsError } = await supabase
        .from('submissions')
        .delete()
        .eq('test_id', testId);

      if (deleteSubmissionsError) {
        console.error('Error deleting submissions:', deleteSubmissionsError);
        throw new Error(`Failed to delete submissions: ${deleteSubmissionsError.message}`);
      }

      // 4. Call the context method to delete the test itself (which handles PDF deletion)
      const success = await deleteTestFunction(testId);
      
      if (success) {
        toast.success(`Test "${testTitle}" deleted successfully`);
      } else {
        throw new Error('Delete test operation failed');
      }
    } catch (error) {
      console.error('Error deleting test:', error);
      toast.error('Failed to delete test: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsDeleting(false);
      setIsOpen(false);
    }
  };

  return (
    <>
      <Button 
        variant="destructive" 
        size="sm" 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1"
      >
        <Trash2 size={16} />
        <span>Delete</span>
      </Button>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Test</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{testTitle}"? This action cannot be undone.
              All test submissions and files will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <span className="flex items-center gap-2">
                  <Spinner size="sm" className="text-white" /> 
                  Deleting...
                </span>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DeleteTestButton;
