// context/AuthContext.tsx
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
  useCallback,
} from "react";
import {
  Session,
  User,
  AuthChangeEvent,
} from "@supabase/supabase-js";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { UserProfile, UserRole } from "@/types/user";

export type { UserRole } from "@/types/user";

interface ExtendedUser extends User {
  role: UserRole;
  subscribed?: boolean;
  subscriptionTier?: SubscriptionTier;
  name: string;
  avatar?: string;
  accessLevel?: string;
}

interface AuthContextProps {
  session: Session | null;
  user: ExtendedUser | null;
  profile: UserProfile | null;
  isLoading: boolean;
  signIn: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password?: string) => Promise<void>;
  login: (email: string, password: string, captchaToken?: string | null) => Promise<void>;
  adminLogin: (email: string, password: string, adminCode: string, captchaToken?: string | null) => Promise<{ isAdmin: boolean; requiresAdminCode: boolean }>;
  updateUser: (data: any) => Promise<void>;
  updateUserProfile: (userData: ExtendedUser) => void;
  logout: () => Promise<void>;
  subscription: UserSubscription | null;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  signInWithOAuth: (provider: 'google' | 'facebook') => Promise<void>;
  verifyAdminWithSupabase: () => Promise<{ has_admin_access: boolean; role?: string; email?: string }>;
}

interface AuthProviderProps {
  children: ReactNode;
}

interface UserSubscription {
  tier: SubscriptionTier;
  isActive: boolean;
  expiresAt: Date | null;
}

export type SubscriptionTier = 'free' | 'basic' | 'premium' | 'professional';

const FIXED_ADMIN_CREDENTIALS = {
  username: 'saemstunes',
  password: 'ilovetosing123'
};

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const { toast } = useToast();

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      
      setProfile(data as UserProfile);
      return data;
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      return null;
    }
  };

  const verifyAdminWithSupabase = useCallback(async () => {
    try {
      const { data: status, error } = await supabase
        .rpc('verify_admin_status');
      
      if (error) {
        console.error("Admin status check error:", error);
        return { has_admin_access: false, error: error.message };
      }
      
      return {
        has_admin_access: status.has_admin_access || false,
        role: status.role,
        email: status.email
      };
    } catch (error: any) {
      console.error("Error checking admin status:", error);
      return { has_admin_access: false, error: error.message };
    }
  }, []);

  useEffect(() => {
    const loadSession = async () => {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      setSession(session);
      if (session?.user) {
        // Fetch the user's profile
        const userProfile = await fetchProfile(session.user.id);
        
        // Create extended user with values from profile
        const extendedUser: ExtendedUser = {
          ...session.user,
          role: (userProfile?.role as UserRole) || 'user',
          name: userProfile?.display_name || session.user.user_metadata?.full_name || session.user.email || 'User',
          avatar: userProfile?.avatar_url || session.user.user_metadata?.avatar_url,
          subscribed: userProfile?.subscription_tier !== 'free',
          subscriptionTier: (userProfile?.subscription_tier as SubscriptionTier) || 'free'
        };
        setUser(extendedUser);
      } else {
        setUser(null);
        setProfile(null);
      }
      setIsLoading(false);
    };

    loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        setSession(session);
        if (session?.user) {
          // Fetch the user's profile
          const userProfile = await fetchProfile(session.user.id);
          
          const extendedUser: ExtendedUser = {
            ...session.user,
            role: (userProfile?.role as UserRole) || 'user',
            name: userProfile?.display_name || session.user.user_metadata?.full_name || session.user.email || 'User',
            avatar: userProfile?.avatar_url || session.user.user_metadata?.avatar_url,
            subscribed: userProfile?.subscription_tier !== 'free',
            subscriptionTier: (userProfile?.subscription_tier as SubscriptionTier) || 'free'
          };
          setUser(extendedUser);
        } else {
          setUser(null);
          setProfile(null);
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const getSubscription = async () => {
      if (user) {
        // Get subscription from profile
        if (profile) {
          const userSubscription: UserSubscription = {
            tier: profile.subscription_tier,
            isActive: profile.subscription_tier !== 'free',
            expiresAt: null,
          };
          setSubscription(userSubscription);
        }
      } else {
        setSubscription(null);
      }
    };

    getSubscription();
  }, [user, profile]);

  const signIn = async (email: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      toast({
        title: "Check your email",
        description: "We've sent a magic link to your email address.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.error_description || error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string, captchaToken?: string | null) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ 
        email, 
        password,
        options: captchaToken ? { captchaToken } : undefined
      });
      if (error) throw error;
      
      // After successful login, fetch user profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await fetchProfile(user.id);
      }
    } catch (error: any) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const adminLogin = async (email: string, password: string, adminCode: string, captchaToken?: string | null) => {
    try {
      setIsLoading(true);
      
      // Step 1: Verify admin code
      if (adminCode !== "ST-ADMIN-2024") {
        throw new Error("Invalid admin code");
      }

      // Step 2: Check for fixed admin credentials
      if (email === FIXED_ADMIN_CREDENTIALS.username && password === FIXED_ADMIN_CREDENTIALS.password) {
        // Fixed admin login - bypass Supabase auth
        const fixedAdminSession = {
          user: {
            id: 'fixed-admin-id',
            email: 'admin@saemstunes.com',
            user_metadata: { role: 'admin' }
          }
        };
        setSession(fixedAdminSession as any);
        
        const extendedUser: ExtendedUser = {
          ...fixedAdminSession.user,
          role: 'admin',
          name: 'Fixed Admin',
          avatar: undefined,
          subscribed: true,
          subscriptionTier: 'professional'
        };
        setUser(extendedUser);
        
        // Store in session storage
        sessionStorage.setItem('adminAuth', 'true');
        sessionStorage.setItem('adminUser', JSON.stringify({
          id: 'fixed-admin-id',
          email: 'admin@saemstunes.com',
          role: 'admin'
        }));
        
        return { isAdmin: true, requiresAdminCode: false };
      }

      // Step 3: Regular admin login via Supabase with CAPTCHA
      const { error, data } = await supabase.auth.signInWithPassword({ 
        email, 
        password,
        options: captchaToken ? { captchaToken } : undefined
      });
      
      if (error) {
        // Check if it's a CAPTCHA error
        if (error.message.includes('captcha')) {
          throw new Error("CAPTCHA verification failed. Please complete the CAPTCHA challenge.");
        }
        throw error;
      }

      // Step 4: Verify admin status with Supabase RPC
      const adminStatus = await verifyAdminWithSupabase();
      
      if (!adminStatus.has_admin_access) {
        // User is authenticated but not an admin
        await supabase.auth.signOut();
        throw new Error("User does not have admin privileges");
      }

      // Step 5: Fetch profile and set session
      if (data.user) {
        await fetchProfile(data.user.id);
      }
      
      // Store in session storage
      sessionStorage.setItem('adminAuth', 'true');
      sessionStorage.setItem('adminUser', JSON.stringify({
        id: data.user?.id,
        email: data.user?.email,
        role: adminStatus.role
      }));
      
      return { isAdmin: true, requiresAdminCode: true };
      
    } catch (error: any) {
      console.error("Admin login failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithOAuth = async (provider: 'google' | 'facebook') => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      // Clear session storage
      sessionStorage.removeItem('adminAuth');
      sessionStorage.removeItem('adminUser');
      sessionStorage.removeItem('loginAttempts');
      await supabase.auth.signOut();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.error_description || error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await signOut();
  };

  const signUp = async (email: string, password?: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            role: 'student',
          },
        }
      });
      if (error) throw error;
      toast({
        title: "Check your email",
        description: "We've sent a verification link to your email address.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.error_description || error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (data: any) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.updateUser(data);
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.error_description || error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error('No user logged in');
    
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;
      
      // Refresh the profile
      await fetchProfile(user.id);
      
      toast({
        title: "Success",
        description: "Your profile has been updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserProfile = (userData: ExtendedUser) => {
    setUser(userData);
  };

  const value = {
    session,
    user,
    profile,
    isLoading,
    signIn,
    signOut,
    signUp,
    login,
    adminLogin,
    updateUser,
    updateUserProfile,
    logout,
    subscription,
    updateProfile,
    signInWithOAuth,
    verifyAdminWithSupabase,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
