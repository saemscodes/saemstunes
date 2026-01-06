import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Music, 
  ArrowRight, 
  Loader2, 
  AlertCircle,
  Shield 
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { motion } from "framer-motion";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import ForgotPasswordForm from "./ForgotPasswordForm";
import SocialLoginOptions from "./SocialLoginOptions";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof formSchema>;

interface LoginFormProps {
  onAdminTap?: () => void;
}

const LoginForm = ({ onAdminTap }: LoginFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<HCaptcha>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [adminTapCount, setAdminTapCount] = useState(0);
  
  // Get redirect path from location state or default to "/"
  const from = location.state?.from?.pathname || "/";
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Check if we should show captcha based on failed attempts or specific conditions
  useEffect(() => {
    // Show captcha after 2 failed login attempts or if coming from verification
    const shouldShowCaptcha = loginAttempts >= 2 || 
      location.pathname === '/auth' || 
      location.state?.requireCaptcha;
    
    setShowCaptcha(shouldShowCaptcha);
  }, [loginAttempts, location]);

  // Load login attempts from sessionStorage on component mount
  useEffect(() => {
    const storedAttempts = sessionStorage.getItem('loginAttempts');
    if (storedAttempts) {
      const attempts = parseInt(storedAttempts, 10);
      setLoginAttempts(attempts);
    }
  }, []);

  const handleLogin = async (data: FormData) => {
    setIsSubmitting(true);

    // Only require captcha if it's being shown
    if (showCaptcha && !captchaToken) {
      toast({
        title: "Verification required",
        description: "Please complete the captcha verification.",
        variant: "destructive",
      });
      form.setError("root", { message: "Please complete the CAPTCHA challenge." });
      setIsSubmitting(false);
      return;
    }

    try {
      // Pass captchaToken to login function (null if captcha not required)
      await login(data.email, data.password, captchaToken);
      
      // Reset login attempts on successful login
      setLoginAttempts(0);
      sessionStorage.removeItem('loginAttempts');
      
      // Show success message
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
      
      navigate(from);
    } catch (error: any) {
      console.error("Login failed:", error);
      
      // Increment login attempts and store in sessionStorage
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      sessionStorage.setItem('loginAttempts', newAttempts.toString());
      
      // Show error message
      let errorMessage = "Invalid email or password. Please try again.";
      
      if (error.message.includes('captcha')) {
        errorMessage = "CAPTCHA verification failed. Please try again.";
      } else if (error.message.includes('rate limit')) {
        errorMessage = "Too many attempts. Please wait before trying again.";
      }
      
      form.setError("root", { 
        message: errorMessage 
      });
      
      // Reset captcha on error if it was shown
      if (showCaptcha) {
        captchaRef.current?.resetCaptcha();
        setCaptchaToken(null);
      }
      
      // Show captcha after failed attempts
      if (newAttempts >= 2) {
        setShowCaptcha(true);
      }
      
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCaptchaVerify = (token: string) => {
    setCaptchaToken(token);
  };

  const handleCaptchaExpire = () => {
    setCaptchaToken(null);
  };

  const handleCaptchaError = () => {
    setCaptchaToken(null);
    toast({
      title: "Captcha Error",
      description: "There was an error loading the captcha. Please try again.",
      variant: "destructive",
    });
  };

  const handleAdminIconTap = () => {
    const newCount = adminTapCount + 1;
    setAdminTapCount(newCount);
    
    if (newCount >= 5) {
      // Reset count
      setAdminTapCount(0);
      // Trigger admin login modal
      if (onAdminTap) {
        onAdminTap();
      } else {
        navigate('/admin/login');
      }
    }
  };

  if (showForgotPassword) {
    return (
      <ForgotPasswordForm onCancel={() => setShowForgotPassword(false)} />
    );
  }

  return (
    <Card className="w-full border-gold/20 shadow-lg">
      <CardHeader className="space-y-1">
        <motion.div 
          className="flex justify-center mb-4"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div 
            className={`bg-gold/10 p-3 rounded-full cursor-pointer transition-all duration-300 ${
              adminTapCount > 0 ? 'scale-110 bg-gold/20' : ''
            }`}
            onClick={handleAdminIconTap}
            title={adminTapCount > 0 ? `${5 - adminTapCount} taps to admin` : "Tap 5 times for admin"}
          >
            {adminTapCount > 0 ? (
              <Shield className="h-8 w-8 text-gold" />
            ) : (
              <Music className="h-8 w-8 text-gold" />
            )}
          </div>
        </motion.div>
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <CardTitle className="text-2xl text-center font-serif">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
          </CardDescription>
        </motion.div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-4">
            {form.formState.errors.root && (
              <motion.div 
                className="bg-destructive/10 text-destructive p-3 rounded-md flex items-center gap-2 text-sm"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <AlertCircle className="h-4 w-4" />
                {form.formState.errors.root.message}
              </motion.div>
            )}
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="name@example.com" 
                      {...field} 
                      disabled={isSubmitting} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Password</FormLabel>
                    <Button
                      variant="link"
                      size="sm"
                      className="text-xs text-gold hover:text-gold-dark px-0 h-auto"
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                    >
                      Forgot password?
                    </Button>
                  </div>
                  <FormControl>
                    <Input 
                      type="password"
                      placeholder="••••••••"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Conditionally render captcha */}
            {showCaptcha && (
              <motion.div 
                className="flex justify-center my-4 p-4 border rounded-lg bg-muted/30"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <HCaptcha
                  sitekey="6ddca290-02b6-4572-90ce-dcdcc1d2c4ca"
                  onVerify={handleCaptchaVerify}
                  onExpire={handleCaptchaExpire}
                  onError={handleCaptchaError}
                  ref={captchaRef}
                  theme="light"
                />
              </motion.div>
            )}

            {/* Show attempt warning */}
            {loginAttempts > 0 && loginAttempts < 2 && (
              <motion.div 
                className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-md text-sm"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <AlertCircle className="h-4 w-4 inline mr-2" />
                {loginAttempts === 1 ? "1 failed attempt. " : `${loginAttempts} failed attempts. `}
                Captcha will be required after 2 failed attempts.
              </motion.div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting || (showCaptcha && !captchaToken)}
              className="w-full bg-gold hover:bg-gold/90 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </Form>

        <div className="mt-4">
          <SocialLoginOptions />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-4 border-t pt-4">
        <div className="text-center text-sm">
          Don't have an account?{" "}
          <Button
            variant="link"
            className="p-0 text-gold hover:text-gold/80"
            onClick={() => navigate("/auth?tab=signup")}
          >
            Sign up
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground text-center w-full">
          Making
          <br />
          <code className="bg-muted px-1 py-0.5 rounded text-xs">
            music
          </code>{" "}
          , representing
          <code className="bg-muted px-1 py-0.5 rounded text-xs">Christ</code>
        </div>
      </CardFooter>
    </Card>
  );
};

export default LoginForm;
