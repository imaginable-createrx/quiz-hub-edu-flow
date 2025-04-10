
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import { useTestData } from '@/context/TestDataContext';
import { toast } from 'sonner';
import { Clock, AlertTriangle, Camera, FileText } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Spinner } from '@/components/ui/spinner';
import PDFViewer from '@/components/pdf/PDFViewer';

const TakeTest: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFinishDialogOpen, setIsFinishDialogOpen] = useState(false);
  const [answers, setAnswers] = useState<{ questionNumber: number; imageUrl: string; file?: File }[]>([]);
  const [loading, setLoading] = useState(true);
  const [pdfLoadingSuccess, setPdfLoadingSuccess] = useState(false);
  
  const { user } = useAuth();
  const { tests, getTestById, addSubmission, uploadAnswerImage } = useTestData();
  const navigate = useNavigate();
  
  // Get the test data based on testId
  const test = testId ? getTestById(testId) : undefined;
  
  useEffect(() => {
    const initTest = async () => {
      if (!testId) {
        console.error('No test ID provided');
        toast.error('Test ID is missing');
        setLoading(false);
        return;
      }
      
      if (tests.length === 0) {
        console.log('Tests data not loaded yet, waiting...');
        setLoading(true);
        return;
      }
      
      const currentTest = getTestById(testId);
      if (!currentTest) {
        console.error('Test not found with ID:', testId);
        toast.error('Test not found');
        setLoading(false);
        return;
      }
      
      console.log('Loaded test successfully:', currentTest);
      console.log('PDF URL:', currentTest.pdfUrl);
      
      // Initialize timer
      setTimeLeft(currentTest.durationMinutes * 60);
      setLoading(false);
    };
    
    initTest();
  }, [testId, tests, getTestById]);
  
  // Timer countdown
  useEffect(() => {
    if (timeLeft === null) return;
    
    if (timeLeft <= 0) {
      // Time's up, redirect to submission page
      setIsDialogOpen(true);
      return;
    }
    
    const timer = setTimeout(() => {
      setTimeLeft(prevTime => (prevTime !== null ? prevTime - 1 : null));
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [timeLeft]);
  
  // Format time display
  const formatTime = useCallback((seconds: number | null) => {
    if (seconds === null) return '00:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);
  
  // Handle test submission
  const handleSubmit = async () => {
    if (!user || !testId || !test) {
      toast.error("Missing required information for submission");
      return;
    }
    
    try {
      toast.info("Submitting your test answers...");
      
      // Create submission to get submission ID
      const submissionId = await addSubmission({
        testId,
        studentId: user.id,
        answers: []
      });
      
      if (!submissionId) {
        throw new Error("Failed to create submission record");
      }
      
      console.log("Created submission with ID:", submissionId);
      
      // Upload each answer image
      const uploadPromises = answers.map(async (answer) => {
        if (answer.file) {
          const result = await uploadAnswerImage(submissionId, answer.questionNumber, answer.file);
          console.log(`Uploaded answer ${answer.questionNumber}:`, result);
          return result;
        }
        return null;
      });
      
      await Promise.all(uploadPromises);
      
      toast.success('Test submitted successfully!');
      navigate('/student-dashboard');
    } catch (error) {
      console.error('Error submitting test:', error);
      toast.error('Failed to submit test. Please try again.');
    }
  };
  
  const handleFinishClick = () => {
    setIsFinishDialogOpen(true);
  };

  // Handle image captures for answers
  const handleImageUpload = (questionNumber: number, file: File) => {
    // Create URL for preview
    const imageUrl = URL.createObjectURL(file);
    setAnswers(prev => {
      const newAnswers = [...prev];
      const existingIndex = newAnswers.findIndex(a => a.questionNumber === questionNumber);
      
      if (existingIndex >= 0) {
        // Revoke old object URL to prevent memory leaks
        if (newAnswers[existingIndex].imageUrl) {
          URL.revokeObjectURL(newAnswers[existingIndex].imageUrl);
        }
        newAnswers[existingIndex] = { questionNumber, imageUrl, file };
      } else {
        newAnswers.push({ questionNumber, imageUrl, file });
      }
      
      return newAnswers;
    });
    
    toast.success(`Answer for question ${questionNumber} uploaded successfully!`);
  };
  
  if (loading) {
    return (
      <MainLayout>
        <div className="edu-container py-8 flex justify-center items-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="mx-auto">
              <Spinner size="lg" />
            </div>
            <p className="text-xl font-medium">Loading test content...</p>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  if (!test) {
    return (
      <MainLayout>
        <div className="edu-container py-8 flex justify-center items-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <AlertTriangle size={48} className="mx-auto text-destructive mb-4" />
            <h2 className="text-2xl font-bold mb-2">Test Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The test you're looking for (ID: {testId}) doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate('/student-dashboard')}>
              Return to Dashboard
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-1">{test.title}</h1>
            {test.description && (
              <p className="text-muted-foreground">{test.description}</p>
            )}
          </div>
          
          <div className="flex items-center gap-6 mt-4 md:mt-0">
            <div className="flex items-center gap-2">
              <Clock size={20} className="text-primary" />
              <span className="text-lg font-semibold">{formatTime(timeLeft)}</span>
            </div>
            <Button onClick={handleFinishClick}>Finish & Submit</Button>
          </div>
        </div>
        
        {/* Debug Info (only visible in development) */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="mb-4 bg-slate-50 border-slate-200">
            <CardHeader className="py-2">
              <CardTitle className="text-sm">Debug Information</CardTitle>
            </CardHeader>
            <CardContent className="py-2 text-xs">
              <p><strong>Test ID:</strong> {testId}</p>
              <p><strong>PDF URL:</strong> {test.pdfUrl}</p>
              <p><strong>PDF Loaded:</strong> {pdfLoadingSuccess ? 'Yes' : 'No'}</p>
            </CardContent>
          </Card>
        )}
        
        {/* Test PDF Display */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Test Questions</CardTitle>
            <CardDescription>
              Read through all questions carefully before answering
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="bg-muted/20 rounded-lg p-4 md:p-6">
              <PDFViewer 
                pdfUrl={test.pdfUrl}
                onLoadSuccess={() => setPdfLoadingSuccess(true)}
                onLoadError={(error) => {
                  console.error("PDF failed to load:", error);
                  toast.error(`Failed to load test PDF: ${error.message}`);
                }}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Camera/Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>Submit Your Answers</CardTitle>
            <CardDescription>
              Upload photos of your written answers for each question
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: test.numQuestions }).map((_, index) => {
                const questionNumber = index + 1;
                const answer = answers.find(a => a.questionNumber === questionNumber);
                
                return (
                  <div 
                    key={index} 
                    className="border border-dashed border-border rounded-lg p-6 text-center"
                  >
                    {answer ? (
                      <div className="space-y-3">
                        <h3 className="font-medium mb-2">Question {questionNumber}</h3>
                        <div className="border border-border rounded-lg overflow-hidden">
                          <img 
                            src={answer.imageUrl} 
                            alt={`Answer to question ${questionNumber}`}
                            className="w-full h-auto"
                          />
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            const fileInput = document.createElement('input');
                            fileInput.type = 'file';
                            fileInput.accept = 'image/*';
                            fileInput.onchange = (e) => {
                              const target = e.target as HTMLInputElement;
                              if (target.files && target.files[0]) {
                                handleImageUpload(questionNumber, target.files[0]);
                              }
                            };
                            fileInput.click();
                          }}
                        >
                          Change Image
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Camera size={36} className="mx-auto text-muted-foreground mb-3" />
                        <h3 className="font-medium mb-2">Question {questionNumber}</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Take a photo or upload your answer
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            const fileInput = document.createElement('input');
                            fileInput.type = 'file';
                            fileInput.accept = 'image/*';
                            fileInput.onchange = (e) => {
                              const target = e.target as HTMLInputElement;
                              if (target.files && target.files[0]) {
                                handleImageUpload(questionNumber, target.files[0]);
                              }
                            };
                            fileInput.click();
                          }}
                        >
                          Upload Image
                        </Button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        
        {/* Time's Up Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center">Time's Up!</DialogTitle>
              <DialogDescription className="text-center">
                Your test time has expired. Please submit your answers now.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center">
              <Button onClick={handleSubmit}>Submit Answers</Button>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Finish Test Dialog */}
        <Dialog open={isFinishDialogOpen} onOpenChange={setIsFinishDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Finish Test?</DialogTitle>
              <DialogDescription>
                Are you sure you want to finish the test? You won't be able to make changes after submission.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsFinishDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                Submit Test
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default TakeTest;
