
import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTestData } from '@/context/TestDataContext';
import { Badge } from '@/components/ui/badge';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { tests, submissions } = useTestData();
  const location = useLocation();

  // If we're on a sub-route, render the Outlet component
  if (location.pathname !== '/student-dashboard') {
    return (
      <MainLayout>
        <Outlet />
      </MainLayout>
    );
  }

  // Calculate progress stats
  const studentSubmissions = user ? submissions.filter(sub => sub.studentId === user.id) : [];
  const completedTests = studentSubmissions.length;
  const gradedSubmissions = studentSubmissions.filter(sub => sub.graded);
  const pendingResults = studentSubmissions.filter(sub => !sub.graded).length;

  // Get list of tests the student hasn't taken yet
  const takenTestIds = studentSubmissions.map(sub => sub.testId);
  const availableTests = tests.filter(test => !takenTestIds.includes(test.id));

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
              <CardTitle className="text-lg font-medium">Pending Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{pendingResults}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="available" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="available">Available Tests</TabsTrigger>
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
                        
                        <Link to={`/student-dashboard/result/${submission.id}`}>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </Link>
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
