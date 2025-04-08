
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import { toast } from '@/components/ui/sonner';
import { Lock, Mail, User } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await login(email, password);
      // Navigation is handled in the login function
    } catch (error) {
      console.error('Login error:', error);
      // Toast is shown in the login function
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsTeacher = async () => {
    setEmail('teacher@example.com');
    setPassword('password');
    
    setIsLoading(true);
    try {
      await login('teacher@example.com', 'password');
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsStudent = async () => {
    setEmail('student@example.com');
    setPassword('password');
    
    setIsLoading(true);
    try {
      await login('student@example.com', 'password');
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!registerEmail || !registerPassword || !registerName) {
      toast.error('Please fill all registration fields');
      return;
    }
    
    setRegisterLoading(true);
    
    try {
      // This is a mock registration since we're using fake hardcoded users
      // In a real app with Supabase, this would call supabase.auth.signUp
      toast.success('Registration successful! Please use the demo accounts to login.');
      setIsRegisterOpen(false);
      
      // Reset form
      setRegisterEmail('');
      setRegisterPassword('');
      setRegisterName('');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Registration failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] py-12 bg-secondary/30">
        <div className="w-full max-w-md px-4">
          <Card className="w-full shadow-lg animate-fade-in">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">Login to EduTest</CardTitle>
              <CardDescription className="text-center">
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Logging in...' : 'Login'}
                </Button>
                
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      Demo Accounts
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={loginAsTeacher}
                    disabled={isLoading}
                  >
                    Teacher Demo
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={loginAsStudent}
                    disabled={isLoading}
                  >
                    Student Demo
                  </Button>
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex justify-center border-t p-4">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setIsRegisterOpen(true)}
                  disabled={isLoading}
                >
                  Register
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Registration Dialog */}
      <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create a new account</DialogTitle>
            <DialogDescription>
              Enter your details below to create an account
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRegister} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="register-name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="register-name"
                  type="text"
                  placeholder="John Doe"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  className="pl-10"
                  disabled={registerLoading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="register-email"
                  type="email"
                  placeholder="m@example.com"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  className="pl-10"
                  disabled={registerLoading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="register-password"
                  type="password"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  className="pl-10"
                  disabled={registerLoading}
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsRegisterOpen(false)}
                disabled={registerLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={registerLoading}>
                {registerLoading ? 'Registering...' : 'Register'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default LoginPage;
