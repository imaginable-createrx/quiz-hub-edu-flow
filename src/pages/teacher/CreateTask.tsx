import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import MainLayout from '@/components/layout/MainLayout';
import { uploadFile } from '@/integrations/supabase/storage';
import { useAuth } from '@/context/AuthContext';
import { supabase, TasksResponse } from '@/integrations/supabase/client';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

interface FormValues {
  title: string;
  description: string;
  dueDate: Date;
}

const CreateTask: React.FC = () => {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormValues>();
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dueDate = watch('dueDate');
  
  const { user } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (data: FormValues) => {
    if (!user) {
      toast.error('You must be logged in to create a task');
      return;
    }

    try {
      setIsSubmitting(true);

      // First, insert the task in the database using the type for tasks
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .insert({
          title: data.title,
          description: data.description || null,
          due_date: data.dueDate.toISOString(),
          created_by: user.id,
          status: 'active'
        } as Partial<TasksResponse>)
        .select('id')
        .single();

      if (taskError) {
        throw taskError;
      }

      // If there's an attachment, upload it
      let attachmentUrl = null;
      if (attachment && taskData?.id) {
        const fileExt = attachment.name.split('.').pop();
        const fileName = `${taskData.id}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        attachmentUrl = await uploadFile('task_attachments', fileName, attachment);
        
        if (attachmentUrl) {
          // Update the task with the attachment URL using the type for tasks
          const { error: updateError } = await supabase
            .from('tasks')
            .update({ 
              attachment_url: attachmentUrl 
            } as Partial<TasksResponse>)
            .eq('id', taskData.id);
            
          if (updateError) {
            console.error('Error updating task with attachment:', updateError);
          }
        }
      }

      toast.success('Task created successfully!');
      navigate('/teacher-dashboard');
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachment(file);
      setAttachmentPreview(URL.createObjectURL(file));
    }
  };

  const removeAttachment = () => {
    if (attachmentPreview) {
      URL.revokeObjectURL(attachmentPreview);
    }
    setAttachment(null);
    setAttachmentPreview(null);
  };

  return (
    <MainLayout>
      <div className="container py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Create Task</CardTitle>
              <CardDescription>
                Create a new task for students to complete. Optionally attach a file for reference.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Task Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter task title"
                    {...register('title', { required: 'Task title is required' })}
                  />
                  {errors.title && (
                    <p className="text-sm text-destructive">{errors.title.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter task description"
                    className="min-h-[100px]"
                    {...register('description')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <div className="flex items-center space-x-2">
                    <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                          type="button"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dueDate ? format(dueDate, 'PPP') : "Select a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={dueDate}
                          onSelect={(date) => {
                            setValue('dueDate', date as Date);
                            setIsDatePickerOpen(false);
                          }}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  {!dueDate && (
                    <p className="text-sm text-destructive">Due date is required</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="attachment">Attachment (Optional)</Label>
                  {!attachmentPreview ? (
                    <Input
                      id="attachment"
                      type="file"
                      onChange={handleAttachmentChange}
                      accept="image/*,application/pdf"
                    />
                  ) : (
                    <div className="border rounded-md p-2 relative">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 h-8 w-8 p-0"
                        onClick={removeAttachment}
                      >
                        <X size={16} />
                      </Button>
                      {attachment?.type.includes('image') ? (
                        <img
                          src={attachmentPreview}
                          alt="Attachment preview"
                          className="max-h-40 mx-auto"
                        />
                      ) : (
                        <div className="py-8 text-center">
                          <p className="text-sm font-medium">
                            {attachment?.name} ({(attachment?.size / 1024).toFixed(1)} KB)
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/teacher-dashboard')}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting || !dueDate}>
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <Spinner size="sm" /> 
                        <span>Creating...</span>
                      </div>
                    ) : (
                      'Create Task'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default CreateTask;
