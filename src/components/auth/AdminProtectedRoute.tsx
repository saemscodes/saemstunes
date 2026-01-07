import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/context/AdminContext';
import { Loader2 } from 'lucide-react';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

const AdminProtectedRoute = ({ children }: AdminProtectedRouteProps) => {
  const { isAuthenticated, isLoading, checkAdminStatus } = useAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyAccess = async () => {
      if (!isLoading && !isAuthenticated) {
        // Try to check admin status one more time
        const hasAccess = await checkAdminStatus();
        if (!hasAccess) {
          navigate('/admin/login');
        }
      }
    };

    verifyAccess();
  }, [isAuthenticated, isLoading, navigate, checkAdminStatus]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
          <p className="text-muted-foreground">Verifying admin permissions...</p>
          <p className="text-xs text-muted-foreground">Please wait while we check your access</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;
