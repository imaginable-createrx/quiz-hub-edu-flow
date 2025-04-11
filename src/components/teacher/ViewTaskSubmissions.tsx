
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarClock, User, Image, X, ExternalLink } from 'lucide-react';

interface ViewTaskSubmissionsProps {
  taskId: string;
  isOpen: boolean;
  onClose: () => void;
}

const ViewTaskSubmissions: React.FC<ViewTaskSubmissionsProps> = ({ taskId, isOpen, onClose }) => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!taskId || !isOpen) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('task_submissions')
          .select('*')
          .eq('task_id', taskId)
          .order('submitted_at', { ascending: false });

        if (error) throw error;

        setSubmissions(data || []);

        // Fetch student names for all submissions
        if (data && data.length > 0) {
          const studentIds = data.map((sub: any) => sub.student_id);
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, name')
            .in('id', studentIds);

          if (profilesError) throw profilesError;

          const studentMap: Record<string, string> = {};
          profilesData?.forEach((profile: any) => {
            studentMap[profile.id] = profile.name;
          });

          setStudents(studentMap);
        }
      } catch (error) {
        console.error('Error fetching task submissions:', error);
        toast.error('Failed to load submissions');
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [taskId, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Task Submissions</DialogTitle>
          <DialogDescription>Review student submissions for this task</DialogDescription>
        </DialogHeader>

        <div className="mt-4 max-h-[60vh] overflow-y-auto pr-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No submissions yet for this task.
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <Card key={submission.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-muted-foreground" />
                          <span className="font-medium">
                            {students[submission.student_id] || 'Unknown Student'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CalendarClock size={16} />
                          <span>
                            Submitted: {new Date(submission.submitted_at).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <a 
                            href={submission.attachment_url} 
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1"
                          >
                            <ExternalLink size={14} />
                            <span>View Full Size</span>
                          </a>
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 border rounded-md overflow-hidden">
                      {submission.attachment_url && submission.attachment_url.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i) ? (
                        <img 
                          src={submission.attachment_url}
                          alt="Submission" 
                          className="w-full max-h-64 object-contain"
                        />
                      ) : submission.attachment_url && submission.attachment_url.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                        <video 
                          src={submission.attachment_url}
                          controls
                          className="w-full max-h-64"
                        />
                      ) : (
                        <div className="p-8 text-center bg-muted">
                          <Image size={32} className="mx-auto mb-2 text-muted-foreground" />
                          <p>Preview not available</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2 mt-4">
          <DialogClose asChild>
            <Button variant="outline">
              Close
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewTaskSubmissions;
