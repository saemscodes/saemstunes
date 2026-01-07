import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface AdminUser {
  id: string;
  email: string;
  role: string;
  display_name?: string;
  subscription_tier?: string;
}

interface AdminContextType {
  adminUser: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, adminCode: string, captchaToken?: string | null) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  checkAdminStatus: () => Promise<boolean>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

const FIXED_ADMIN_CREDENTIALS = {
  username: 'saemstunes',
  password: 'ilovetosing123'
};

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Load admin user from session storage on mount
  useEffect(() => {
    const loadAdminFromSession = () => {
      try {
        const adminAuth = sessionStorage.getItem('adminAuth');
        const adminUserStr = sessionStorage.getItem('adminUser');
        
        if (adminAuth === 'true' && adminUserStr) {
          const user = JSON.parse(adminUserStr);
          setAdminUser(user);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Error loading admin from session:", error);
        sessionStorage.removeItem('adminAuth');
        sessionStorage.removeItem('adminUser');
      } finally {
        setIsLoading(false);
      }
    };

    loadAdminFromSession();
  }, []);

  const checkAdminStatus = async (): Promise<boolean> => {
    try {
      // Check session storage first
      const adminAuth = sessionStorage.getItem('adminAuth');
      const adminUserStr = sessionStorage.getItem('adminUser');
      
      if (adminAuth === 'true' && adminUserStr) {
        const user = JSON.parse(adminUserStr);
        setAdminUser(user);
        setIsAuthenticated(true);
        return true;
      }

      // Check with Supabase RPC
      const { data: status, error } = await supabase
        .rpc('verify_admin_status');
      
      if (error) {
        console.error("Admin status check error:", error);
        return false;
      }
      
      if (status.has_admin_access) {
        const user = {
          id: status.user_id,
          email: status.email,
          role: status.role,
          display_name: status.display_name,
          subscription_tier: status.subscription_tier
        };
        
        setAdminUser(user);
        setIsAuthenticated(true);
        sessionStorage.setItem('adminAuth', 'true');
        sessionStorage.setItem('adminUser', JSON.stringify(user));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
  };

  const login = async (email: string, password: string, adminCode: string, captchaToken?: string | null): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true);
    
    try {
      // Verify admin code first
      if (adminCode !== "ST-ADMIN-2024") {
        return { success: false, message: "Invalid admin verification code" };
      }

      // Check for fixed admin credentials
      if (email === FIXED_ADMIN_CREDENTIALS.username && password === FIXED_ADMIN_CREDENTIALS.password) {
        const fixedAdminUser = {
          id: 'fixed-admin-id',
          email: 'admin@saemstunes.com',
          role: 'admin',
          display_name: 'Fixed Administrator',
          subscription_tier: 'professional'
        };
        
        setAdminUser(fixedAdminUser);
        setIsAuthenticated(true);
        sessionStorage.setItem('adminAuth', 'true');
        sessionStorage.setItem('adminUser', JSON.stringify(fixedAdminUser));
        
        toast({
          title: "✅ Admin Login Successful",
          description: "Fixed admin credentials authenticated",
        });
        
        return { success: true, message: "Fixed admin login successful" };
      }

      // Regular admin login via Supabase
      const { error: loginError, data } = await supabase.auth.signInWithPassword({ 
        email, 
        password,
        options: captchaToken ? { captchaToken } : undefined
      });
      
      if (loginError) {
        if (loginError.message.includes('captcha')) {
          return { success: false, message: "CAPTCHA verification failed" };
        }
        return { success: false, message: "Invalid email or password" };
      }

      // Verify admin status with Supabase
      const { data: adminStatus, error: statusError } = await supabase
        .rpc('verify_admin_status');
      
      if (statusError || !adminStatus?.has_admin_access) {
        // Sign out if not an admin
        await supabase.auth.signOut();
        return { success: false, message: "User does not have admin privileges" };
      }

      const user = {
        id: data.user?.id || '',
        email: data.user?.email || email,
        role: adminStatus.role || 'admin',
        display_name: adminStatus.display_name,
        subscription_tier: adminStatus.subscription_tier
      };
      
      setAdminUser(user);
      setIsAuthenticated(true);
      sessionStorage.setItem('adminAuth', 'true');
      sessionStorage.setItem('adminUser', JSON.stringify(user));
      
      toast({
        title: "✅ Admin Login Successful",
        description: `Welcome ${user.display_name || user.email}`,
      });
      
      return { success: true, message: "Admin login successful" };
      
    } catch (error: any) {
      console.error("Admin login error:", error);
      return { success: false, message: error.message || "Login failed" };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Clear admin session
      setAdminUser(null);
      setIsAuthenticated(false);
      sessionStorage.removeItem('adminAuth');
      sessionStorage.removeItem('adminUser');
      sessionStorage.removeItem('adminLoginAttempts');
      
      // Sign out from Supabase if logged in
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.auth.signOut();
      }
      
      toast({
        title: "Logged out",
        description: "You have been logged out from the admin panel.",
      });
      
      navigate('/admin/login');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <AdminContext.Provider value={{
      adminUser,
      isLoading,
      isAuthenticated,
      login,
      logout,
      checkAdminStatus
    }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
};
