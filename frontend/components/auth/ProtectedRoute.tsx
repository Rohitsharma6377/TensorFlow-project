import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { guestLoginThunk } from '@/store/slice/authSlice';
import { toast } from '@/lib/toast';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'customer' | 'seller' | 'admin' | 'superadmin';
  redirectTo?: string;
  allowGuest?: boolean;
}

export const ProtectedRoute = ({
  children,
  requiredRole,
  redirectTo = '/login',
  allowGuest = false,
}: ProtectedRouteProps) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, accessToken, status } = useAppSelector((s) => s.auth);
  const isAuthenticated = Boolean(user && accessToken);
  const isLoading = status === 'loading';

  useEffect(() => {
    // Skip if still loading
    if (isLoading) return;

    // Check if user is authenticated
    if (!isAuthenticated && !user?.isGuest) {
      // If there is a token in storage, defer redirect until auth initializes
      if (typeof window !== 'undefined') {
        const hasToken = !!localStorage.getItem('token');
        if (hasToken) return;
      }
      // Store the current route to redirect back after login
      if (typeof window !== 'undefined') {
        localStorage.setItem('redirectAfterLogin', window.location.pathname);
      }
      
      // Redirect to login if not allowing guests
      if (!allowGuest) {
        router.push(redirectTo);
        toast.info('Please log in to continue');
      } else {
        // Try to login as guest
        dispatch(guestLoginThunk())
          .unwrap()
          .catch(() => {
            router.push(redirectTo);
          });
      }
      return;
    }

    // Check if user has the required role
    if (requiredRole && user?.role !== requiredRole) {
      // If user is a guest and guests are allowed, proceed
      if (user?.isGuest && allowGuest) {
        return;
      }
      
      // Otherwise, redirect to unauthorized page or home
      toast.error('You do not have permission to access this page');
      router.push('/unauthorized');
    }
  }, [user, isAuthenticated, isLoading, requiredRole, router, redirectTo, allowGuest, dispatch]);

  // Show loading state while checking auth
  if (isLoading || (!isAuthenticated && !(user as any)?.isGuest)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check if user has the required role
  if (requiredRole && user?.role !== requiredRole && !((user as any)?.isGuest && allowGuest)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p>You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  // User is authenticated and has the required role, render children
  return <>{children}</>;
};

export default ProtectedRoute;
