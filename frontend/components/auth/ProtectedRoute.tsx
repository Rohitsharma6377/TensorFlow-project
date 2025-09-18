import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { guestLoginThunk } from '@/store/slice/authSlice';
import { toast } from '@/lib/toast';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'customer' | 'seller' | 'admin' | 'superadmin';
  allowedRoles?: Array<'customer' | 'seller' | 'admin' | 'superadmin'>;
  redirectTo?: string;
  allowGuest?: boolean;
}

export const ProtectedRoute = ({
  children,
  requiredRole,
  allowedRoles,
  redirectTo = '/login',
  allowGuest = false,
}: ProtectedRouteProps) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, accessToken, status } = useAppSelector((s) => s.auth);
  // Consider user authenticated if we have a user object (supports cookie-based sessions)
  const isAuthenticated = Boolean(user);
  const isLoading = status === 'loading';

  useEffect(() => {
    console.log('[ProtectedRoute] useEffect - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated, 'user:', user)
    
    // Skip if still loading
    if (isLoading) {
      console.log('[ProtectedRoute] Still loading, skipping checks')
      return;
    }

    // Check if user is authenticated
    if (!isAuthenticated && !user?.isGuest) {
      console.log('[ProtectedRoute] User not authenticated')
      
      // If there is a token in storage, defer redirect until auth initializes
      if (typeof window !== 'undefined') {
        const hasToken = !!localStorage.getItem('token');
        console.log('[ProtectedRoute] Token in localStorage:', hasToken)
        if (hasToken) {
          console.log('[ProtectedRoute] Has token, deferring redirect')
          return;
        }
      }
      
      // Store the current route to redirect back after login
      if (typeof window !== 'undefined') {
        localStorage.setItem('redirectAfterLogin', window.location.pathname);
      }
      
      // Redirect to login if not allowing guests
      if (!allowGuest) {
        console.log('[ProtectedRoute] Redirecting to login')
        router.push(redirectTo);
        toast.info('Please log in to continue');
      } else {
        // Try to login as guest
        console.log('[ProtectedRoute] Trying guest login')
        dispatch(guestLoginThunk())
          .unwrap()
          .catch(() => {
            router.push(redirectTo);
          });
      }
      return;
    }

    // Check if user has the required/allowed role
    const role = user?.role as 'customer' | 'seller' | 'admin' | 'superadmin' | undefined;
    const hasRequired = requiredRole ? role === requiredRole : true;
    const isAllowed = allowedRoles && allowedRoles.length > 0 ? allowedRoles.includes(role as any) : true;
    if (!hasRequired || !isAllowed) {
      // If user is a guest and guests are allowed, proceed
      if (user?.isGuest && allowGuest) {
        return;
      }
      
      // Otherwise, redirect to unauthorized page or home
      toast.error('You do not have permission to access this page');
      router.push('/unauthorized');
    }
  }, [user, isAuthenticated, isLoading, requiredRole, allowedRoles, router, redirectTo, allowGuest, dispatch]);

  // Show loading state while checking auth
  if (isLoading || (!isAuthenticated && !(user as any)?.isGuest)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check if user has the required role
  const role = user?.role as 'customer' | 'seller' | 'admin' | 'superadmin' | undefined;
  const hasRequired = requiredRole ? role === requiredRole : true;
  const isAllowed = allowedRoles && allowedRoles.length > 0 ? allowedRoles.includes(role as any) : true;
  if ((!hasRequired || !isAllowed) && !((user as any)?.isGuest && allowGuest)) {
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
