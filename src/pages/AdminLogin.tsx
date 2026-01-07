import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield, AlertCircle, ArrowLeft, Lock } from "lucide-react";
import AdminLoginForm from "@/components/auth/AdminLoginForm";
import { motion } from "framer-motion";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-2 border-gold/30 shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="bg-gold/20 p-4 rounded-full">
                <Shield className="h-12 w-12 text-gold" />
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Administrator Access</CardTitle>
              <CardDescription className="pt-2">
                Restricted area. Authorized personnel only.
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <Alert className="bg-blue-500/10 border-blue-500/30">
              <Lock className="h-4 w-4 text-blue-500" />
              <AlertTitle className="text-blue-500">Security Notice</AlertTitle>
              <AlertDescription className="text-blue-600">
                All admin access attempts are logged and monitored. Unauthorized access is prohibited.
              </AlertDescription>
            </Alert>

            {!showForm ? (
              <div className="space-y-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Warning</AlertTitle>
                  <AlertDescription>
                    This area contains sensitive system controls. Proceed only if you have proper authorization.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    To access the admin panel, you must have:
                  </p>
                  <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                    <li>Valid admin credentials</li>
                    <li>Admin verification code</li>
                    <li>CAPTCHA verification (if required)</li>
                    <li>Proper role permissions in database</li>
                  </ul>
                </div>
                
                <div className="pt-4 space-y-3">
                  <Button
                    onClick={() => setShowForm(true)}
                    className="w-full bg-gold hover:bg-gold/90 text-white"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Continue to Admin Login
                  </Button>
                  
                  <Button
                    onClick={() => navigate(-1)}
                    variant="outline"
                    className="w-full"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Return to Safety
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <AdminLoginForm onClose={() => {
                  setShowForm(false);
                  navigate(-1);
                }} />
                
                <div className="text-xs text-muted-foreground border-t pt-4">
                  <p className="font-medium mb-1">Troubleshooting:</p>
                  <ul className="space-y-1">
                    <li>• Ensure CAPTCHA loads properly (allow scripts)</li>
                    <li>• Check admin code with system administrator</li>
                    <li>• Verify your account has admin role in database</li>
                    <li>• Contact support if issues persist</li>
                  </ul>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Saem's Tunes Admin System • v2.0.0 • Enhanced Security
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            All access is recorded for security auditing purposes.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
