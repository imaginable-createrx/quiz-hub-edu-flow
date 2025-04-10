
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import NotFound from '@/pages/NotFound';
import StudentDashboard from '@/pages/student/StudentDashboard';
import TeacherDashboard from '@/pages/teacher/TeacherDashboard';
import TakeTest from '@/pages/student/TakeTest';
import TestResult from '@/pages/student/TestResult';
import UploadTest from '@/pages/teacher/UploadTest';
import GradeSubmission from '@/pages/teacher/GradeSubmission';
import CreateTask from '@/pages/teacher/CreateTask';
import TaskSubmission from '@/pages/student/TaskSubmission';
import { AuthProvider } from '@/context/AuthContext';
import { TestDataProvider } from '@/context/TestDataContext';

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <TestDataProvider>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              
              {/* Student routes */}
              <Route path="/student-dashboard" element={<StudentDashboard />} />
              <Route path="/student-dashboard/take-test/:testId" element={<TakeTest />} />
              <Route path="/student-dashboard/result/:submissionId" element={<TestResult />} />
              <Route path="/task-submission/:taskId" element={<TaskSubmission />} />
              
              {/* Teacher routes */}
              <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
              <Route path="/teacher-dashboard/upload-test" element={<UploadTest />} />
              <Route path="/teacher-dashboard/grade-submission/:submissionId" element={<GradeSubmission />} />
              <Route path="/teacher-dashboard/create-task" element={<CreateTask />} />
              
              {/* Catch all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </TestDataProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
