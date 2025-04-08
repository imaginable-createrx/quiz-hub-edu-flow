
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useTestData } from '@/context/TestDataContext';
import { ChevronLeft, CheckCircle, Clock, CalendarIcon } from 'lucide-react';

const TestResult: React.FC = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const { getSubmissionById, getTestById } = useTestData();
  const navigate = useNavigate();
  
  const submission = submissionId ? getSubmissionById(submissionId) : undefined;
  const test = submission ? getTestById(submission.testId) : undefined;
  
  useEffect(() => {
    if (!submission || !test) {
      navigate('/student-dashboard');
    }
  }, [submission, test, navigate]);
  
  if (!submission || !test) {
    return <div>Loading...</div>;
  }
  
  return (
    <div className="edu-container py-8">
      <Button 
        variant="outline" 
        onClick={() => navigate('/student-dashboard')}
        className="mb-6"
      >
        <ChevronLeft size={16} className="mr-2" />
        Back to Dashboard
      </Button>
      
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">{test.title}</h1>
          <Badge variant={submission.graded ? "outline" : "secondary"}>
            {submission.graded ? 'Graded' : 'Pending Grade'}
          </Badge>
        </div>
        {test.description && (
          <p className="text-muted-foreground">{test.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Your Answers</CardTitle>
            </CardHeader>
            <CardContent>
              {submission.answers.length === 0 ? (
                <div className="text-center py-8 bg-secondary/30 rounded-lg">
                  <p className="text-muted-foreground">No answers submitted</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {submission.answers.map((answer) => (
                    <div key={answer.questionNumber}>
                      <h3 className="text-lg font-medium mb-2">
                        Question {answer.questionNumber}
                      </h3>
                      
                      <div className="border border-border rounded-lg overflow-hidden">
                        <img 
                          src={answer.imageUrl} 
                          alt={`Answer to question ${answer.questionNumber}`}
                          className="w-full h-auto"
                        />
                      </div>
                      
                      {answer.questionNumber < submission.answers.length && (
                        <Separator className="my-6" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle>Result Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-secondary/30 rounded-lg p-6 text-center">
                {submission.graded ? (
                  <>
                    <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-3">
                      <CheckCircle size={32} className="text-primary" />
                    </div>
                    <div className="text-3xl font-bold mb-1">
                      {submission.score} / {test.numQuestions}
                    </div>
                    <p className="text-muted-foreground">
                      {Math.round((submission.score! / test.numQuestions) * 100)}% Score
                    </p>
                  </>
                ) : (
                  <>
                    <div className="inline-flex items-center justify-center p-3 bg-secondary rounded-full mb-3">
                      <Clock size={32} className="text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-medium mb-1">
                      Awaiting Grade
                    </div>
                    <p className="text-muted-foreground">
                      Check back later for your results
                    </p>
                  </>
                )}
              </div>

              <div>
                <h3 className="font-medium mb-3">Test Details</h3>
                <ul className="space-y-2">
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Questions</span>
                    <span className="font-medium">{test.numQuestions}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-medium">{test.durationMinutes} minutes</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Submitted</span>
                    <span className="font-medium">
                      {new Date(submission.submittedAt).toLocaleDateString()}
                    </span>
                  </li>
                </ul>
              </div>

              {submission.graded && submission.feedback && (
                <div>
                  <h3 className="font-medium mb-3">Feedback</h3>
                  <div className="p-4 bg-secondary/30 rounded-lg">
                    <p className="text-muted-foreground">{submission.feedback}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TestResult;
