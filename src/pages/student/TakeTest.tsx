
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import { useTestData } from '@/context/TestDataContext';
import { toast } from '@/components/ui/sonner';
import { Clock, AlertTriangle, Camera } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ScrollArea } from '@/components/ui/scroll-area';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set the worker source for PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

const TakeTest: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFinishDialogOpen, setIsFinishDialogOpen] = useState(false);
  const [answers, setAnswers] = useState<{ questionNumber: number; imageUrl: string }[]>([]);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [pdfError, setPdfError] = useState<Error | null>(null);
  
  const { user } = useAuth();
  const { getTestById, addSubmission } = useTestData();
  const navigate = useNavigate();
  
  const test = testId ? getTestById(testId) : undefined;
  
  // Initialize timer
  useEffect(() => {
    if (test) {
      setTimeLeft(test.durationMinutes * 60);
    }
  }, [test]);
  
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
  }, [timeLeft, navigate, testId]);
  
  // Format time display
  const formatTime = useCallback((seconds: number | null) => {
    if (seconds === null) return '00:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);
  
  // Handle test submission
  const handleSubmit = () => {
    if (!user || !testId) return;
    
    try {
      // In a real app, we would process the submitted answers here
      // For now, we'll simulate a submission with mock answer images
      const mockAnswers = Array.from({ length: test?.numQuestions || 0 }, (_, i) => ({
        questionNumber: i + 1,
        imageUrl: `/sample-answer-${i + 1}.jpg`
      }));
      
      addSubmission({
        testId,
        studentId: user.id,
        answers: mockAnswers
      });
      
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

  // Handle PDF document loading
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPdfError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF:', error);
    setPdfError(error);
    toast.error('Failed to load test PDF. Please try refreshing the page.');
  };

  // PDF navigation
  const goToPrevPage = () => setPageNumber(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setPageNumber(prev => Math.min(prev + 1, numPages || 1));
  
  if (!test) {
    return (
      <div className="edu-container py-8 text-center">
        <AlertTriangle size={48} className="mx-auto text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Test Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The test you're looking for doesn't exist or has been removed.
        </p>
        <Button onClick={() => navigate('/student-dashboard')}>
          Return to Dashboard
        </Button>
      </div>
    );
  }
  
  return (
    <div className="edu-container py-8">
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
      
      {/* Test PDF Display */}
      <Card className="mb-8">
        <CardContent className="p-4 md:p-6">
          <div className="bg-muted/20 rounded-lg p-4 md:p-6">
            {pdfError ? (
              <div className="text-center py-8">
                <AlertTriangle size={32} className="mx-auto text-destructive mb-4" />
                <p className="text-lg font-medium mb-2">Failed to load PDF</p>
                <p className="text-sm text-muted-foreground mb-4">
                  {pdfError.message || 'There was an error loading the test PDF.'}
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()}
                >
                  Reload Page
                </Button>
              </div>
            ) : (
              <>
                <ScrollArea className="h-[600px] w-full rounded-md border">
                  <div className="flex justify-center py-4">
                    <Document
                      file={test.pdfUrl || '/placeholder.svg'}
                      onLoadSuccess={onDocumentLoadSuccess}
                      onLoadError={onDocumentLoadError}
                      loading={
                        <div className="text-center py-12">
                          <p className="text-muted-foreground">Loading test PDF...</p>
                        </div>
                      }
                      className="mx-auto"
                    >
                      <Page 
                        pageNumber={pageNumber} 
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                        scale={1.2}
                        className="mx-auto shadow-md"
                      />
                    </Document>
                  </div>
                </ScrollArea>
                
                {numPages && (
                  <div className="flex justify-between items-center mt-4">
                    <Button 
                      variant="outline" 
                      onClick={goToPrevPage} 
                      disabled={pageNumber <= 1}
                    >
                      Previous Page
                    </Button>
                    <p className="text-sm">
                      Page {pageNumber} of {numPages}
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={goToNextPage} 
                      disabled={pageNumber >= (numPages || 1)}
                    >
                      Next Page
                    </Button>
                  </div>
                )}
              </>
            )}
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
            {Array.from({ length: test.numQuestions }).map((_, index) => (
              <div 
                key={index} 
                className="border border-dashed border-border rounded-lg p-6 text-center"
              >
                <Camera size={36} className="mx-auto text-muted-foreground mb-3" />
                <h3 className="font-medium mb-2">Question {index + 1}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Take a photo or upload your answer
                </p>
                <Button variant="outline" size="sm">
                  Upload Image
                </Button>
              </div>
            ))}
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
  );
};

export default TakeTest;
