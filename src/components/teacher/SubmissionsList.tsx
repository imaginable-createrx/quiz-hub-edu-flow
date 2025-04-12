
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Test, Submission } from '@/types';

interface SubmissionsListProps {
  tests: Test[];
  submissions: Submission[];
}

const SubmissionsList: React.FC<SubmissionsListProps> = ({ tests, submissions }) => {
  const navigate = useNavigate();

  return (
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
                {submissionsForTest.length > 0 ? (
                  submissionsForTest.map(submission => (
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
                  ))
                ) : (
                  <li className="py-4 text-center text-muted-foreground">
                    No submissions yet
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default SubmissionsList;
