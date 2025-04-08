
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/layout/MainLayout';
import { BookOpen, ClipboardCheck, Layers, Trophy } from 'lucide-react';

const HomePage: React.FC = () => {
  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-edu-indigo/10 to-edu-purple/10">
        <div className="edu-container">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-6 animate-fade-in">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-edu-blue to-edu-purple bg-clip-text text-transparent">
                  Simplify
                </span>{" "}
                Your Testing Process
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl">
                EduTest makes it easy for teachers to create, distribute, and grade tests,
                while providing students with a seamless test-taking experience.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/login">
                  <Button size="lg" className="bg-gradient-to-r from-edu-blue to-edu-purple hover:opacity-90 transition">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
            <div className="flex-1 relative">
              <div className="relative bg-white rounded-xl shadow-xl p-6 z-10 animate-fade-in">
                <div className="absolute -top-4 -right-4 bg-accent text-white rounded-lg px-3 py-1 text-sm font-medium">
                  Teacher View
                </div>
                <div className="space-y-4">
                  <div className="bg-secondary rounded-lg p-4 flex items-center gap-4">
                    <div className="bg-primary/10 rounded-full p-3">
                      <ClipboardCheck size={24} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Math Midterm Exam</h3>
                      <p className="text-sm text-muted-foreground">10 questions • 60 minutes</p>
                    </div>
                  </div>
                  <div className="bg-secondary rounded-lg p-4 flex items-center gap-4">
                    <div className="bg-primary/10 rounded-full p-3">
                      <ClipboardCheck size={24} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">English Literature Quiz</h3>
                      <p className="text-sm text-muted-foreground">5 questions • 30 minutes</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 bg-gradient-to-br from-edu-blue to-edu-purple rounded-xl w-[90%] h-[90%] -z-10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="edu-container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              EduTest offers a comprehensive solution for educational testing needs.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="edu-card p-6 flex flex-col items-center text-center">
              <div className="bg-primary/10 rounded-full p-4 mb-4">
                <BookOpen size={28} className="text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Create Tests</h3>
              <p className="text-muted-foreground">
                Teachers can easily upload PDF tests and set parameters like duration and number of questions.
              </p>
            </div>
            
            <div className="edu-card p-6 flex flex-col items-center text-center">
              <div className="bg-accent/10 rounded-full p-4 mb-4">
                <Layers size={28} className="text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Take Tests</h3>
              <p className="text-muted-foreground">
                Students can view the test PDF in-browser with a live timer and submit photo responses.
              </p>
            </div>
            
            <div className="edu-card p-6 flex flex-col items-center text-center">
              <div className="bg-edu-indigo/10 rounded-full p-4 mb-4">
                <Trophy size={28} className="text-edu-indigo" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Grade & Analyze</h3>
              <p className="text-muted-foreground">
                Teachers can review submissions, provide grades and feedback for each student.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-edu-blue to-edu-purple text-white">
        <div className="edu-container text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Testing Process?</h2>
          <p className="text-white/80 max-w-2xl mx-auto mb-8">
            Join EduTest today and experience the future of educational assessment.
          </p>
          <Link to="/login">
            <Button size="lg" variant="secondary" className="font-medium">
              Get Started Now
            </Button>
          </Link>
        </div>
      </section>
    </MainLayout>
  );
};

export default HomePage;
