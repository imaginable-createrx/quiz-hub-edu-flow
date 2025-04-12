
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
import { deleteFile, BucketName } from '@/integrations/supabase/storage';

interface DeleteTaskButtonProps {
  taskId: string;
  taskTitle: string;
  attachmentUrl?: string;
}

const DeleteTaskButton: React.FC<DeleteTaskButtonProps> = ({ taskId, taskTitle, attachmentUrl }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      console.log('Starting deletion process for task:', taskId);

      // Call the database function to delete all task data
      const { data, error } = await supabase
        .rpc('delete_task_complete', { p_task_id: taskId });

      if (error) {
        console.error('Error calling delete_task_complete function:', error);
        throw new Error(`Failed to delete task data: ${error.message}`);
      }

      console.log('Database deletion result:', data);

      // Handle attachment deletion from storage if it exists
      if (attachmentUrl && attachmentUrl !== '/placeholder.svg') {
        // Specify the bucket name explicitly as a valid BucketName type
        const bucketName: BucketName = 'task_attachments';
        const deleteResult = await deleteFile(bucketName, attachmentUrl);
        
        if (!deleteResult) {
          console.error('Warning: Could not delete attachment from storage:', attachmentUrl);
          // Continue anyway, since the database records are deleted
        } else {
          console.log('Successfully deleted attachment from storage');
        }
      }

      toast.success(`Task "${taskTitle}" deleted successfully`);
      
      // Return true to signal successful deletion to parent component
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task: ' + (error instanceof Error ? error.message : 'Unknown error'));
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
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{taskTitle}"? This action cannot be undone.
              All task submissions will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDelete().then(success => {
                  if (success) {
                    // Force refresh the page to update the task list
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

export default DeleteTaskButton;
