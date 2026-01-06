import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, ShieldAlert } from "lucide-react";
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
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  email: z.string().min(1, "Email or username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  adminCode: z.string().min(1, "Admin code is required"),
});

type FormData = z.infer<typeof formSchema>;

interface AdminLoginFormProps {
  onClose?: () => void;
}

const AdminLoginForm = ({ onClose = () => {} }: AdminLoginFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const captchaRef = useRef<HCaptcha>(null);
  const { adminLogin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      adminCode: "",
    },
  });

  // Load login attempts from sessionStorage on component mount
  useEffect(() => {
    const storedAttempts = sessionStorage.getItem('adminLoginAttempts');
    if (storedAttempts) {
      const attempts = parseInt(storedAttempts, 10);
      setLoginAttempts(attempts);
    }
  }, []);

  // Check if we should show captcha based on failed attempts
  useEffect(() => {
    // Always show CAPTCHA for admin login after first attempt
    const shouldShowCaptcha = loginAttempts >= 1;
    setShowCaptcha(shouldShowCaptcha);
  }, [loginAttempts]);

  const handleAdminLogin = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      // Check if CAPTCHA is required but not completed
      if (showCaptcha && !captchaToken) {
        form.setError("root", { 
          message: "Please complete the CAPTCHA verification to continue." 
        });
        setIsSubmitting(false);
        return;
      }

      // Attempt admin login with CAPTCHA
      const result = await adminLogin(data.email, data.password, data.adminCode, captchaToken);
      
      // Reset login attempts on success
      setLoginAttempts(0);
      sessionStorage.removeItem('adminLoginAttempts');
      
      // Clear CAPTCHA
      if (captchaRef.current) {
        captchaRef.current.resetCaptcha();
      }
      setCaptchaToken(null);
      
      // Show success message
      toast({
        title: "✅ Admin Access Granted",
        description: result.requiresAdminCode 
          ? "You have successfully logged in as an administrator."
          : "Fixed admin login successful.",
      });
      
      // Navigate to admin dashboard
      navigate("/admin");
      onClose();
      
    } catch (error: any) {
      console.error("Admin login failed:", error);
      
      // Increment login attempts
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      sessionStorage.setItem('adminLoginAttempts', newAttempts.toString());
      
      // Show CAPTCHA after first failed attempt
      if (newAttempts >= 1) {
        setShowCaptcha(true);
      }
      
      // Reset CAPTCHA on error
      if (captchaRef.current) {
        captchaRef.current.resetCaptcha();
      }
      setCaptchaToken(null);
      
      // Set error message
      let errorMessage = "Authentication failed. Please verify your credentials.";
      
      if (error.message.includes("CAPTCHA")) {
        errorMessage = "CAPTCHA verification failed. Please try again.";
      } else if (error.message.includes("admin privileges")) {
        errorMessage = "Your account does not have administrator privileges.";
      } else if (error.message.includes("Invalid admin code")) {
        errorMessage = "Invalid admin verification code.";
      } else if (error.message.includes("Invalid login credentials")) {
        errorMessage = "Invalid email or password.";
      }
      
      form.setError("root", { message: errorMessage });
      
      // Show toast notification
      toast({
        title: "❌ Admin Login Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
      
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCaptchaVerify = (token: string) => {
    setCaptchaToken(token);
  };

  const handleCaptchaExpire = () => {
    setCaptchaToken(null);
    toast({
      title: "CAPTCHA Expired",
      description: "The CAPTCHA challenge has expired. Please complete it again.",
      variant: "destructive",
    });
  };

  const handleCaptchaError = () => {
    setCaptchaToken(null);
    toast({
      title: "CAPTCHA Error",
      description: "There was an error loading the CAPTCHA. Please try again.",
      variant: "destructive",
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleAdminLogin)} className="space-y-4 py-4">
        <div className="flex items-center gap-2 mb-4">
          <ShieldAlert className="h-5 w-5 text-gold" />
          <h3 className="text-lg font-semibold">Admin Authentication</h3>
        </div>
        
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
        
        {/* Attempt warning */}
        {loginAttempts > 0 && (
          <motion.div 
            className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-md text-sm"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
          >
            <AlertCircle className="h-4 w-4 inline mr-2" />
            {loginAttempts} failed attempt{loginAttempts !== 1 ? 's' : ''}. 
            {loginAttempts >= 2 && " Please verify you're using correct credentials."}
          </motion.div>
        )}
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email or Username</FormLabel>
              <FormControl>
                <Input 
                  type="text" 
                  placeholder="admin@example.com or saemstunes" 
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
              <FormLabel>Password</FormLabel>
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
        
        <FormField
          control={form.control}
          name="adminCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Admin Verification Code</FormLabel>
              <FormControl>
                <Input 
                  type="password"
                  placeholder="Enter admin verification code"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
              <p className="text-xs text-muted-foreground mt-1">
                Required for all admin access. Contact system administrator if lost.
              </p>
            </FormItem>
          )}
        />

        {/* CAPTCHA for admin login */}
        {showCaptcha && (
          <motion.div 
            className="flex flex-col items-center my-4 p-4 border rounded-lg bg-muted/30"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-sm text-center text-muted-foreground mb-3">
              Security verification required for admin access:
            </p>
            <HCaptcha
              sitekey="6ddca290-02b6-4572-90ce-dcdcc1d2c4ca"
              onVerify={handleCaptchaVerify}
              onExpire={handleCaptchaExpire}
              onError={handleCaptchaError}
              ref={captchaRef}
              theme="light"
            />
            <p className="text-xs text-muted-foreground mt-3 text-center">
              This extra verification prevents unauthorized admin access attempts.
            </p>
          </motion.div>
        )}

        <div className="flex justify-between pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          
          <Button
            type="submit"
            disabled={isSubmitting || (showCaptcha && !captchaToken)}
            className="bg-gold hover:bg-gold/90 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <ShieldAlert className="mr-2 h-4 w-4" />
                Access Admin Panel
              </>
            )}
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground pt-4 border-t">
          <p className="mb-1">Admin Login Information:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>All admin logins require verification code</li>
            <li>CAPTCHA required after failed attempts</li>
            <li>Fixed admin: username "saemstunes" with preset password</li>
            <li>Regular admins must have proper Supabase permissions</li>
          </ul>
        </div>
      </form>
    </Form>
  );
};

export default AdminLoginForm;
