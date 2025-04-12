
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

interface DeleteCompletedItemButtonProps {
  id: string;
  title: string;
  type: 'test' | 'task';
}

const DeleteCompletedItemButton: React.FC<DeleteCompletedItemButtonProps> = ({ id, title, type }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      console.log(`Starting deletion process for ${type}:`, id);

      // Call the appropriate database function to delete the record
      let result;
      if (type === 'test') {
        // Delete test submission record
        result = await supabase
          .from('submissions')
          .delete()
          .eq('id', id);
      } else {
        // Delete task submission record
        result = await supabase
          .from('task_submissions')
          .delete()
          .eq('id', id);
      }

      if (result.error) {
        console.error(`Error deleting ${type}:`, result.error);
        throw new Error(`Failed to delete ${type}: ${result.error.message}`);
      }

      toast.success(`${type === 'test' ? 'Test' : 'Task'} "${title}" removed from your history`);
      return true;
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      toast.error(`Failed to delete ${type}: ` + (error instanceof Error ? error.message : 'Unknown error'));
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
        <span>Remove</span>
      </Button>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {type === 'test' ? 'Test' : 'Task'}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{title}" from your history? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDelete().then(success => {
                  if (success) {
                    // Force refresh the page to update the list
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
                  Removing...
                </span>
              ) : (
                'Remove'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DeleteCompletedItemButton;
