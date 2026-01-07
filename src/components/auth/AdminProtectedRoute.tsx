// components/auth/AdminProtectedRoute.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ShieldAlert, Home, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

const AdminProtectedRoute = ({ children }: AdminProtectedRouteProps) => {
  const { user, isLoading: authLoading, isFixedAdmin, verifyAdminAccess, clearAdminSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminData, setAdminData] = useState<any>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const verifyAccess = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log("🛡️ AdminProtectedRoute - Starting verification...");
        console.log("Current location:", location.pathname);
        console.log("Auth loading:", authLoading);
        console.log("User exists:", !!user);
        console.log("Is fixed admin:", isFixedAdmin);

        // Check session storage first for quick access
        const adminAuth = sessionStorage.getItem('adminAuth');
        const adminUserStr = sessionStorage.getItem('adminUser');
        const fixedAdmin = sessionStorage.getItem('fixedAdmin');

        console.log("Session storage:", { 
          adminAuth, 
          hasAdminUser: !!adminUserStr, 
          fixedAdmin 
        });

        // If we're already on admin login page, don't redirect
        if (location.pathname === '/admin/login') {
          console.log("On admin login page, skipping verification");
          setLoading(false);
          return;
        }

        // If we have valid admin session in storage, grant access immediately
        if (adminAuth === 'true' && adminUserStr) {
          try {
            const userData = JSON.parse(adminUserStr);
            console.log("✅ Found valid admin session:", userData);
            setAdminData(userData);
            setIsAdmin(true);
            setLoading(false);
            return;
          } catch (e) {
            console.error("Error parsing admin user data:", e);
            sessionStorage.removeItem('adminAuth');
            sessionStorage.removeItem('adminUser');
            sessionStorage.removeItem('fixedAdmin');
          }
        }

        // Wait for auth to finish loading
        if (authLoading) {
          console.log("Auth still loading, waiting...");
          return;
        }

        // No session found, check current auth state
        if (!user && !isFixedAdmin) {
          console.log("❌ No user and not fixed admin, redirecting to login");
          setError("Please log in to access the admin panel");
          setTimeout(() => {
            navigate('/admin/login', { state: { from: location } });
          }, 1500);
          return;
        }

        // For fixed admin, grant access immediately
        if (isFixedAdmin) {
          console.log("✅ Fixed admin detected, granting access");
          setIsAdmin(true);
          setLoading(false);
          return;
        }

        // For Supabase users, verify admin status
        if (user && !isFixedAdmin) {
          console.log("🔄 Verifying Supabase admin status for user:", user.email);
          
          try {
            const adminStatus = await verifyAdminAccess();
            console.log("Admin status result:", adminStatus);
            
            if (adminStatus.has_admin_access) {
              console.log("✅ Supabase admin access verified");
              
              const userData = {
                id: user.id,
                email: user.email,
                role: adminStatus.role,
                display_name: adminStatus.display_name,
                subscription_tier: adminStatus.subscription_tier,
                is_admin: true
              };
              
              // Store in session storage for persistence
              sessionStorage.setItem('adminAuth', 'true');
              sessionStorage.setItem('fixedAdmin', 'false');
              sessionStorage.setItem('adminUser', JSON.stringify(userData));
              
              setAdminData(userData);
              setIsAdmin(true);
            } else {
              console.log("❌ User does not have admin privileges");
              setError("You do not have administrator privileges");
              
              // Clear any invalid session
              clearAdminSession();
              sessionStorage.removeItem('adminAuth');
              sessionStorage.removeItem('adminUser');
              
              setTimeout(() => {
                navigate('/admin/login', { state: { error: "You do not have admin privileges" } });
              }, 3000);
            }
          } catch (rpcError: any) {
            console.error("RPC verification failed:", rpcError);
            
            // Fallback: Check profile directly
            if (retryCount < 2) {
              console.log(`🔄 Retrying admin check... (${retryCount + 1}/2)`);
              setRetryCount(prev => prev + 1);
              setTimeout(verifyAccess, 1000);
              return;
            } else {
              console.log("🔄 Final fallback: Checking profile table...");
              
              try {
                const { data: profile, error: profileError } = await supabase
                  .from('profiles')
                  .select('role, is_admin, display_name, subscription_tier')
                  .eq('id', user.id)
                  .single();

                if (profileError) {
                  console.error("Profile check error:", profileError);
                  throw profileError;
                }

                console.log("Profile data:", profile);
                
                if (profile.role === 'admin' || profile.is_admin === true) {
                  console.log("✅ Admin access confirmed via profile");
                  
                  const userData = {
                    id: user.id,
                    email: user.email,
                    role: profile.role,
                    display_name: profile.display_name,
                    subscription_tier: profile.subscription_tier,
                    is_admin: true
                  };
                  
                  sessionStorage.setItem('adminAuth', 'true');
                  sessionStorage.setItem('fixedAdmin', 'false');
                  sessionStorage.setItem('adminUser', JSON.stringify(userData));
                  
                  setAdminData(userData);
                  setIsAdmin(true);
                } else {
                  setError("Your account does not have administrator role");
                  clearAdminSession();
                  
                  setTimeout(() => {
                    navigate('/admin/login', { state: { error: "Not an administrator" } });
                  }, 3000);
                }
              } catch (profileError: any) {
                console.error("Final verification error:", profileError);
                setError("Unable to verify admin status. Please contact support.");
                
                setTimeout(() => {
                  navigate('/admin/login', { state: { error: "Verification failed" } });
                }, 3000);
              }
            }
          }
        }
      } catch (error: any) {
        console.error('❌ Admin verification error:', error);
        setError(error.message || 'Failed to verify admin access');
        
        // Clear any invalid session data
        clearAdminSession();
        sessionStorage.removeItem('adminAuth');
        sessionStorage.removeItem('adminUser');
        sessionStorage.removeItem('fixedAdmin');
        
        setTimeout(() => {
          navigate('/admin/login', { state: { error: error.message } });
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(verifyAccess, 100);
    
    return () => clearTimeout(timeoutId);
  }, [user, authLoading, isFixedAdmin, location, navigate, retryCount, verifyAdminAccess, clearAdminSession]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
        <div className="flex flex-col items-center space-y-6 max-w-md w-full">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gold/20 blur-xl rounded-full"></div>
              <Loader2 className="h-16 w-16 animate-spin text-gold relative z-10" />
              <ShieldAlert className="h-8 w-8 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gold/90 z-20" />
            </div>
            <div className="text-center space-y-3">
              <h1 className="text-2xl font-bold font-serif">Securing Admin Access</h1>
              <p className="text-muted-foreground">
                {retryCount > 0 
                  ? `Verifying permissions (attempt ${retryCount + 1})...` 
                  : 'Validating administrator credentials...'}
              </p>
              <div className="h-2 w-64 bg-muted rounded-full overflow-hidden mx-auto">
                <div 
                  className="h-full bg-gradient-to-r from-gold to-amber-500 transition-all duration-300"
                  style={{ width: `${Math.min(90, 30 + (retryCount * 20))}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          <Card className="w-full bg-background/50 backdrop-blur-sm border-gold/20">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <p className="text-sm">Checking session storage</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <p className="text-sm">Verifying user permissions</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  <p className="text-sm">Loading admin dashboard</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error && !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
        <Card className="w-full max-w-md border-2 border-destructive/30">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="bg-destructive/20 p-4 rounded-full">
                <ShieldAlert className="h-12 w-12 text-destructive" />
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Access Restricted</CardTitle>
              <CardDescription className="pt-2">
                Administrator privileges required
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Verification Failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            
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
                  <Home className="h-4 w-4 mr-2" />
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
          </CardContent>
          
          <CardFooter className="border-t pt-4 flex flex-col items-center text-xs text-muted-foreground">
            <p>Saem's Tunes Admin System • Enhanced Security</p>
            <p className="mt-1">All access attempts are logged for security</p>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;
