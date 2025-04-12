import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, CheckCircle, Clock, Calendar, AlertTriangle, Eye } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTestData } from '@/context/TestDataContext';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Task } from '@/types/task';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import DeleteCompletedItemButton from '@/components/student/DeleteCompletedItemButton';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { tests, submissions } = useTestData();
  const location = useLocation();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userTaskSubmissions, setUserTaskSubmissions] = useState<any[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  // Calculate progress stats
  const studentSubmissions = user ? submissions.filter(sub => sub.studentId === user.id) : [];
  const completedTests = studentSubmissions.length;
  const gradedSubmissions = studentSubmissions.filter(sub => sub.graded);
  const pendingResults = studentSubmissions.filter(sub => !sub.graded).length;

  // Get list of tests the student hasn't taken yet
  const takenTestIds = studentSubmissions.map(sub => sub.testId);
  const availableTests = tests.filter(test => !takenTestIds.includes(test.id));

  // Fetch tasks assigned to all students
  useEffect(() => {
    const fetchTasks = async () => {
      if (!user) return;

      try {
        setLoadingTasks(true);
        
        // Fetch all active tasks
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('status', 'active')
          .order('due_date', { ascending: true });
          
        if (error) throw error;
        
        // Transform to our Task interface
        const formattedTasks: Task[] = data.map((task: any) => ({
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
        
        // Fetch user's task submissions
        const { data: submissionsData, error: submissionsError } = await supabase
          .from('task_submissions')
          .select('*')
          .eq('student_id', user.id);
          
        if (submissionsError) throw submissionsError;
        
        setUserTaskSubmissions(submissionsData || []);
      } catch (err) {
        console.error('Error fetching tasks:', err);
        toast.error('Failed to load tasks');
      } finally {
        setLoadingTasks(false);
      }
    };
    
    fetchTasks();
  }, [user]);

  // Get list of tasks the student hasn't completed yet
  const completedTaskIds = userTaskSubmissions.map((sub: any) => sub.task_id);
  const availableTasks = tasks.filter(task => !completedTaskIds.includes(task.id));
  
  // Check if a task is overdue
  const isTaskOverdue = (dueDate: string) => new Date(dueDate) < new Date();
  
  // Check if a task is due today
  const isTaskDueToday = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    return due.getDate() === today.getDate() && 
           due.getMonth() === today.getMonth() && 
           due.getFullYear() === today.getFullYear();
  };

  return (
    <MainLayout>
      <div className="edu-container py-8">
        <h1 className="text-3xl font-bold mb-8">Student Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Available Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{availableTests.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Completed Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{completedTests}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Pending Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{availableTasks.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="available" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="available">Available Tests</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="results">My Results</TabsTrigger>
          </TabsList>
          
          <TabsContent value="available" className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Tests Available to Take</h2>
            
            {availableTests.length === 0 ? (
              <div className="text-center py-12 bg-secondary/30 rounded-lg">
                <CheckCircle size={48} className="mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">All Caught Up!</h3>
                <p className="text-muted-foreground">
                  You've completed all available tests. Check back later for new ones.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {availableTests.map(test => (
                  <Card key={test.id} className="edu-card hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-medium">{test.title}</h3>
                          {test.description && (
                            <p className="text-muted-foreground mt-1 text-sm">{test.description}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 mb-6 text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <FileText size={16} />
                          <span>{test.numQuestions} questions</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock size={16} />
                          <span>{test.durationMinutes} minutes</span>
                        </div>
                      </div>
                      
                      <Link to={`/student-dashboard/take-test/${test.id}`}>
                        <Button className="w-full">Start Test</Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="tasks" className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Assigned Tasks</h2>
            
            {loadingTasks ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : availableTasks.length === 0 ? (
              <div className="text-center py-12 bg-secondary/30 rounded-lg">
                <CheckCircle size={48} className="mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">All Tasks Completed!</h3>
                <p className="text-muted-foreground">
                  You've completed all assigned tasks. Check back later for new ones.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {availableTasks.map(task => (
                  <Card key={task.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-medium">{task.title}</h3>
                          {task.description && (
                            <p className="text-muted-foreground mt-1 text-sm line-clamp-2">
                              {task.description}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-6 text-sm">
                        <Calendar size={16} className="text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                        
                        {isTaskDueToday(task.dueDate) && (
                          <Badge variant="outline" className="ml-2 text-amber-500 border-amber-500">
                            Due today
                          </Badge>
                        )}
                        
                        {isTaskOverdue(task.dueDate) && (
                          <Badge variant="outline" className="ml-2 text-destructive border-destructive">
                            Overdue
                          </Badge>
                        )}
                      </div>
                      
                      <Link to={`/task-submission/${task.id}`}>
                        <Button className="w-full">
                          Submit Task
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            
            {/* Updated completed tasks section with delete buttons */}
            {userTaskSubmissions.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">Completed Tasks</h3>
                <div className="space-y-3">
                  {userTaskSubmissions.map((submission: any) => {
                    const task = tasks.find(t => t.id === submission.task_id);
                    return task ? (
                      <Card key={submission.id} className="bg-muted/30">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{task.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                Submitted: {new Date(submission.submitted_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-green-500 border-green-500">
                                Completed
                              </Badge>
                              <DeleteCompletedItemButton 
                                id={submission.id} 
                                title={task.title} 
                                type="task" 
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </TabsContent>
          
          {/* Updated results tab with delete buttons */}
          <TabsContent value="results" className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Your Test Results</h2>
            
            {studentSubmissions.length === 0 ? (
              <div className="text-center py-12 bg-secondary/30 rounded-lg">
                <FileText size={48} className="mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Results Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Take your first test to see results here
                </p>
                {availableTests.length > 0 && (
                  <Link to="/student-dashboard">
                    <Button>View Available Tests</Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {studentSubmissions.map(submission => {
                  const test = tests.find(t => t.id === submission.testId);
                  return (
                    <Card key={submission.id} className="p-6">
                      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-medium">
                              {test?.title || 'Unknown Test'}
                            </h3>
                            <Badge variant={submission.graded ? "outline" : "secondary"}>
                              {submission.graded ? 'Graded' : 'Pending'}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-4 mt-2">
                            <span className="text-sm text-muted-foreground">
                              Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                            </span>
                            {submission.graded && (
                              <span className="text-sm font-medium">
                                Score: {submission.score} / {test?.numQuestions}
                              </span>
                            )}
                          </div>
                          {submission.graded && submission.feedback && (
                            <div className="mt-4 p-3 bg-secondary/50 rounded-md">
                              <p className="text-sm font-medium mb-1">Feedback:</p>
                              <p className="text-sm text-muted-foreground">{submission.feedback}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Link to={`/student-dashboard/result/${submission.id}`}>
                            <Button variant="outline" size="sm" className="flex items-center gap-1">
                              <Eye size={16} />
                              <span>View Details</span>
                            </Button>
                          </Link>
                          <DeleteCompletedItemButton 
                            id={submission.id} 
                            title={test?.title || 'Unknown Test'} 
                            type="test" 
                          />
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default StudentDashboard;
