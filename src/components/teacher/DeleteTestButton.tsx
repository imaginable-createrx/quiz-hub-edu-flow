
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useTestData } from '@/context/TestDataContext';
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
import { toast } from '@/components/ui/sonner';

interface DeleteTestButtonProps {
  testId: string;
  testTitle: string;
}

const DeleteTestButton: React.FC<DeleteTestButtonProps> = ({ testId, testTitle }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { deleteTest } = useTestData();

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const success = await deleteTest(testId);
      if (success) {
        toast.success(`Test "${testTitle}" deleted successfully`);
      }
    } catch (error) {
      console.error('Error deleting test:', error);
      toast.error('Failed to delete test');
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
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DeleteTestButton;
