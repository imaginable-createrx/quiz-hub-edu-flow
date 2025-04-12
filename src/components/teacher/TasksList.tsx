
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Calendar, Users, Eye } from 'lucide-react';
import DeleteTaskButton from '@/components/teacher/DeleteTaskButton';
import { Task } from '@/types/task';
import ViewTaskSubmissions from '@/components/teacher/ViewTaskSubmissions';
import { Spinner } from '@/components/ui/spinner';

interface TasksListProps {
  tasks: Task[];
  loadingTasks: boolean;
  taskSubmissions: any[];
}

const TasksList: React.FC<TasksListProps> = ({ tasks, loadingTasks, taskSubmissions }) => {
  const navigate = useNavigate();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [viewSubmissionsOpen, setViewSubmissionsOpen] = useState(false);

  const openTaskSubmissions = (taskId: string) => {
    setSelectedTaskId(taskId);
    setViewSubmissionsOpen(true);
  };

  const closeTaskSubmissions = () => {
    setViewSubmissionsOpen(false);
    setSelectedTaskId(null);
  };

  // Function to count task submissions by task ID
  const getSubmissionCountForTask = (taskId: string) => {
    return taskSubmissions.filter(sub => sub.task_id === taskId).length;
  };

  if (loadingTasks) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="col-span-full flex flex-col items-center justify-center p-12 text-center">
        <CheckCircle size={48} className="text-muted-foreground mb-4" />
        <h3 className="text-xl font-medium mb-2">No Tasks Created</h3>
        <p className="text-muted-foreground mb-4">
          You haven't created any tasks yet. Create your first task to get started.
        </p>
        <Button onClick={() => navigate('/teacher-dashboard/create-task')}>
          Create Task
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tasks.map(task => {
          const submissionCount = getSubmissionCountForTask(task.id);
          
          return (
            <Card key={task.id} className="overflow-hidden">
              <div className="h-32 bg-muted flex items-center justify-center">
                <CheckCircle size={48} className="text-muted-foreground" />
              </div>
              <CardHeader className="pb-2">
                <CardTitle>{task.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {task.description || 'No description provided'}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar size={16} className="text-muted-foreground" />
                    <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users size={16} className="text-muted-foreground" />
                    <span>{submissionCount} Submissions</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2 justify-between">
                <div className="flex flex-wrap gap-2">
                  {task.attachmentUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={task.attachmentUrl} target="_blank" rel="noopener noreferrer">
                        View Attachment
                      </a>
                    </Button>
                  )}
                  
                  {submissionCount > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openTaskSubmissions(task.id)}
                      className="flex items-center gap-1"
                    >
                      <Eye size={14} />
                      <span>View Submissions</span>
                    </Button>
                  )}
                </div>
                
                <DeleteTaskButton 
                  taskId={task.id} 
                  taskTitle={task.title} 
                  attachmentUrl={task.attachmentUrl}
                />
              </CardFooter>
            </Card>
          );
        })}
      </div>
      
      {/* Task Submissions Dialog */}
      {selectedTaskId && (
        <ViewTaskSubmissions 
          taskId={selectedTaskId}
          isOpen={viewSubmissionsOpen}
          onClose={closeTaskSubmissions}
        />
      )}
    </>
  );
};

export default TasksList;
