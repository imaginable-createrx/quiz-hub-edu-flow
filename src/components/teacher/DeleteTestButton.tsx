
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
  const { deleteTest } = useTestData();

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      console.log('Starting deletion process for test:', testId);

      // 1. First delete all submissions related to this test
      const { error: subError } = await supabase
        .from('submissions')
        .delete()
        .eq('test_id', testId);

      if (subError) {
        console.error('Error deleting test submissions:', subError);
        throw new Error(`Failed to delete test submissions: ${subError.message}`);
      }
      
      // 2. Get the list of answer images to delete
      const { data: answerImagesData } = await supabase
        .from('answer_images')
        .select('*')
        .eq('submission_id', testId);

      if (answerImagesData && answerImagesData.length > 0) {
        // Delete the answer images from storage
        for (const image of answerImagesData) {
          if (image.image_path) {
            const { error: storageError } = await supabase.storage
              .from('answer_images')
              .remove([image.image_path.split('/').pop() || '']);
            
            if (storageError) {
              console.error('Error deleting answer image from storage:', storageError);
            }
          }
        }

        // Delete answer images records
        const { error: imagesError } = await supabase
          .from('answer_images')
          .delete()
          .eq('submission_id', testId);

        if (imagesError) {
          console.error('Error deleting answer images records:', imagesError);
        }
      }

      // 3. Finally call the context method to delete the test (which handles PDF deletion)
      const success = await deleteTest(testId);
      
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
