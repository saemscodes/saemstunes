import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAISettings } from "@/context/AISettingsContext";
import { 
  Users, 
  Music, 
  Calendar, 
  Settings, 
  BarChart3, 
  Bell, 
  FileText,
  LogOut,
  Search,
  Upload,
  Star,
  GripVertical,
  RefreshCw,
  Brain,
  Shield,
  AlertCircle,
  CheckCircle,
  Home,
  ChevronRight,
  MoreVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import Logo from "@/components/branding/Logo";
import AdminUpload from "@/components/admin/AdminUpload";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useNavigate, Link } from "react-router-dom";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const NAV_ITEMS = [
  { icon: BarChart3, label: "Dashboard", value: "dashboard" },
  { icon: Users, label: "Users", value: "users" },
  { icon: Music, label: "Content", value: "content" },
  { icon: Calendar, label: "Schedule", value: "schedule" },
  { icon: Bell, label: "Notifications", value: "notifications" },
  { icon: FileText, label: "Reports", value: "reports" },
  { icon: Settings, label: "Settings", value: "settings" },
  { icon: Star, label: "Featured", value: "featured" },
  { icon: Upload, label: "Upload", value: "upload" },
  { icon: Brain, label: "AI Settings", value: "ai-settings" },
  { icon: Shield, label: "Admin Tools", value: "admin-tools" },
];

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  is_admin: boolean;
  created_at: string;
  avatar_url?: string;
  display_name?: string;
  subscription_tier: string;
}

interface ContentItem {
  id: string;
  title: string;
  type: string;
  created_at: string;
  views?: number;
  enrollments?: number;
  plays?: number;
  downloads?: number;
}

interface DashboardStats {
  totalUsers: number;
  activeSubscriptions: number;
  contentViews: number;
  revenue: number;
}

interface FeaturedItem {
  id: string;
  title: string;
  description: string;
  image: string;
  link: string;
  is_external?: boolean;
  order?: number;
  created_at?: string;
}

interface AdminStatus {
  is_admin: boolean;
  is_authenticated: boolean;
  user_id?: string;
  email?: string;
  role?: string;
  display_name?: string;
  subscription_tier?: string;
  has_admin_access: boolean;
  message?: string;
}

const handleSupabaseError = (error: any, context: string) => {
  console.error(`❌ Supabase Error (${context}):`, {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint
  });
  
  toast({
    title: `Database Error: ${context}`,
    description: error.message,
    variant: "destructive"
  });
};

const FeaturedItemForm = ({ 
  item, 
  onSave, 
  onCancel 
}: { 
  item: FeaturedItem; 
  onSave: (item: FeaturedItem) => void; 
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState<FeaturedItem>(item);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async () => {
    if (!imageFile) {
      toast({
        title: "No image selected",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setUploading(true);
      
      // Check if bucket exists, create if not
      const { data: buckets } = await supabase.storage.listBuckets();
      const hasFeaturedImagesBucket = buckets?.some(b => b.name === 'featured-images');
      
      if (!hasFeaturedImagesBucket) {
        const { error: createBucketError } = await supabase.storage.createBucket('featured-images', {
          public: true,
          fileSizeLimit: 5242880, // 5MB
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        });
        
        if (createBucketError) {
          console.error("Bucket creation error:", createBucketError);
          // Continue anyway - bucket might already exist
        }
      }
      
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `featured/${fileName}`;
      
      console.log("Uploading image to:", filePath);
      
      const { error: uploadError } = await supabase.storage
        .from('featured-images')
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        handleSupabaseError(uploadError, 'image upload');
        return;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('featured-images')
        .getPublicUrl(filePath);
      
      console.log("Got public URL:", publicUrl);
      
      setFormData(prev => ({ ...prev, image: publicUrl }));
      toast({ 
        title: "✅ Image uploaded successfully!",
        description: "Image is now ready to use"
      });
    } catch (error: any) {
      console.error("Image upload error:", error);
      toast({ 
        title: "❌ Image upload failed",
        description: error.message || "Unknown error",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.description || !formData.image || !formData.link) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields (title, description, image, link)",
        variant: "destructive"
      });
      return;
    }
    
    setSaving(true);
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-gold" />
          {item.id ? 'Edit Featured Item' : 'Create New Featured Item'}
        </CardTitle>
        <CardDescription>
          Featured items appear on the homepage carousel
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title" className="font-semibold">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter a descriptive title"
              required
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="description" className="font-semibold">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Brief description of this featured item"
              required
              rows={3}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="image" className="font-semibold">
              Image <span className="text-destructive">*</span>
            </Label>
            <div className="space-y-3 mt-1">
              {formData.image && (
                <div className="flex flex-col items-start gap-2">
                  <p className="text-sm text-muted-foreground">Current Image:</p>
                  <img 
                    src={formData.image} 
                    alt="Preview" 
                    className="w-32 h-32 object-cover rounded-lg border-2 border-muted"
                    onError={(e) => {
                      console.error("Image failed to load:", formData.image);
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    variant="secondary"
                    disabled={!imageFile || uploading}
                    onClick={handleImageUpload}
                    className="whitespace-nowrap"
                  >
                    {uploading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : "Upload"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Upload an image (JPG, PNG, WebP, GIF). Max 5MB.
                </p>
              </div>
            </div>
          </div>
          
          <div>
            <Label htmlFor="link" className="font-semibold">
              Link <span className="text-destructive">*</span>
            </Label>
            <Input
              id="link"
              name="link"
              value={formData.link}
              onChange={handleChange}
              placeholder="/tracks or https://example.com"
              required
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Use internal paths like "/tracks" or external URLs like "https://example.com"
            </p>
          </div>
          
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="is_external"
              name="is_external"
              checked={formData.is_external || false}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, is_external: checked === true }))
              }
            />
            <Label htmlFor="is_external" className="cursor-pointer">
              Open link in new tab (external links)
            </Label>
          </div>
          
          <div className="flex gap-2 pt-6 border-t">
            <Button 
              type="button" 
              className="bg-gold hover:bg-gold/90 text-white flex-1"
              onClick={handleSubmit}
              disabled={saving || uploading}
            >
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Save Featured Item
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={onCancel}
              disabled={saving}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const SortableRow = ({ 
  item, 
  onEdit, 
  onDelete 
}: { 
  item: FeaturedItem; 
  onEdit: (item: FeaturedItem) => void; 
  onDelete: (id: string) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr 
      ref={setNodeRef}
      style={style}
      className="border-b hover:bg-muted/50 transition-colors"
    >
      <td 
        className="p-3 cursor-move"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </td>
      <td className="p-3 font-medium">{item.title}</td>
      <td className="p-3">
        <div className="flex items-center gap-2">
          <img 
            src={item.image} 
            alt={item.title}
            className="w-16 h-10 object-cover rounded border"
            onError={(e) => {
              console.error("Image failed to load:", item.image);
              (e.target as HTMLImageElement).src = 'https://placehold.co/64x40/1a1a1a/ffffff?text=Image';
            }}
          />
        </div>
      </td>
      <td className="p-3">
        <div className="max-w-xs truncate">
          <a 
            href={item.link} 
            target={item.is_external ? "_blank" : "_self"}
            rel={item.is_external ? "noopener noreferrer" : ""}
            className="text-blue-600 hover:text-blue-800 hover:underline text-sm"
          >
            {item.link}
          </a>
          {item.is_external && (
            <span className="ml-2 text-xs text-muted-foreground">(external)</span>
          )}
        </div>
      </td>
      <td className="p-3">
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onEdit(item)}
          >
            Edit
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-destructive border-destructive/20 hover:bg-destructive/10"
            onClick={() => onDelete(item.id)}
          >
            Delete
          </Button>
        </div>
      </td>
    </tr>
  );
};

const AISettingsTab = () => {
  const { settings, isLoading, updateSettings } = useAISettings();
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleToggle = async (field: string, value: boolean) => {
    if (!localSettings) return;
    
    const updated = { ...localSettings, [field]: value };
    setLocalSettings(updated);
    await updateSettings({ [field]: value });
  };

  const handleTierToggle = async (tier: string) => {
    if (!localSettings) return;
    
    const currentTiers = localSettings.allowed_tiers || [];
    const updatedTiers = currentTiers.includes(tier)
      ? currentTiers.filter(t => t !== tier)
      : [...currentTiers, tier];
    
    const updated = { ...localSettings, allowed_tiers: updatedTiers };
    setLocalSettings(updated);
    await updateSettings({ allowed_tiers: updatedTiers });
  };

  if (isLoading || !localSettings) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p>Loading AI settings...</p>
        </CardContent>
      </Card>
    );
  }

  const tiers = ['free', 'basic', 'premium', 'professional'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">AI Feature Settings</h1>
        <div className="flex items-center gap-2">
          <Badge variant={localSettings.is_enabled ? "default" : "secondary"}>
            {localSettings.is_enabled ? "Enabled" : "Disabled"}
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>SaemsTunes AI Controls</CardTitle>
          <CardDescription>
            Control who can access the AI assistant feature
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="ai-enabled" className="text-base">Enable AI Feature</Label>
              <p className="text-sm text-muted-foreground">
                Turn the entire AI feature on or off
              </p>
            </div>
            <Switch
              id="ai-enabled"
              checked={localSettings.is_enabled}
              onCheckedChange={(checked) => handleToggle('is_enabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="require-subscription" className="text-base">Require Subscription</Label>
              <p className="text-sm text-muted-foreground">
                Only allow subscribed users to access AI
              </p>
            </div>
            <Switch
              id="require-subscription"
              checked={localSettings.require_subscription}
              onCheckedChange={(checked) => handleToggle('require_subscription', checked)}
            />
          </div>

          <div className="space-y-4">
            <Label className="text-base">Allowed Subscription Tiers</Label>
            <p className="text-sm text-muted-foreground">
              Select which subscription tiers can access the AI feature
            </p>
            <div className="flex flex-wrap gap-2">
              {tiers.map((tier) => (
                <Badge
                  key={tier}
                  variant={localSettings.allowed_tiers?.includes(tier) ? "default" : "outline"}
                  className="cursor-pointer capitalize"
                  onClick={() => handleTierToggle(tier)}
                >
                  {tier}
                </Badge>
              ))}
            </div>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">Current Configuration:</h4>
            <p className="text-sm">
              AI Feature is <strong>{localSettings.is_enabled ? "ENABLED" : "DISABLED"}</strong>
              <br />
              Requires subscription: <strong>{localSettings.require_subscription ? "YES" : "NO"}</strong>
              <br />
              Allowed tiers: <strong>{localSettings.allowed_tiers?.join(", ") || "None"}</strong>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const AdminToolsTab = () => {
  const [testResults, setTestResults] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const [adminStatus, setAdminStatus] = useState<AdminStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const runAdminTests = async () => {
    setTesting(true);
    try {
      // Test 1: Check admin status
      const { data: statusData, error: statusError } = await supabase
        .rpc('verify_admin_status');
      
      if (statusError) throw statusError;
      setAdminStatus(statusData);
      
      // Test 2: Test admin access
      const { data: testData, error: testError } = await supabase
        .rpc('test_admin_access');
      
      if (testError) throw testError;
      setTestResults(testData);
      
      toast({
        title: "✅ Admin tests completed",
        description: "Check results below",
      });
    } catch (error: any) {
      console.error("Admin test error:", error);
      toast({
        title: "❌ Admin tests failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const verifyAdminAccess = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('verify_admin_status');
      
      if (error) throw error;
      
      setAdminStatus(data);
      
      toast({
        title: data.has_admin_access ? "✅ Admin Access Verified" : "❌ Not Admin",
        description: data.has_admin_access 
          ? `Logged in as ${data.email} (${data.role})`
          : "You don't have admin access",
        variant: data.has_admin_access ? "default" : "destructive"
      });
    } catch (error: any) {
      console.error("Verification error:", error);
      toast({
        title: "❌ Verification failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Tools & Diagnostics</h1>
        <div className="flex items-center gap-2">
          <Badge variant={adminStatus?.has_admin_access ? "default" : "secondary"}>
            {adminStatus?.has_admin_access ? "Admin" : "Not Admin"}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Admin Status Verification</CardTitle>
            <CardDescription>
              Verify your current admin permissions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={verifyAdminAccess}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Verify Admin Access
                </>
              )}
            </Button>
            
            {adminStatus && (
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Admin Status</p>
                    <p className={`font-semibold ${adminStatus.has_admin_access ? 'text-green-600' : 'text-destructive'}`}>
                      {adminStatus.has_admin_access ? '✅ ADMIN' : '❌ NOT ADMIN'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Role</p>
                    <p className="font-semibold">{adminStatus.role || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-semibold truncate">{adminStatus.email || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Subscription</p>
                    <p className="font-semibold">{adminStatus.subscription_tier || 'Not set'}</p>
                  </div>
                </div>
                {adminStatus.message && (
                  <p className="text-sm text-muted-foreground mt-2">{adminStatus.message}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Database Access Tests</CardTitle>
            <CardDescription>
              Test RLS policies and database permissions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={runAdminTests}
              disabled={testing}
              variant="outline"
              className="w-full"
            >
              {testing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Run Admin Access Tests
                </>
              )}
            </Button>
            
            {testResults && (
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <div className="space-y-2">
                  <p className="font-medium">Test Results:</p>
                  <pre className="text-xs bg-black/10 p-2 rounded overflow-auto max-h-40">
                    {JSON.stringify(testResults, null, 2)}
                  </pre>
                </div>
                <div className={`p-2 rounded ${testResults.status.includes('CONFIRMED') ? 'bg-green-500/10 text-green-600' : 'bg-destructive/10 text-destructive'}`}>
                  <p className="text-sm font-medium">{testResults.status}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Database Functions</CardTitle>
          <CardDescription>
            Direct database function calls for troubleshooting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              These functions bypass RLS and should only be used for debugging.
            </AlertDescription>
          </Alert>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const { data, error } = await supabase.rpc('is_admin');
                  if (error) throw error;
                  toast({
                    title: "is_admin() Result",
                    description: `Returns: ${data ? 'TRUE' : 'FALSE'}`,
                  });
                } catch (error: any) {
                  toast({
                    title: "Error",
                    description: error.message,
                    variant: "destructive"
                  });
                }
              }}
            >
              Test is_admin()
            </Button>
            
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const { data, error } = await supabase.rpc('is_current_user_admin');
                  if (error) throw error;
                  toast({
                    title: "is_current_user_admin() Result",
                    description: `Returns: ${data ? 'TRUE' : 'FALSE'}`,
                  });
                } catch (error: any) {
                  toast({
                    title: "Error",
                    description: error.message,
                    variant: "destructive"
                  });
                }
              }}
            >
              Test is_current_user_admin()
            </Button>
            
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const { data: user } = await supabase.auth.getUser();
                  if (!user.user) throw new Error("Not logged in");
                  
                  const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.user.id)
                    .single();
                  
                  if (error) throw error;
                  
                  toast({
                    title: "Profile Data",
                    description: `Role: ${profile.role}, is_admin: ${profile.is_admin}`,
                  });
                } catch (error: any) {
                  toast({
                    title: "Error",
                    description: error.message,
                    variant: "destructive"
                  });
                }
              }}
            >
              Check Profile Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const Admin = () => {
  const { user, logout, isLoading: authLoading, isFixedAdmin, fixedAdminLogout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminStatus, setAdminStatus] = useState<AdminStatus | null>(null);
  const [editingItem, setEditingItem] = useState<FeaturedItem | null>(null);
  const [featuredItems, setFeaturedItems] = useState<FeaturedItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeSubscriptions: 0,
    contentViews: 0,
    revenue: 0
  });
  const [recentUsers, setRecentUsers] = useState<UserProfile[]>([]);
  const [recentContent, setRecentContent] = useState<ContentItem[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersPage, setUsersPage] = useState(1);
  const [usersPerPage] = useState(8);
  const [totalUsersCount, setTotalUsersCount] = useState(0);
  const [usersSearch, setUsersSearch] = useState('');
  
  const [allContent, setAllContent] = useState<ContentItem[]>([]);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentPage, setContentPage] = useState(1);
  const [contentPerPage] = useState(8);
  const [contentSearch, setContentSearch] = useState('');

  const filteredContent = useMemo(() => {
    if (!contentSearch) return allContent;
    return allContent.filter(item => 
      item.title.toLowerCase().includes(contentSearch.toLowerCase())
    );
  }, [allContent, contentSearch]);

  const paginatedContent = useMemo(() => {
    const start = (contentPage - 1) * contentPerPage;
    return filteredContent.slice(start, start + contentPerPage);
  }, [filteredContent, contentPage, contentPerPage]);

  const totalContentCount = filteredContent.length;

  // Check admin status on mount
  useEffect(() => {
    const checkAdminStatus = () => {
      setLoading(true);
      
      // Check session storage first
      const adminAuth = sessionStorage.getItem('adminAuth');
      const adminUser = sessionStorage.getItem('adminUser');
      
      if (adminAuth === 'true' && adminUser) {
        try {
          const userData = JSON.parse(adminUser);
          console.log("✅ Admin access verified from session storage");
          
          setAdminStatus({
            is_admin: true,
            is_authenticated: true,
            user_id: userData.id,
            email: userData.email,
            role: userData.role,
            display_name: userData.display_name,
            subscription_tier: userData.subscription_tier,
            has_admin_access: true,
            message: "Admin access granted via session"
          });
          
          setIsAuthenticated(true);
          setLoading(false);
          return;
        } catch (error) {
          console.error("Error parsing admin user data:", error);
        }
      }
      
      // If no session storage but we're in auth loading state
      if (authLoading) {
        console.log("Auth still loading, waiting...");
        return;
      }
      
      // If we have a user (from Supabase or fixed admin)
      if (user || isFixedAdmin) {
        console.log("User exists in context, checking admin status...");
        
        // For fixed admin, we're already authenticated
        if (isFixedAdmin) {
          setAdminStatus({
            is_admin: true,
            is_authenticated: true,
            email: 'admin@saemstunes.com',
            role: 'admin',
            display_name: 'Fixed Admin',
            subscription_tier: 'professional',
            has_admin_access: true,
            message: "Fixed admin access"
          });
          setIsAuthenticated(true);
          setLoading(false);
          return;
        }
        
        // For Supabase users, verify with RPC
        if (user && !isFixedAdmin) {
          console.log("Verifying Supabase admin status...");
          
          // Use a timeout to prevent hanging
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Admin verification timeout")), 10000)
          );
          
          const verificationPromise = supabase.rpc('verify_admin_status');
          
          Promise.race([verificationPromise, timeoutPromise])
            .then((result: any) => {
              const status = result.data;
              if (status?.has_admin_access) {
                console.log("✅ Supabase admin access verified");
                setAdminStatus(status);
                setIsAuthenticated(true);
                
                // Update session storage
                sessionStorage.setItem('adminAuth', 'true');
                sessionStorage.setItem('fixedAdmin', 'false');
                sessionStorage.setItem('adminUser', JSON.stringify({
                  id: user.id,
                  email: user.email,
                  role: status.role,
                  display_name: status.display_name,
                  subscription_tier: status.subscription_tier
                }));
              } else {
                console.log("❌ User does not have admin access");
                handleAccessDenied("You do not have admin privileges");
              }
            })
            .catch((error) => {
              console.error("Admin verification error:", error);
              
              // Fallback: Check if user has admin role in profile
              supabase
                .from('profiles')
                .select('role, is_admin')
                .eq('id', user.id)
                .single()
                .then(({ data: profile, error: profileError }) => {
                  if (profileError) {
                    console.error("Profile check error:", profileError);
                    handleAccessDenied("Unable to verify admin status");
                    return;
                  }
                  
                  if (profile?.role === 'admin' || profile?.is_admin === true) {
                    console.log("✅ Admin access confirmed via profile check");
                    setIsAuthenticated(true);
                    
                    // Update session storage
                    sessionStorage.setItem('adminAuth', 'true');
                    sessionStorage.setItem('fixedAdmin', 'false');
                    sessionStorage.setItem('adminUser', JSON.stringify({
                      id: user.id,
                      email: user.email,
                      role: profile.role,
                      display_name: user.name,
                      subscription_tier: 'professional'
                    }));
                    
                    setAdminStatus({
                      is_admin: true,
                      is_authenticated: true,
                      user_id: user.id,
                      email: user.email,
                      role: profile.role,
                      display_name: user.name,
                      subscription_tier: 'professional',
                      has_admin_access: true,
                      message: "Admin access granted via profile check"
                    });
                  } else {
                    handleAccessDenied("Your profile does not have admin role");
                  }
                });
            })
            .finally(() => {
              setLoading(false);
            });
        } else {
          // No user at all
          console.log("❌ No user found");
          setIsAuthenticated(false);
          setLoading(false);
          navigate('/admin/login');
        }
      } else {
        // No user and not fixed admin
        console.log("❌ No authenticated user");
        setIsAuthenticated(false);
        setLoading(false);
        navigate('/admin/login');
      }
    };

    const handleAccessDenied = (message: string) => {
      console.error("Access denied:", message);
      toast({
        title: "Access Denied",
        description: message,
        variant: "destructive",
        duration: 5000
      });
      
      // Clear invalid session
      sessionStorage.removeItem('adminAuth');
      sessionStorage.removeItem('adminUser');
      sessionStorage.removeItem('fixedAdmin');
      
      setTimeout(() => {
        navigate('/admin/login');
      }, 3000);
    };

    // Add a small delay to ensure session storage is set
    const timeoutId = setTimeout(checkAdminStatus, 500);
    
    return () => clearTimeout(timeoutId);
  }, [user, authLoading, isFixedAdmin, navigate]);

  useEffect(() => {
    if (isAuthenticated && activeTab === 'dashboard') {
      fetchDashboardData();
    }
  }, [isAuthenticated, activeTab]);

  useEffect(() => {
    if (isAuthenticated && activeTab === 'users') {
      fetchUsers();
    }
  }, [isAuthenticated, activeTab, usersPage, usersSearch]);

  useEffect(() => {
    if (isAuthenticated && activeTab === 'content') {
      fetchContent();
    }
  }, [isAuthenticated, activeTab]);

  useEffect(() => {
    if (isAuthenticated && activeTab === 'featured') {
      fetchFeaturedItems();
    }
  }, [isAuthenticated, activeTab]);

  const fetchDashboardData = async () => {
    setDashboardLoading(true);
    try {
      const [
        totalUsersRes,
        activeSubscriptionsRes,
        contentViewsRes,
        revenueRes,
        usersRes,
        contentRes
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')
          .gt('valid_until', new Date().toISOString()),
        supabase.rpc('get_total_content_views').catch(() => ({ data: [{ total_views: 0 }], error: null })),
        supabase.rpc('get_current_month_revenue').catch(() => ({ data: [{ total_revenue: 0 }], error: null })),
        supabase
          .from('profiles')
          .select('id, first_name, last_name, email, role, created_at, is_admin, display_name')
          .order('created_at', { ascending: false })
          .limit(4)
          .catch(() => ({ data: [], error: null })),
        supabase.rpc('get_recent_content', { limit_count: 4 }).catch(() => ({ data: [], error: null }))
      ]);

      setDashboardStats({
        totalUsers: totalUsersRes.count || 0,
        activeSubscriptions: activeSubscriptionsRes.count || 0,
        contentViews: contentViewsRes.data?.[0]?.total_views || 0,
        revenue: revenueRes.data?.[0]?.total_revenue || 0
      });
      
      setRecentUsers(usersRes.data || []);
      setRecentContent(contentRes.data || []);
    } catch (error: any) {
      console.error("Dashboard data error:", error);
      toast({ 
        title: "Failed to load dashboard data",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setDashboardLoading(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      let query = supabase
        .from('profiles')
        .select('id, first_name, last_name, email, role, created_at, is_admin, display_name, subscription_tier', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((usersPage - 1) * usersPerPage, usersPage * usersPerPage - 1);

      if (usersSearch) {
        query = query.or(`first_name.ilike.%${usersSearch}%,last_name.ilike.%${usersSearch}%,email.ilike.%${usersSearch}%,display_name.ilike.%${usersSearch}%`);
      }

      const { data, error, count } = await query;
      
      if (error) {
        handleSupabaseError(error, 'fetch users');
        return;
      }
      
      setUsers(data || []);
      setTotalUsersCount(count || 0);
    } catch (error: any) {
      toast({ 
        title: "Failed to load users",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchContent = async () => {
    setContentLoading(true);
    try {
      const [
        videosRes,
        audioRes,
        coursesRes
      ] = await Promise.all([
        supabase.from('video_content').select('id, title, created_at'),
        supabase.from('tracks').select('id, title, created_at'),
        supabase.from('learning_paths').select('id, title, created_at')
      ]);

      const videos = videosRes.data?.map(item => ({
        ...item,
        type: 'video',
        views: 0,
        created_at: new Date(item.created_at).toISOString()
      })) || [];

      const audio = audioRes.data?.map(item => ({
        ...item,
        type: 'audio',
        plays: 0,
        created_at: new Date(item.created_at).toISOString()
      })) || [];

      const courses = coursesRes.data?.map(item => ({
        ...item,
        type: 'course',
        enrollments: 0,
        created_at: new Date(item.created_at).toISOString()
      })) || [];

      const combinedContent = [
        ...videos,
        ...audio,
        ...courses
      ];

      combinedContent.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setAllContent(combinedContent);
    } catch (error: any) {
      toast({ 
        title: "Failed to load content",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setContentLoading(false);
    }
  };

  const fetchFeaturedItems = async () => {
    setItemsLoading(true);
    try {
      // Try admin function first
      const { data, error } = await supabase
        .rpc('get_featured_items_admin');
      
      if (error) {
        console.log("Falling back to regular select");
        // Fall back to regular select
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('featured_items')
          .select('*')
          .order('order', { ascending: true })
          .order('created_at', { ascending: false });
        
        if (fallbackError) throw fallbackError;
        setFeaturedItems(fallbackData || []);
      } else {
        setFeaturedItems(data || []);
      }
    } catch (error: any) {
      console.error("Failed to load featured items:", error);
      toast({ 
        title: "Failed to load featured items",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setItemsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Clear session storage
      sessionStorage.removeItem('adminAuth');
      sessionStorage.removeItem('adminUser');
      sessionStorage.removeItem('fixedAdmin');
      
      // Log out based on admin type
      if (isFixedAdmin) {
        fixedAdminLogout();
      } else if (user) {
        await logout();
      }
      
      // Reset state
      setIsAuthenticated(false);
      setAdminStatus(null);
      
      toast({
        title: "Logged out",
        description: "You have been logged out from the admin panel.",
      });
      
      // Redirect to home
      navigate('/');
    } catch (error: any) {
      console.error("Logout failed:", error);
      toast({
        title: "Logout Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleSaveFeaturedItem = async (item: FeaturedItem) => {
    try {
      console.log("Saving featured item:", item);
      
      if (item.id) {
        // Update existing item using admin function
        const { data, error } = await supabase
          .rpc('admin_update_featured_item', {
            p_id: item.id,
            p_title: item.title,
            p_description: item.description,
            p_image: item.image,
            p_link: item.link,
            p_is_external: item.is_external || false,
            p_order: item.order || featuredItems.length
          });
          
        if (error) {
          console.error("Update error:", error);
          handleSupabaseError(error, 'update featured item');
          return;
        }
        
        console.log("Update successful:", data);
      } else {
        // Create new item using admin function
        const { data, error } = await supabase
          .rpc('admin_create_featured_item', {
            p_title: item.title,
            p_description: item.description,
            p_image: item.image,
            p_link: item.link,
            p_is_external: item.is_external || false,
            p_order: featuredItems.length
          });
          
        if (error) {
          console.error("Create error:", error);
          handleSupabaseError(error, 'create featured item');
          return;
        }
        
        console.log("Create successful, new ID:", data);
        item.id = data;
      }
      
      // Refresh the list
      await fetchFeaturedItems();
      setEditingItem(null);
      
      toast({ 
        title: "✅ Featured item saved successfully!",
        description: "The item has been saved and will appear on the homepage."
      });
    } catch (error: any) {
      console.error("Save error:", error);
      toast({ 
        title: "❌ Failed to save featured item",
        description: error.message || "Unknown error occurred",
        variant: "destructive"
      });
    }
  };

  const handleDeleteFeaturedItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this featured item? This action cannot be undone.")) {
      return;
    }
    
    try {
      console.log("Deleting featured item:", id);
      
      const { data, error } = await supabase
        .rpc('admin_delete_featured_item', { p_id: id });
      
      if (error) {
        console.error("Delete error:", error);
        handleSupabaseError(error, 'delete featured item');
        return;
      }
      
      console.log("Delete successful:", data);
      
      // Refresh the list
      await fetchFeaturedItems();
      
      toast({ 
        title: "✅ Featured item deleted!",
        description: "The item has been removed from the featured list."
      });
    } catch (error: any) {
      console.error("Delete error:", error);
      toast({ 
        title: "❌ Failed to delete featured item",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleReorder = async (startIndex: number, endIndex: number) => {
    const items = [...featuredItems];
    const [removed] = items.splice(startIndex, 1);
    items.splice(endIndex, 0, removed);
    
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index
    }));

    try {
      // Update each item's order
      for (const item of updatedItems) {
        const { error } = await supabase
          .rpc('admin_update_featured_item', {
            p_id: item.id,
            p_title: item.title,
            p_description: item.description,
            p_image: item.image,
            p_link: item.link,
            p_is_external: item.is_external || false,
            p_order: item.order
          });
        
        if (error) {
          console.error("Reorder error for item:", item.id, error);
          throw error;
        }
      }
      
      // Refresh the list
      await fetchFeaturedItems();
      
      toast({ 
        title: "✅ Order updated!",
        description: "Featured items have been reordered."
      });
    } catch (error: any) {
      console.error("Reorder error:", error);
      toast({ 
        title: "❌ Failed to reorder items",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      const oldIndex = featuredItems.findIndex(item => item.id === active.id);
      const newIndex = featuredItems.findIndex(item => item.id === over.id);
      handleReorder(oldIndex, newIndex);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This will permanently remove their account and data.")) {
      return;
    }
    
    try {
      // Try to delete just from profiles first
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) {
        handleSupabaseError(profileError, 'delete user profile');
        return;
      }
      
      fetchUsers();
      toast({ 
        title: "✅ User deleted successfully!",
        description: "User account has been removed."
      });
    } catch (error: any) {
      console.error("Delete error:", error);
      toast({ 
        title: "❌ Failed to delete user",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDeleteContent = async (contentId: string, contentType: string) => {
    if (!confirm(`Are you sure you want to delete this ${contentType}? This action cannot be undone.`)) {
      return;
    }
    
    try {
      let tableName = '';
      switch (contentType) {
        case 'video':
          tableName = 'video_content';
          break;
        case 'audio':
          tableName = 'tracks';
          break;
        case 'course':
          tableName = 'learning_paths';
          break;
        default:
          throw new Error(`Unknown content type: ${contentType}`);
      }
      
      const { error } = await supabase
        .from(tableName as any)
        .delete()
        .eq('id', contentId);
      
      if (error) {
        handleSupabaseError(error, 'delete content');
        return;
      }
      
      fetchContent();
      toast({ 
        title: "✅ Content deleted successfully!",
        description: `The ${contentType} has been removed.`
      });
    } catch (error: any) {
      console.error("Delete error:", error);
      toast({ 
        title: "❌ Failed to delete content",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Loading state
  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center space-y-4">
          <Logo size="lg" />
          <div className="space-y-2">
            <div className="h-4 w-48 bg-muted rounded animate-pulse mx-auto"></div>
            <div className="h-3 w-32 bg-muted rounded animate-pulse mx-auto"></div>
          </div>
          <p className="text-sm text-muted-foreground">
            Loading admin panel...
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Logo size="lg" />
            </div>
            <CardTitle className="text-2xl">Admin Access Required</CardTitle>
            <CardDescription className="pt-2">
              Please log in to access the admin panel.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Access Denied</AlertTitle>
              <AlertDescription>
                You need to be logged in as an administrator.
              </AlertDescription>
            </Alert>
            
            <div className="pt-4 space-y-3">
              <Button 
                onClick={() => navigate('/admin/login')}
                className="w-full bg-gold hover:bg-gold/90 text-white"
              >
                Go to Admin Login
              </Button>
              
              <Button 
                onClick={() => navigate('/')}
                variant="outline"
                className="w-full"
              >
                Return to Home
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-center text-xs text-muted-foreground border-t pt-4">
            <p>Admin Panel • Saem's Tunes</p>
            <p>Version 2.0.0 • Enhanced Security</p>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // MAIN ADMIN PANEL
  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <header className="bg-background border-b sticky top-0 z-50 shadow-sm">
        <div className="container flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Logo size="sm" />
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <div className="bg-gold/10 text-gold px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    ADMIN PANEL
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {isFixedAdmin ? 'Fixed Admin' : (adminStatus?.role || 'Admin')}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {adminStatus?.email || 'Administrator'} • {adminStatus?.subscription_tier || 'Professional'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative w-full max-w-xs hidden md:block">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search admin panel..." 
                className="pl-8 bg-background border-muted"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium">{adminStatus?.display_name || 'Administrator'}</p>
                <p className="text-xs text-muted-foreground">Last login: {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate('/')}>
                    <Home className="h-4 w-4 mr-2" />
                    Go to Home
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveTab('admin-tools')}>
                    <Shield className="h-4 w-4 mr-2" />
                    Admin Tools
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        
        {/* Breadcrumb */}
        <div className="container pb-3">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/" className="flex items-center gap-1">
                    <Home className="h-3 w-3" />
                    Home
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/admin" className="font-medium">
                    Admin Dashboard
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {activeTab !== 'dashboard' && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <span className="capitalize">{activeTab.replace('-', ' ')}</span>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      
      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-64 bg-background border-r p-4">
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <Button
                key={item.value}
                variant={activeTab === item.value ? "secondary" : "ghost"}
                className={`w-full justify-start ${
                  activeTab === item.value 
                    ? "bg-gold/10 text-gold hover:bg-gold/20 border-l-4 border-gold" 
                    : "border-l-4 border-transparent"
                }`}
                onClick={() => setActiveTab(item.value)}
              >
                <item.icon className="mr-3 h-4 w-4" />
                {item.label}
              </Button>
            ))}
          </nav>
          
          <div className="mt-auto pt-6 border-t mt-6">
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium">Saem's Tunes Admin</p>
              <p>Version 2.0.0 • Enhanced Security</p>
              <p className="pt-2 text-green-600">
                <CheckCircle className="h-3 w-3 inline mr-1" />
                Admin Access Verified
              </p>
              {isFixedAdmin && (
                <p className="pt-1 text-amber-600 text-xs">
                  ⚠️ Fixed Admin Mode
                </p>
              )}
            </div>
          </div>
        </aside>
        
        {/* Mobile Navigation */}
        <div className="md:hidden w-full border-b bg-background sticky top-0 z-40">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full overflow-x-auto justify-start py-1 h-auto px-2">
              {NAV_ITEMS.slice(0, 6).map((item) => (
                <TabsTrigger 
                  key={item.value} 
                  value={item.value} 
                  className="flex flex-col items-center gap-1 px-3 py-2 h-auto"
                >
                  <item.icon className="h-4 w-4" />
                  <span className="text-xs mt-1">{item.label}</span>
                </TabsTrigger>
              ))}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-auto px-3 py-2">
                    <MoreVertical className="h-4 w-4" />
                    <span className="text-xs mt-1">More</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {NAV_ITEMS.slice(6).map((item) => (
                    <DropdownMenuItem key={item.value} onClick={() => setActiveTab(item.value)}>
                      <item.icon className="h-4 w-4 mr-2" />
                      {item.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </TabsList>
          </Tabs>
        </div>
        
        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <Tabs value={activeTab} className="w-full">
              
              {/* DASHBOARD TAB */}
              <TabsContent value="dashboard" className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                    <p className="text-muted-foreground">
                      Welcome back, {adminStatus?.display_name || 'Admin'}! Here's what's happening.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Updated: {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </Badge>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={fetchDashboardData}
                      disabled={dashboardLoading}
                    >
                      <RefreshCw className={`h-3 w-3 mr-1 ${dashboardLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </div>
                
                {dashboardLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardHeader className="pb-2">
                          <Skeleton className="h-4 w-3/4" />
                        </CardHeader>
                        <CardContent>
                          <Skeleton className="h-6 w-1/2 mb-2" />
                          <Skeleton className="h-3 w-3/4" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Total Users
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{dashboardStats.totalUsers.toLocaleString()}</div>
                        <p className="text-xs text-green-600 flex items-center mt-1">
                          <span className="h-2 w-2 bg-green-500 rounded-full mr-1"></span>
                          +12% from last month
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Active Subscriptions
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{dashboardStats.activeSubscriptions.toLocaleString()}</div>
                        <p className="text-xs text-green-600 flex items-center mt-1">
                          <span className="h-2 w-2 bg-green-500 rounded-full mr-1"></span>
                          +5% from last month
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Content Views
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{dashboardStats.contentViews.toLocaleString()}</div>
                        <p className="text-xs text-green-600 flex items-center mt-1">
                          <span className="h-2 w-2 bg-green-500 rounded-full mr-1"></span>
                          +22% from last month
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Revenue
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">${dashboardStats.revenue.toLocaleString()}</div>
                        <p className="text-xs text-green-600 flex items-center mt-1">
                          <span className="h-2 w-2 bg-green-500 rounded-full mr-1"></span>
                          +18% from last month
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Recent Users</CardTitle>
                          <CardDescription>
                            Users who joined recently
                          </CardDescription>
                        </div>
                        <Badge variant="outline">
                          {recentUsers.length} users
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      {dashboardLoading ? (
                        <div className="p-6">
                          {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex items-center justify-between py-3 border-b last:border-0">
                              <div className="space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-48" />
                              </div>
                              <Skeleton className="h-3 w-16" />
                            </div>
                          ))}
                        </div>
                      ) : recentUsers.length === 0 ? (
                        <div className="p-6 text-center text-muted-foreground">
                          <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No recent users found</p>
                        </div>
                      ) : (
                        <table className="w-full">
                          <thead className="border-b bg-muted/30">
                            <tr className="text-xs text-muted-foreground font-medium">
                              <th className="text-left p-3">Name</th>
                              <th className="text-left p-3">Role</th>
                              <th className="text-left p-3 hidden md:table-cell">Joined</th>
                            </tr>
                          </thead>
                          <tbody>
                            {recentUsers.map((user) => (
                              <tr key={user.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                                <td className="p-3">
                                  <div className="font-medium">{user.display_name || `${user.first_name} ${user.last_name}` || 'No name'}</div>
                                  <div className="text-xs text-muted-foreground truncate max-w-[200px]">{user.email}</div>
                                </td>
                                <td className="p-3">
                                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                    user.role === 'admin' || user.is_admin
                                      ? 'bg-gold/10 text-gold'
                                      : user.role === 'tutor'
                                      ? 'bg-blue-500/10 text-blue-600'
                                      : 'bg-muted text-muted-foreground'
                                  }`}>
                                    {user.role || 'user'} {user.is_admin && ' (admin)'}
                                  </span>
                                </td>
                                <td className="p-3 hidden md:table-cell text-sm">
                                  {new Date(user.created_at).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </CardContent>
                    <CardFooter className="border-t p-3">
                      <Button 
                        variant="link" 
                        className="text-gold h-auto p-0"
                        onClick={() => setActiveTab("users")}
                      >
                        View all users →
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Recent Content</CardTitle>
                          <CardDescription>
                            Recently added content
                          </CardDescription>
                        </div>
                        <Badge variant="outline">
                          {recentContent.length} items
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      {dashboardLoading ? (
                        <div className="p-6">
                          {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex items-center justify-between py-3 border-b last:border-0">
                              <div className="space-y-2">
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="h-3 w-24" />
                              </div>
                              <Skeleton className="h-3 w-16" />
                            </div>
                          ))}
                        </div>
                      ) : recentContent.length === 0 ? (
                        <div className="p-6 text-center text-muted-foreground">
                          <Music className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No recent content found</p>
                        </div>
                      ) : (
                        <table className="w-full">
                          <thead className="border-b bg-muted/30">
                            <tr className="text-xs text-muted-foreground font-medium">
                              <th className="text-left p-3">Title</th>
                              <th className="text-left p-3">Type</th>
                              <th className="text-left p-3 hidden md:table-cell">Created</th>
                            </tr>
                          </thead>
                          <tbody>
                            {recentContent.map((content) => (
                              <tr key={content.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                                <td className="p-3">
                                  <div className="font-medium truncate max-w-[180px]">{content.title}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {content.views ? `${content.views} views` : 
                                    content.enrollments ? `${content.enrollments} enrollments` :
                                    content.plays ? `${content.plays} plays` :
                                    content.downloads ? `${content.downloads} downloads` : 'No engagement yet'}
                                  </div>
                                </td>
                                <td className="p-3">
                                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                    content.type === 'video'
                                      ? 'bg-red-500/10 text-red-600'
                                      : content.type === 'audio'
                                      ? 'bg-purple-500/10 text-purple-600'
                                      : content.type === 'course'
                                      ? 'bg-green-500/10 text-green-600'
                                      : 'bg-muted text-muted-foreground'
                                  }`}>
                                    {content.type}
                                  </span>
                                </td>
                                <td className="p-3 hidden md:table-cell text-sm">
                                  {new Date(content.created_at).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </CardContent>
                    <CardFooter className="border-t p-3">
                      <Button 
                        variant="link" 
                        className="text-gold h-auto p-0"
                        onClick={() => setActiveTab("content")}
                      >
                        View all content →
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
                
                {/* Admin Status Card */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">Admin Status</h3>
                        <p className="text-sm text-muted-foreground">
                          Your current admin permissions and access
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        ACTIVE
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Admin Level</p>
                        <p className="font-medium">{isFixedAdmin ? 'Fixed Admin' : (adminStatus?.role || 'Admin')}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="font-medium truncate">{adminStatus?.email || 'Administrator'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Subscription</p>
                        <p className="font-medium">{adminStatus?.subscription_tier || 'Professional'}</p>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        <strong>Access Type:</strong> {isFixedAdmin ? 'Fixed Admin Credentials' : 'Supabase Admin'}
                        <br />
                        <strong>Session:</strong> Valid until browser close
                        <br />
                        <strong>Permissions:</strong> Full administrative access
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* USERS TAB */}
              <TabsContent value="users">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-2xl font-bold">User Management</h1>
                      <p className="text-muted-foreground">
                        Manage all registered users and their permissions
                      </p>
                    </div>
                    <Button className="bg-gold hover:bg-gold/90 text-white">
                      <Users className="h-4 w-4 mr-2" />
                      Add New User
                    </Button>
                  </div>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <CardTitle>All Users</CardTitle>
                          <CardDescription>
                            Manage and monitor all registered users
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input 
                            placeholder="Search users by name, email, or role..." 
                            className="w-full md:w-64" 
                            value={usersSearch}
                            onChange={(e) => {
                              setUsersSearch(e.target.value);
                              setUsersPage(1);
                            }}
                          />
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={fetchUsers}
                            disabled={usersLoading}
                          >
                            <RefreshCw className={`h-4 w-4 ${usersLoading ? 'animate-spin' : ''}`} />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      {usersLoading ? (
                        <div className="p-6">
                          {[...Array(8)].map((_, i) => (
                            <div key={i} className="flex items-center justify-between py-3 border-b last:border-0">
                              <div className="space-y-2">
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="h-3 w-56" />
                              </div>
                              <Skeleton className="h-3 w-24" />
                              <Skeleton className="h-3 w-16" />
                              <div className="flex gap-2">
                                <Skeleton className="h-8 w-16" />
                                <Skeleton className="h-8 w-16" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : users.length === 0 ? (
                        <div className="p-6 text-center text-muted-foreground">
                          <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
                          <h3 className="font-medium mb-1">No users found</h3>
                          <p className="text-sm">
                            {usersSearch ? 'Try a different search term' : 'No users in the system yet'}
                          </p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="border-b bg-muted/30">
                              <tr className="text-xs text-muted-foreground font-medium">
                                <th className="text-left p-3">Name</th>
                                <th className="text-left p-3">Email</th>
                                <th className="text-left p-3">Role</th>
                                <th className="text-left p-3">Joined</th>
                                <th className="text-left p-3">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {users.map((user) => (
                                <tr key={user.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                                  <td className="p-3 font-medium">
                                    <div className="flex items-center gap-2">
                                      {user.display_name || `${user.first_name} ${user.last_name}` || 'No name'}
                                      {user.is_admin && (
                                        <Badge variant="outline" className="text-xs bg-gold/10 text-gold border-gold/20">
                                          Admin
                                        </Badge>
                                      )}
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    <div className="truncate max-w-[200px]">{user.email}</div>
                                  </td>
                                  <td className="p-3">
                                    <Badge variant="outline" className={
                                      user.role === 'admin' 
                                        ? 'bg-gold/10 text-gold border-gold/20'
                                        : user.role === 'tutor'
                                        ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                                        : ''
                                    }>
                                      {user.role || 'user'}
                                    </Badge>
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {user.subscription_tier || 'free'}
                                    </div>
                                  </td>
                                  <td className="p-3 text-sm">
                                    {new Date(user.created_at).toLocaleDateString()}
                                  </td>
                                  <td className="p-3">
                                    <div className="flex items-center gap-2">
                                      <Button variant="ghost" size="sm">Edit</Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => handleDeleteUser(user.id)}
                                      >
                                        Delete
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="border-t p-3 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-sm text-muted-foreground">
                        Showing {Math.min(usersPerPage, users.length)} of {totalUsersCount} users
                        {usersSearch && ` • Search: "${usersSearch}"`}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          disabled={usersPage === 1}
                          onClick={() => setUsersPage(usersPage - 1)}
                        >
                          Previous
                        </Button>
                        <span className="text-sm px-2">
                          Page {usersPage} of {Math.ceil(totalUsersCount / usersPerPage)}
                        </span>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          disabled={usersPage * usersPerPage >= totalUsersCount}
                          onClick={() => setUsersPage(usersPage + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                </div>
              </TabsContent>
              
              {/* CONTENT TAB */}
              <TabsContent value="content">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-2xl font-bold">Content Management</h1>
                      <p className="text-muted-foreground">
                        Manage lessons, music, and educational materials
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline"
                        onClick={fetchContent}
                        disabled={contentLoading}
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${contentLoading ? 'animate-spin' : ''}`} />
                        Refresh
                      </Button>
                      <Button className="bg-gold hover:bg-gold/90 text-white">
                        <Upload className="h-4 w-4 mr-2" />
                        Add New Content
                      </Button>
                    </div>
                  </div>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <CardTitle>All Content</CardTitle>
                          <CardDescription>
                            Manage lessons, music, and educational materials
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input 
                            placeholder="Search content..." 
                            className="w-full md:w-64" 
                            value={contentSearch}
                            onChange={(e) => {
                              setContentSearch(e.target.value);
                              setContentPage(1);
                            }}
                          />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      {contentLoading ? (
                        <div className="p-6">
                          {[...Array(8)].map((_, i) => (
                            <div key={i} className="flex items-center justify-between py-3 border-b last:border-0">
                              <div className="space-y-2">
                                <Skeleton className="h-4 w-48" />
                                <Skeleton className="h-3 w-24" />
                              </div>
                              <Skeleton className="h-3 w-16" />
                              <Skeleton className="h-3 w-24" />
                              <div className="flex gap-2">
                                <Skeleton className="h-8 w-16" />
                                <Skeleton className="h-8 w-16" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : allContent.length === 0 ? (
                        <div className="p-6 text-center text-muted-foreground">
                          <Music className="h-12 w-12 mx-auto mb-4 opacity-30" />
                          <h3 className="font-medium mb-1">No content found</h3>
                          <p className="text-sm">
                            {contentSearch ? 'Try a different search term' : 'No content in the system yet'}
                          </p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="border-b bg-muted/30">
                              <tr className="text-xs text-muted-foreground font-medium">
                                <th className="text-left p-3">Title</th>
                                <th className="text-left p-3">Type</th>
                                <th className="text-left p-3">Engagement</th>
                                <th className="text-left p-3">Created</th>
                                <th className="text-left p-3">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {paginatedContent.map((item) => (
                                <tr key={item.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                                  <td className="p-3 font-medium">
                                    <div className="truncate max-w-[200px]">{item.title}</div>
                                  </td>
                                  <td className="p-3">
                                    <Badge variant="outline" className={
                                      item.type === 'video'
                                        ? 'bg-red-500/10 text-red-600 border-red-500/20'
                                        : item.type === 'audio'
                                        ? 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                                        : item.type === 'course'
                                        ? 'bg-green-500/10 text-green-600 border-green-500/20'
                                        : ''
                                    }>
                                      {item.type}
                                    </Badge>
                                  </td>
                                  <td className="p-3">
                                    <div className="text-sm">
                                      {item.views ? `${item.views.toLocaleString()} views` : 
                                      item.enrollments ? `${item.enrollments.toLocaleString()} enrollments` :
                                      item.plays ? `${item.plays.toLocaleString()} plays` :
                                      item.downloads ? `${item.downloads.toLocaleString()} downloads` : 'N/A'}
                                    </div>
                                  </td>
                                  <td className="p-3 text-sm">
                                    {new Date(item.created_at).toLocaleDateString()}
                                  </td>
                                  <td className="p-3">
                                    <div className="flex items-center gap-2">
                                      <Button variant="outline" size="sm">Edit</Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
                                        onClick={() => handleDeleteContent(item.id, item.type)}
                                      >
                                        Delete
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="border-t p-3 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-sm text-muted-foreground">
                        Showing {Math.min(contentPerPage, paginatedContent.length)} of {totalContentCount} content items
                        {contentSearch && ` • Search: "${contentSearch}"`}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          disabled={contentPage === 1}
                          onClick={() => setContentPage(contentPage - 1)}
                        >
                          Previous
                        </Button>
                        <span className="text-sm px-2">
                          Page {contentPage} of {Math.ceil(totalContentCount / contentPerPage)}
                        </span>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          disabled={contentPage * contentPerPage >= totalContentCount}
                          onClick={() => setContentPage(contentPage + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                </div>
              </TabsContent>
              
              {/* FEATURED ITEMS TAB */}
              <TabsContent value="featured" className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold">Featured Items</h1>
                    <p className="text-muted-foreground">
                      Manage featured content that appears on the homepage carousel
                    </p>
                  </div>
                  <Button 
                    onClick={() => setEditingItem({
                      id: '',
                      title: '',
                      description: '',
                      image: '',
                      link: '',
                      is_external: false,
                      order: featuredItems.length
                    })}
                    className="bg-gold hover:bg-gold/90 text-white"
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Add New Featured Item
                  </Button>
                </div>

                {editingItem ? (
                  <FeaturedItemForm 
                    item={editingItem}
                    onSave={handleSaveFeaturedItem}
                    onCancel={() => setEditingItem(null)}
                  />
                ) : itemsLoading ? (
                  <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p>Loading featured items...</p>
                  </div>
                ) : featuredItems.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="font-medium text-lg mb-2">No featured items yet</h3>
                      <p className="text-muted-foreground mb-6">
                        Create your first featured item to display on the homepage carousel
                      </p>
                      <Button 
                        className="bg-gold hover:bg-gold/90 text-white"
                        onClick={() => setEditingItem({
                          id: '',
                          title: '',
                          description: '',
                          image: '',
                          link: '',
                          is_external: false,
                          order: 0
                        })}
                      >
                        <Star className="h-4 w-4 mr-2" />
                        Create First Featured Item
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>Featured Items ({featuredItems.length})</CardTitle>
                            <CardDescription>
                              Drag and drop to reorder. Items appear in this order on the homepage.
                            </CardDescription>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchFeaturedItems}
                            disabled={itemsLoading}
                          >
                            <RefreshCw className={`h-3 w-3 mr-1 ${itemsLoading ? 'animate-spin' : ''}`} />
                            Refresh
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="border-b bg-muted/30">
                              <tr className="text-xs text-muted-foreground font-medium">
                                <th className="text-left p-3 w-10"></th>
                                <th className="text-left p-3">Title</th>
                                <th className="text-left p-3">Image</th>
                                <th className="text-left p-3">Link</th>
                                <th className="text-left p-3">Actions</th>
                              </tr>
                            </thead>
                            <SortableContext 
                              items={featuredItems.map(item => item.id)}
                              strategy={verticalListSortingStrategy}
                            >
                              <tbody>
                                {featuredItems.map((item, index) => (
                                  <SortableRow 
                                    key={item.id} 
                                    item={item} 
                                    onEdit={setEditingItem} 
                                    onDelete={handleDeleteFeaturedItem} 
                                  />
                                ))}
                              </tbody>
                            </SortableContext>
                          </table>
                        </div>
                      </CardContent>
                      <CardFooter className="border-t p-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4" />
                          <span>Drag handle to reorder items</span>
                        </div>
                      </CardFooter>
                    </Card>
                  </DndContext>
                )}
              </TabsContent>
              
              {/* UPLOAD TAB */}
              <TabsContent value="upload" className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold">Content Upload</h1>
                    <p className="text-muted-foreground">
                      Upload new content to the platform
                    </p>
                  </div>
                </div>
                
                <AdminUpload />
              </TabsContent>

              {/* AI SETTINGS TAB */}
              <TabsContent value="ai-settings">
                <AISettingsTab />
              </TabsContent>
              
              {/* ADMIN TOOLS TAB */}
              <TabsContent value="admin-tools">
                <AdminToolsTab />
              </TabsContent>
              
              {/* OTHER TABS */}
              {['schedule', 'notifications', 'reports', 'settings'].map((tab) => (
                <TabsContent key={tab} value={tab}>
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="bg-muted p-4 rounded-full mb-4">
                      {tab === 'schedule' && <Calendar className="h-8 w-8 text-gold" />}
                      {tab === 'notifications' && <Bell className="h-8 w-8 text-gold" />}
                      {tab === 'reports' && <FileText className="h-8 w-8 text-gold" />}
                      {tab === 'settings' && <Settings className="h-8 w-8 text-gold" />}
                    </div>
                    <h2 className="text-2xl font-bold mb-2 capitalize">{tab.replace('-', ' ')}</h2>
                    <p className="text-muted-foreground text-center max-w-md">
                      This section is currently under development. Check back soon for updates!
                    </p>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </main>
      </div>
      
      {/* Mobile bottom navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t p-2 z-50">
        <div className="flex justify-around">
          {NAV_ITEMS.slice(0, 5).map((item) => (
            <Button
              key={item.value}
              variant="ghost"
              size="icon"
              className={`rounded-full ${
                activeTab === item.value ? 'bg-gold/10 text-gold' : ''
              }`}
              onClick={() => setActiveTab(item.value)}
            >
              <item.icon className="h-5 w-5" />
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Admin;
