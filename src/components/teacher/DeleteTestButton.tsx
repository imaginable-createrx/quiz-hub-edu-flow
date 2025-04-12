
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
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
import { useTestData } from '@/context/TestDataContext';
import { deleteFile } from '@/integrations/supabase/storage';

// Import the BucketName type
import type { BucketName } from '@/integrations/supabase/storage';

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

      // Call the database function to delete all test data
      const { data, error } = await supabase
        .rpc('delete_test_complete', { p_test_id: testId });

      if (error) {
        console.error('Error calling delete_test_complete function:', error);
        throw new Error(`Failed to delete test data: ${error.message}`);
      }

      console.log('Database deletion result:', data);

      // Delete the PDF file from storage if it exists and isn't a placeholder
      if (pdfUrl && pdfUrl !== '/placeholder.svg') {
        // Explicitly type the bucket name to match the BucketName type
        const bucketName: BucketName = 'test_files';
        const deleteResult = await deleteFile(bucketName, pdfUrl);
        
        if (!deleteResult) {
          console.error('Warning: Could not delete PDF from storage:', pdfUrl);
          // Continue anyway, since the database records are deleted
        } else {
          console.log('Successfully deleted PDF from storage');
        }
      }

      // Update state in the TestDataContext
      const success = await deleteTest(testId);
      if (!success) {
        console.warn('Failed to update local state after test deletion');
      }

      toast.success(`Test "${testTitle}" deleted successfully`);
      
      // Return true to signal successful deletion to parent component
      return true;
    } catch (error) {
      console.error('Error deleting test:', error);
      toast.error('Failed to delete test: ' + (error instanceof Error ? error.message : 'Unknown error'));
      return false;
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
              All submissions for this test will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDelete().then(success => {
                  if (success) {
                    // Force refresh the page to update the test list
                    window.location.reload();
                  }
                });
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
