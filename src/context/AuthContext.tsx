
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '@/types';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hardcoded users for now
const USERS: User[] = [
  {
    id: 't1',
    email: 'teacher@example.com',
    name: 'Demo Teacher',
    role: 'teacher'
  },
  {
    id: 's1',
    email: 'student@example.com',
    name: 'Demo Student',
    role: 'student'
  }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for saved user in local storage
    const savedUser = localStorage.getItem('edutest-user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // Here we're using hardcoded users, but this will be replaced by Supabase auth
      const foundUser = USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (!foundUser) {
        throw new Error('Invalid email or password');
      }
      
      // In a real app, we would verify the password here
      
      setUser(foundUser);
      localStorage.setItem('edutest-user', JSON.stringify(foundUser));
      
      // Redirect to appropriate dashboard based on role
      if (foundUser.role === 'teacher') {
        navigate('/teacher-dashboard');
      } else {
        navigate('/student-dashboard');
      }
      
      toast.success(`Welcome back, ${foundUser.name}!`);
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('edutest-user');
    navigate('/');
    toast.success('Logged out successfully!');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
