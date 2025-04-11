
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';
import { useTestData } from '@/context/TestDataContext';
import { Calendar, Clock, FileText, Plus, Users, CheckCircle, Eye } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import DeleteTestButton from '@/components/teacher/DeleteTestButton';
import DeleteTaskButton from '@/components/teacher/DeleteTaskButton';
import ViewTaskSubmissions from '@/components/teacher/ViewTaskSubmissions';
import { Badge } from "@/components/ui/badge";
import { Spinner } from '@/components/ui/spinner';
import { supabase, TasksResponse, TaskSubmissionResponse } from '@/integrations/supabase/client';
import { Task } from '@/types/task';
import { toast } from 'sonner';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tests, submissions, getSubmissionsByTestId } = useTestData();
  const [activeTab, setActiveTab] = useState('tests');
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskSubmissions, setTaskSubmissions] = useState<any[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [viewSubmissionsOpen, setViewSubmissionsOpen] = useState(false);

  // Fetch tasks created by this teacher
  useEffect(() => {
    const fetchTasks = async () => {
      if (!user) return;
      
      try {
        setLoadingTasks(true);
        
        // Using type assertion for 'tasks' table
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('created_by', user.id)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        // Transform the data to match our Task interface
        const formattedTasks: Task[] = (data as unknown as TasksResponse[]).map((task) => ({
          id: task.id,
          title: task.title,
          description: task.description || undefined,
          dueDate: task.due_date,
          createdAt: task.created_at,
          createdBy: task.created_by,
          attachmentUrl: task.attachment_url || undefined,
          status: task.status as 'active' | 'completed'
        }));
        
        setTasks(formattedTasks);
        
        // Also fetch task submissions for these tasks
        const taskIds = formattedTasks.map(t => t.id);
        if (taskIds.length > 0) {
          // Using type assertion for 'task_submissions' table
          const { data: submissionsData, error: submissionsError } = await supabase
            .from('task_submissions')
            .select('*')
            .in('task_id', taskIds);
            
          if (submissionsError) throw submissionsError;
          
          setTaskSubmissions(submissionsData as unknown as TaskSubmissionResponse[]);
        }
      } catch (err) {
        console.error('Error fetching tasks:', err);
        toast.error('Failed to load tasks');
      } finally {
        setLoadingTasks(false);
      }
    };
    
    fetchTasks();
  }, [user]);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Redirect if not a teacher
  useEffect(() => {
    if (user && user.role !== 'teacher') {
      navigate('/student-dashboard');
    }
  }, [user, navigate]);

  const openTaskSubmissions = (taskId: string) => {
    setSelectedTaskId(taskId);
    setViewSubmissionsOpen(true);
  };

  const closeTaskSubmissions = () => {
    setViewSubmissionsOpen(false);
    setSelectedTaskId(null);
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="container py-8 flex justify-center items-center min-h-[60vh]">
          <Spinner size="lg" />
        </div>
      </MainLayout>
    );
  }

  // Function to count task submissions by task ID
  const getSubmissionCountForTask = (taskId: string) => {
    return taskSubmissions.filter(sub => sub.task_id === taskId).length;
  };

  return (
    <MainLayout>
      <div className="container py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
            <p className="text-muted-foreground">Manage your tests and grade student submissions</p>
          </div>
          
          <div className="flex gap-4">
            <Button 
              onClick={() => navigate('/teacher-dashboard/create-task')}
              className="flex gap-2"
            >
              <Plus size={20} />
              <span>Assign Task</span>
            </Button>
          
            <Button 
              size="lg" 
              onClick={() => navigate('/teacher-dashboard/upload-test')}
              className="flex gap-2"
            >
              <Plus size={20} />
              <span>Create Test</span>
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="tests">My Tests</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="submissions">Test Submissions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tests" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {tests.length > 0 ? (
                tests.map(test => (
                  <Card key={test.id} className="overflow-hidden">
                    <div className="h-32 bg-muted flex items-center justify-center">
                      <FileText size={48} className="text-muted-foreground" />
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle>{test.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {test.description || 'No description provided'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock size={16} className="text-muted-foreground" />
                          <span>{test.durationMinutes} min</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar size={16} className="text-muted-foreground" />
                          <span>{new Date(test.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="outline" asChild>
                        <a href={test.pdfUrl} target="_blank" rel="noopener noreferrer">
                          View PDF
                        </a>
                      </Button>
                      <DeleteTestButton 
                        testId={test.id} 
                        testTitle={test.title} 
                        pdfUrl={test.pdfUrl}
                      />
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center p-12 text-center">
                  <FileText size={48} className="text-muted-foreground mb-4" />
                  <h3 className="text-xl font-medium mb-2">No Tests Created</h3>
                  <p className="text-muted-foreground mb-4">
                    You haven't created any tests yet. Create your first test to get started.
                  </p>
                  <Button onClick={() => navigate('/teacher-dashboard/upload-test')}>
                    Create Test
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="tasks" className="space-y-6">
            {loadingTasks ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : tasks.length > 0 ? (
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
            ) : (
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
            )}
          </TabsContent>
          
          <TabsContent value="submissions" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {tests.map(test => {
                const submissionsForTest = submissions.filter(sub => sub.testId === test.id);
                const gradedCount = submissionsForTest.filter(sub => sub.graded).length;
                const pendingCount = submissionsForTest.length - gradedCount;

                return (
                  <Card key={test.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle>{test.title}</CardTitle>
                      <CardDescription>
                        <div className="flex items-center gap-2">
                          <Users size={16} className="text-muted-foreground" />
                          <span>{submissionsForTest.length} Submissions</span>
                          {pendingCount > 0 && (
                            <Badge variant="secondary">
                              {pendingCount} Pending
                            </Badge>
                          )}
                        </div>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-none pl-0">
                        {submissionsForTest.length > 0 ? (
                          submissionsForTest.map(submission => (
                            <li key={submission.id} className="py-2 border-b last:border-b-0">
                              <div className="flex justify-between items-center">
                                <span>Submission ID: {submission.id}</span>
                                <div>
                                  {submission.graded ? (
                                    <span className="text-green-500">Graded</span>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        navigate(`/teacher-dashboard/grade-submission/${submission.id}`)
                                      }
                                    >
                                      Grade
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </li>
                          ))
                        ) : (
                          <li className="py-4 text-center text-muted-foreground">
                            No submissions yet
                          </li>
                        )}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Task Submissions Dialog */}
      {selectedTaskId && (
        <ViewTaskSubmissions 
          taskId={selectedTaskId}
          isOpen={viewSubmissionsOpen}
          onClose={closeTaskSubmissions}
        />
      )}
    </MainLayout>
  );
};

export default TeacherDashboard;
