
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
import { deleteFile } from '@/integrations/supabase/storage';

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

      // Call the database function to delete all test data
      const { data, error } = await supabase
        .rpc('delete_test_complete', { p_test_id: testId });

      if (error) {
        console.error('Error calling delete_test_complete function:', error);
        throw new Error(`Failed to delete test data: ${error.message}`);
      }

      console.log('Database deletion result:', data);

      // Handle PDF deletion from storage if it exists and is not the placeholder
      if (pdfUrl && pdfUrl !== '/placeholder.svg') {
        // Instead of manually extracting the filename, use the storage helper
        const deleteResult = await deleteFile('test_files', pdfUrl);
        
        if (!deleteResult) {
          console.error('Warning: Could not delete PDF from storage:', pdfUrl);
          // Continue anyway, since the database records are deleted
        } else {
          console.log('Successfully deleted PDF from storage');
        }
      }

      // Update UI through context
      await deleteTestFunction(testId);
      toast.success(`Test "${testTitle}" deleted successfully`);
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
