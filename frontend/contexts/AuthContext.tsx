import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/toast';
import { AuthAPI, type User as ApiUser, type RegisterPayload, type LoginResponse } from '@/lib/api';

type User = Omit<ApiUser, 'role'> & { role: ApiUser['role'] | 'guest' };

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  logout: () => void;
  loginAsGuest: () => Promise<void>;
  refreshUser: () => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check if user is authenticated
  const isAuthenticated = !!user && !user.isGuest;

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // Verify token and fetch user data
          await fetchUser();
        } else {
          // Check for guest session
          const guestToken = localStorage.getItem('guestToken');
          if (guestToken) {
            setUser({
              // minimal guest object
              _id: `guest-${Date.now()}` as unknown as string,
              username: 'guest',
              email: '',
              role: 'guest',
              isGuest: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            } as User);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Fetch current user data
  const fetchUser = async () => {
    try {
      const data = await AuthAPI.getCurrentUser();
      setUser(data.user as User);
      return data.user as User;
    } catch (error) {
      console.error('Failed to fetch user:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      setUser(null);
      throw error;
    }
  };

  // Login handler
  const login = async (usernameOrEmail: string, password: string) => {
    try {
      const res: LoginResponse = await AuthAPI.login(usernameOrEmail, password);
      localStorage.setItem('token', res.accessToken);
      localStorage.setItem('refreshToken', res.refreshToken);
      setUser(res.user as User);
      toast.success('Login successful');
      redirectAfterAuth(res.user.role);
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error?.message || 'Login failed');
      throw error;
    }
  };

  // Register handler
  const register = async (userData: RegisterPayload) => {
    try {
      const res = await AuthAPI.register(userData);
      localStorage.setItem('token', res.accessToken);
      localStorage.setItem('refreshToken', res.refreshToken);
      setUser(res.user as User);
      toast.success('Registration successful!');
      redirectAfterAuth(res.user.role);
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error?.message || 'Registration failed');
      throw error;
    }
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('guestToken');
    setUser(null);
    router.push('/login');
  };

  // Login as guest
  const loginAsGuest = async () => {
    try {
      const res = await AuthAPI.loginAsGuest();
      localStorage.setItem('token', res.accessToken);
      localStorage.setItem('refreshToken', res.refreshToken);
      setUser({ ...res.user, isGuest: true } as User);
      toast.success('Welcome, guest!');
      router.push('/');
    } catch (error) {
      console.error('Guest login error:', error);
      toast.error('Failed to login as guest');
      throw error;
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    try {
      return await fetchUser();
    } catch (error) {
      console.error('Failed to refresh user:', error);
      throw error;
    }
  };

  // Redirect after successful auth
  const redirectAfterAuth = (role: string) => {
    const redirectPath = localStorage.getItem('redirectAfterLogin') || 
      (role === 'admin' || role === 'superadmin' ? '/admin' : '/dashboard');
    
    localStorage.removeItem('redirectAfterLogin');
    router.push(redirectPath);
  };

  // Value to be provided by the context
  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    loginAsGuest,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
