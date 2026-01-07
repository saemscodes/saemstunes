import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

const AdminProtectedRoute = ({ children }: AdminProtectedRouteProps) => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyAdminAccess = async () => {
      setLoading(true);
      setError(null);

      try {
        // Check session storage first
        const adminAuth = sessionStorage.getItem('adminAuth');
        const adminUser = sessionStorage.getItem('adminUser');

        if (adminAuth === 'true' && adminUser) {
          setIsAdmin(true);
          setLoading(false);
          return;
        }

        // If no user, redirect to admin login
        if (!user && !authLoading) {
          navigate('/admin/login');
          return;
        }

        // Check if user has admin access via Supabase
        const { data: adminStatus, error: adminError } = await supabase
          .rpc('verify_admin_status');

        if (adminError) {
          throw new Error(`Admin verification failed: ${adminError.message}`);
        }

        if (adminStatus?.has_admin_access) {
          // Store in session storage
          sessionStorage.setItem('adminAuth', 'true');
          sessionStorage.setItem('adminUser', JSON.stringify({
            id: user?.id,
            email: user?.email,
            role: adminStatus.role
          }));
          setIsAdmin(true);
        } else {
          // Not an admin, redirect to admin login
          setError('You do not have admin privileges');
          setTimeout(() => {
            navigate('/admin/login');
          }, 2000);
        }
      } catch (error: any) {
        console.error('Admin verification error:', error);
        setError(error.message || 'Failed to verify admin access');
        setTimeout(() => {
          navigate('/admin/login');
        }, 2000);
      } finally {
        setLoading(false);
      }
    };

    verifyAdminAccess();
  }, [user, authLoading, navigate]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
          <p className="text-muted-foreground">Verifying admin permissions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
            <p className="font-semibold">Access Denied</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Redirecting to admin login...
          </p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;
