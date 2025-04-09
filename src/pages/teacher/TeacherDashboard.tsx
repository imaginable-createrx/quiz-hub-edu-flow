
import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  CheckSquare, 
  PlusCircle,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useTestData } from '@/context/TestDataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const { tests, submissions, deleteTest } = useTestData();
  const location = useLocation();
  const navigate = useNavigate();
  
  // State for delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [testToDelete, setTestToDelete] = useState<string | null>(null);
  
  // Count submissions waiting for grading
  const pendingGrades = submissions.filter(sub => !sub.graded).length;

  // Handle deleting a test
  const handleDeleteTest = async () => {
    if (!testToDelete) return;
    
    const success = await deleteTest(testToDelete);
    if (success) {
      // If deletion was successful, close the dialog
      setIsDeleteDialogOpen(false);
      setTestToDelete(null);
    }
  };

  // If we're on a sub-route, render the Outlet component
  if (location.pathname !== '/teacher-dashboard') {
    return (
      <MainLayout>
        <Outlet />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="edu-container py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
          <Link to="/teacher-dashboard/upload-test">
            <Button className="flex items-center gap-2">
              <PlusCircle size={18} />
              <span>Upload New Test</span>
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Total Tests</CardTitle>
              <CardDescription>All your uploaded tests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{tests.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Pending Submissions</CardTitle>
              <CardDescription>Waiting to be graded</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{pendingGrades}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Graded Submissions</CardTitle>
              <CardDescription>Completed assessments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {submissions.filter(sub => sub.graded).length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="tests" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="tests">My Tests</TabsTrigger>
            <TabsTrigger value="grading">Grading</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tests" className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Your Tests</h2>
            
            {tests.length === 0 ? (
              <div className="text-center py-12 bg-secondary/30 rounded-lg">
                <FileText size={48} className="mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Tests Yet</h3>
                <p className="text-muted-foreground mb-4">Upload your first test to get started</p>
                <Link to="/teacher-dashboard/upload-test">
                  <Button>Upload Test</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {tests.map(test => (
                  <div key={test.id} className="edu-card p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-medium">{test.title}</h3>
                        {test.description && (
                          <p className="text-muted-foreground mt-1">{test.description}</p>
                        )}
                        <div className="flex gap-4 mt-2">
                          <span className="text-sm text-muted-foreground">
                            {test.numQuestions} questions
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {test.durationMinutes} minutes
                          </span>
                          <span className="text-sm text-muted-foreground">
                            Created: {new Date(test.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link to={`/teacher-dashboard/test/${test.id}`}>
                          <Button variant="outline" size="sm">View Details</Button>
                        </Link>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => {
                            setTestToDelete(test.id);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckSquare size={18} className="text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {submissions.filter(sub => sub.testId === test.id).length} Submissions
                        </span>
                      </div>
                      
                      <Link to={`/teacher-dashboard/grade/${test.id}`}>
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="text-sm"
                          disabled={submissions.filter(sub => sub.testId === test.id).length === 0}
                        >
                          Grade Submissions
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="grading" className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Pending Submissions</h2>
            
            {pendingGrades === 0 ? (
              <div className="text-center py-12 bg-secondary/30 rounded-lg">
                <CheckSquare size={48} className="mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Pending Submissions</h3>
                <p className="text-muted-foreground">
                  All student submissions have been graded!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {submissions
                  .filter(sub => !sub.graded)
                  .map(submission => {
                    const test = tests.find(t => t.id === submission.testId);
                    return (
                      <div key={submission.id} className="edu-card p-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-xl font-medium">
                              {test?.title || 'Unknown Test'}
                            </h3>
                            <div className="flex gap-4 mt-2">
                              <span className="text-sm text-muted-foreground">
                                Submitted: {new Date(submission.submittedAt).toLocaleString()}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                Student ID: {submission.studentId}
                              </span>
                            </div>
                          </div>
                          <Link to={`/teacher-dashboard/grade-submission/${submission.id}`}>
                            <Button variant="default" size="sm">Grade Now</Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Test Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-destructive" size={20} /> 
              Delete Test
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this test? This action cannot be undone. 
              All associated files and data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTestToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteTest}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default TeacherDashboard;
