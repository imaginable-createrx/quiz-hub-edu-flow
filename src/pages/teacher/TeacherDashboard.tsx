import React, { useState, useEffect } from 'react';
import { useNavigate, Link, Routes, Route } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';
import { useTestData } from '@/context/TestDataContext';
import { Calendar, Clock, FileText, Plus, Users } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import DeleteTestButton from '@/components/teacher/DeleteTestButton';
import { Badge } from "@/components/ui/badge"

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tests, submissions, getSubmissionsByTestId } = useTestData();
  const [activeTab, setActiveTab] = useState('tests');

  // Redirect if not a teacher
  useEffect(() => {
    if (user && user.role !== 'teacher') {
      navigate('/student-dashboard');
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  return (
    <MainLayout>
      <div className="container py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
            <p className="text-muted-foreground">Manage your tests and grade student submissions</p>
          </div>
          
          <Button 
            size="lg" 
            onClick={() => navigate('/teacher-dashboard/upload-test')}
            className="flex gap-2"
          >
            <Plus size={20} />
            <span>Create Test</span>
          </Button>
        </div>
        
        <Tabs defaultValue="tests" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="tests">My Tests</TabsTrigger>
            <TabsTrigger value="submissions">Student Submissions</TabsTrigger>
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
                      <DeleteTestButton testId={test.id} testTitle={test.title} />
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
                        {submissionsForTest.map(submission => (
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
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default TeacherDashboard;
