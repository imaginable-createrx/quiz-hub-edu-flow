
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { uploadFile } from '@/integrations/supabase/storage';
import MainLayout from '@/components/layout/MainLayout';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { Task } from '@/types/task';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, FileText, AlertTriangle, Camera, Upload } from 'lucide-react';

const TaskSubmission: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  
  // Fetch the task data
  useEffect(() => {
    const fetchTask = async () => {
      if (!taskId) {
        setLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('id', taskId)
          .single();
        
        if (error) throw error;
        
        setTask({
          id: data.id,
          title: data.title,
          description: data.description,
          dueDate: data.due_date,
          createdAt: data.created_at,
          createdBy: data.created_by,
          attachmentUrl: data.attachment_url,
          status: data.status
        });
      } catch (error) {
        console.error('Error fetching task:', error);
        toast.error('Failed to load task data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTask();
  }, [taskId]);
  
  // Check if user has already submitted this task
  useEffect(() => {
    if (!taskId || !user) return;
    
    const checkSubmission = async () => {
      try {
        const { data, error } = await supabase
          .from('task_submissions')
          .select('*')
          .eq('task_id', taskId)
          .eq('student_id', user.id)
          .single();
        
        if (data) {
          // User has already submitted, redirect to student dashboard
          toast.info('You have already submitted this task');
          navigate('/student-dashboard');
        }
      } catch (error) {
        // No submission found, that's expected
        console.log('No previous submission found');
      }
    };
    
    checkSubmission();
  }, [taskId, user, navigate]);
  
  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check if file is an image or video
      if (!file.type.includes('image') && !file.type.includes('video')) {
        toast.error('Please upload an image or video file as confirmation');
        return;
      }
      
      setAttachment(file);
      setAttachmentPreview(URL.createObjectURL(file));
    }
  };
  
  const submitTask = async () => {
    if (!user || !taskId || !task) {
      toast.error('Missing required information');
      return;
    }
    
    if (!attachment) {
      toast.error('Please upload an image or video as confirmation');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Upload the file
      const fileExt = attachment.name.split('.').pop();
      const fileName = `${taskId}_${user.id}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const attachmentUrl = await uploadFile('task_attachments', fileName, attachment);
      
      if (!attachmentUrl) {
        throw new Error('Failed to upload confirmation file');
      }
      
      // Create submission record
      const { error } = await supabase
        .from('task_submissions')
        .insert({
          task_id: taskId,
          student_id: user.id,
          attachment_url: attachmentUrl,
          status: 'submitted'
        });
      
      if (error) throw error;
      
      toast.success('Task submitted successfully!');
      navigate('/student-dashboard');
    } catch (error) {
      console.error('Error submitting task:', error);
      toast.error('Failed to submit task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <MainLayout>
        <div className="container py-8 flex justify-center items-center min-h-[60vh]">
          <Spinner size="lg" />
        </div>
      </MainLayout>
    );
  }
  
  if (!task) {
    return (
      <MainLayout>
        <div className="container py-8 flex justify-center items-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-center">Task Not Found</CardTitle>
              <CardDescription className="text-center">
                The task you're looking for doesn't exist or has been removed.
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-center">
              <Button onClick={() => navigate('/student-dashboard')}>
                Return to Dashboard
              </Button>
            </CardFooter>
          </Card>
        </div>
      </MainLayout>
    );
  }
  
  const isTaskDueToday = new Date(task.dueDate).toDateString() === new Date().toDateString();
  const isTaskOverdue = new Date(task.dueDate) < new Date();
  
  return (
    <MainLayout>
      <div className="container py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{task.title}</CardTitle>
                  <CardDescription>
                    Due: {new Date(task.dueDate).toLocaleDateString()} 
                    {isTaskDueToday && <span className="text-amber-500 ml-2 font-medium">Due today!</span>}
                    {isTaskOverdue && <span className="text-destructive ml-2 font-medium">Overdue!</span>}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {task.description && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Description</h3>
                  <p className="text-muted-foreground whitespace-pre-line">{task.description}</p>
                </div>
              )}
              
              {task.attachmentUrl && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Attachment</h3>
                  <a 
                    href={task.attachmentUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <FileText size={16} />
                    <span>View Attachment</span>
                  </a>
                </div>
              )}
              
              <div className="pt-4">
                <h3 className="text-base font-medium mb-4">Submit Task Confirmation</h3>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  {!attachmentPreview ? (
                    <div className="space-y-4">
                      <Camera size={48} className="mx-auto text-muted-foreground" />
                      <p className="text-muted-foreground">
                        Upload a photo or video as evidence of completing this task
                      </p>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          const fileInput = document.createElement('input');
                          fileInput.type = 'file';
                          fileInput.accept = 'image/*,video/*';
                          fileInput.onchange = (e) => {
                            const target = e.target as HTMLInputElement;
                            if (target.files && target.files[0]) {
                              handleAttachmentChange(e as any);
                            }
                          };
                          fileInput.click();
                        }}
                        className="flex gap-2"
                      >
                        <Upload size={16} />
                        <span>Upload</span>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {attachment?.type.includes('image') ? (
                        <img 
                          src={attachmentPreview} 
                          alt="Confirmation" 
                          className="max-h-64 mx-auto rounded-md"
                        />
                      ) : (
                        <video 
                          src={attachmentPreview} 
                          controls 
                          className="max-h-64 w-full rounded-md"
                        />
                      )}
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          if (attachmentPreview) {
                            URL.revokeObjectURL(attachmentPreview);
                          }
                          setAttachment(null);
                          setAttachmentPreview(null);
                        }}
                      >
                        Change File
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-4">
              <Button 
                variant="outline" 
                onClick={() => navigate('/student-dashboard')}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button 
                onClick={submitTask} 
                disabled={!attachment || submitting}
                className="flex gap-2"
              >
                {submitting ? (
                  <>
                    <Spinner size="sm" /> Submitting...
                  </>
                ) : (
                  <>
                    <Check size={16} /> Submit Task
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default TaskSubmission;
