import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

const AdminProtectedRoute = ({ children }: AdminProtectedRouteProps) => {
  const { user, isLoading: authLoading, isFixedAdmin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const verifyAdminAccess = async () => {
      setLoading(true);
      setError(null);

      try {
        // Check session storage first for quick access
        const adminAuth = sessionStorage.getItem('adminAuth');
        const adminUser = sessionStorage.getItem('adminUser');
        const fixedAdmin = sessionStorage.getItem('fixedAdmin');

        console.log("Session storage check:", { adminAuth, hasAdminUser: !!adminUser, fixedAdmin });

        if (adminAuth === 'true' && adminUser) {
          console.log("Found admin auth in session storage");
          setIsAdmin(true);
          setLoading(false);
          return;
        }

        // If user is loading from auth context, wait
        if (authLoading) {
          console.log("Auth still loading, waiting...");
          return;
        }

        // Check if user exists (either Supabase or fixed admin)
        if (!user && !isFixedAdmin) {
          console.log("No user and not fixed admin, redirecting to login");
          navigate('/admin/login');
          return;
        }

        // For fixed admin, we're already good
        if (isFixedAdmin) {
          console.log("Fixed admin detected, granting access");
          setIsAdmin(true);
          setLoading(false);
          return;
        }

        // For Supabase users, verify admin status via RPC
        if (user && !isFixedAdmin) {
          console.log("Supabase user detected, verifying admin status...");
          
          try {
            const { data: adminStatus, error: adminError } = await supabase
              .rpc('verify_admin_status');

            if (adminError) {
              console.error("Admin verification RPC error:", adminError);
              throw new Error(`Admin verification failed: ${adminError.message}`);
            }

            console.log("Admin status from RPC:", adminStatus);

            if (adminStatus?.has_admin_access) {
              // Store in session storage for persistence
              sessionStorage.setItem('adminAuth', 'true');
              sessionStorage.setItem('fixedAdmin', 'false');
              sessionStorage.setItem('adminUser', JSON.stringify({
                id: user.id,
                email: user.email,
                role: adminStatus.role,
                display_name: adminStatus.display_name,
                subscription_tier: adminStatus.subscription_tier
              }));
              
              setIsAdmin(true);
            } else {
              // Not an admin, redirect to admin login
              setError('You do not have admin privileges');
              sessionStorage.removeItem('adminAuth');
              sessionStorage.removeItem('adminUser');
              
              setTimeout(() => {
                navigate('/admin/login');
              }, 3000);
            }
          } catch (rpcError: any) {
            console.error("RPC call failed:", rpcError);
            // If RPC fails but we have a user, check profile directly as fallback
            if (retryCount < 2) {
              console.log(`Retrying admin check... (${retryCount + 1}/2)`);
              setRetryCount(prev => prev + 1);
              setTimeout(verifyAdminAccess, 1000);
              return;
            } else {
              // Final fallback: check profile table directly
              try {
                const { data: profile, error: profileError } = await supabase
                  .from('profiles')
                  .select('role, is_admin')
                  .eq('id', user.id)
                  .single();

                if (profileError) throw profileError;

                if (profile.role === 'admin' || profile.is_admin === true) {
                  console.log("Admin access confirmed via profile check");
                  sessionStorage.setItem('adminAuth', 'true');
                  sessionStorage.setItem('fixedAdmin', 'false');
                  sessionStorage.setItem('adminUser', JSON.stringify({
                    id: user.id,
                    email: user.email,
                    role: profile.role,
                    display_name: user.name,
                    subscription_tier: 'professional'
                  }));
                  setIsAdmin(true);
                } else {
                  setError('User profile does not have admin role');
                  setTimeout(() => {
                    navigate('/admin/login');
                  }, 3000);
                }
              } catch (profileError: any) {
                setError('Unable to verify admin status. Please try logging in again.');
                setTimeout(() => {
                  navigate('/admin/login');
                }, 3000);
              }
            }
          }
        }
      } catch (error: any) {
        console.error('Admin verification error:', error);
        setError(error.message || 'Failed to verify admin access');
        
        // Clear any invalid session data
        sessionStorage.removeItem('adminAuth');
        sessionStorage.removeItem('adminUser');
        sessionStorage.removeItem('fixedAdmin');
        
        setTimeout(() => {
          navigate('/admin/login');
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(verifyAdminAccess, 100);
    
    return () => clearTimeout(timeoutId);
  }, [user, authLoading, isFixedAdmin, navigate, retryCount]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-gold" />
            <ShieldAlert className="h-6 w-6 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gold/80" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-lg font-semibold">Verifying Admin Access</p>
            <p className="text-sm text-muted-foreground">
              {retryCount > 0 ? `Checking permissions (attempt ${retryCount + 1})...` : 'Validating your admin credentials...'}
            </p>
            <div className="h-1 w-48 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-gold animate-pulse" style={{ width: `${Math.min(90, 30 + (retryCount * 20))}%` }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="space-y-4">
            <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
              <p className="font-semibold">Access Denied</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
            <Alert>
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Admin Access Required</AlertTitle>
              <AlertDescription>
                You need proper administrator privileges to access this area.
              </AlertDescription>
            </Alert>
          </div>
          
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Redirecting to admin login...
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="flex-1"
              >
                Return Home
              </Button>
              <Button
                onClick={() => navigate('/admin/login')}
                className="flex-1 bg-gold hover:bg-gold/90"
              >
                Go to Login
              </Button>
            </div>
          </div>
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
