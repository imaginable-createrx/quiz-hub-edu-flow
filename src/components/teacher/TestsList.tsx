
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Clock, Calendar } from 'lucide-react';
import DeleteTestButton from '@/components/teacher/DeleteTestButton';
import { Test } from '@/types';

interface TestsListProps {
  tests: Test[];
}

const TestsList: React.FC<TestsListProps> = ({ tests }) => {
  const navigate = useNavigate();

  if (tests.length === 0) {
    return (
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
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {tests.map(test => (
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
      ))}
    </div>
  );
};

export default TestsList;
