
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';
import { useTestData } from '@/context/TestDataContext';
import { Plus, Spinner } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { supabase, TaskSubmissionResponse } from '@/integrations/supabase/client';
import { Task } from '@/types/task';
import { toast } from 'sonner';
import TestsList from '@/components/teacher/TestsList';
import TasksList from '@/components/teacher/TasksList';
import SubmissionsList from '@/components/teacher/SubmissionsList';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tests, submissions } = useTestData();
  const [activeTab, setActiveTab] = useState('tests');
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskSubmissions, setTaskSubmissions] = useState<any[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

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
            <TestsList tests={tests} />
          </TabsContent>
          
          <TabsContent value="tasks" className="space-y-6">
            <TasksList 
              tasks={tasks} 
              loadingTasks={loadingTasks} 
              taskSubmissions={taskSubmissions} 
            />
          </TabsContent>
          
          <TabsContent value="submissions" className="space-y-6">
            <SubmissionsList tests={tests} submissions={submissions} />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

// Type for task response from Supabase
type TasksResponse = {
  id: string;
  title: string;
  description: string | null;
  due_date: string;
  created_at: string;
  created_by: string;
  attachment_url: string | null;
  status: string;
}

export default TeacherDashboard;
