
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useTestData } from '@/context/TestDataContext';
import { toast } from '@/components/ui/sonner';
import { ChevronLeft, Save } from 'lucide-react';

const GradeSubmission: React.FC = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const [score, setScore] = useState<string>('');
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { getSubmissionById, getTestById, gradeSubmission } = useTestData();
  const navigate = useNavigate();
  
  const submission = submissionId ? getSubmissionById(submissionId) : undefined;
  const test = submission ? getTestById(submission.testId) : undefined;
  
  useEffect(() => {
    if (!submission) {
      toast.error('Submission not found');
      navigate('/teacher-dashboard');
    }
  }, [submission, navigate]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!submissionId || !score) {
      toast.error('Please enter a score');
      return;
    }
    
    const numericScore = parseFloat(score);
    
    if (isNaN(numericScore)) {
      toast.error('Please enter a valid numeric score');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      gradeSubmission(submissionId, numericScore, feedback);
      toast.success('Submission graded successfully!');
      navigate('/teacher-dashboard');
    } catch (error) {
      console.error('Error grading submission:', error);
      toast.error('Failed to grade submission. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!submission || !test) {
    return <div>Loading...</div>;
  }
  
  return (
    <div className="edu-container py-8">
      <Button 
        variant="outline" 
        onClick={() => navigate('/teacher-dashboard')}
        className="mb-6"
      >
        <ChevronLeft size={16} className="mr-2" />
        Back to Dashboard
      </Button>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Grade Submission</h1>
        <p className="text-muted-foreground">
          Review and grade student submission for {test.title}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Student Answers</CardTitle>
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
              <CardTitle>Grading</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="score">Score (out of {test.numQuestions})</Label>
                  <Input
                    id="score"
                    type="number"
                    min="0"
                    max={test.numQuestions.toString()}
                    step="0.5"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    placeholder={`0-${test.numQuestions}`}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="feedback">Feedback (Optional)</Label>
                  <Textarea
                    id="feedback"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Provide feedback to the student"
                    rows={5}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isSubmitting}
                >
                  <Save size={16} className="mr-2" />
                  {isSubmitting ? 'Saving...' : 'Save Grade'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GradeSubmission;
