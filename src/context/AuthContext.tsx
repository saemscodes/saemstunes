// context/AuthContext.tsx
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";
import {
  Session,
  User,
  AuthChangeEvent,
} from "@supabase/supabase-js";
import { supabase } from '@/lib/supabase/singleton';
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
  updateUser: (data: any) => Promise<void>;
  updateUserProfile: (userData: ExtendedUser) => void;
  logout: () => Promise<void>;
  subscription: UserSubscription | null;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  signInWithOAuth: (provider: 'google' | 'facebook') => Promise<void>;
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
            expiresAt: null, // You might want to store expiration in your profile table
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
    } catch (error: any) {
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
    updateUser,
    updateUserProfile,
    logout,
    subscription,
    updateProfile,
    signInWithOAuth,
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
