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
  AlertCircle
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Logo from "@/components/branding/Logo";
import AdminUpload from "@/components/admin/AdminUpload";
import { useFeaturedItems } from "@/context/FeaturedItemsContext";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
  subscription_tier: string;
  created_at: string;
  avatar_url?: string;
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

// Error handler with admin-specific messages
const handleSupabaseError = (error: any, context: string) => {
  console.error(`Supabase Error (${context}):`, {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint
  });
  
  // Admin-specific error messages
  let userMessage = error.message;
  if (error.code === '42501') {
    userMessage = "Permission denied. Your admin role may not be properly configured. Please check your admin status in the database.";
  } else if (error.code === 'PGRST301') {
    userMessage = "Row-level security policy violation. Admin permissions not detected.";
  }
  
  toast({
    title: `Database Error: ${context}`,
    description: userMessage,
    variant: "destructive",
    duration: 5000
  });
  
  return userMessage;
};

// Feature item form with proper admin validation
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
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async () => {
    if (!imageFile) {
      toast({ title: "Please select an image file first" });
      return;
    }
    
    try {
      setUploading(true);
      
      // Validate file
      if (imageFile.size > 5 * 1024 * 1024) { // 5MB limit
        toast({ 
          title: "File too large", 
          description: "Maximum file size is 5MB",
          variant: "destructive"
        });
        return;
      }
      
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `featured/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('featured-images')
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: imageFile.type
        });
      
      if (uploadError) {
        handleSupabaseError(uploadError, 'image upload');
        return;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('featured-images')
        .getPublicUrl(filePath);
      
      setFormData(prev => ({ ...prev, image: publicUrl }));
      toast({ 
        title: "Image uploaded successfully!",
        description: "Click Save to apply changes"
      });
    } catch (error: any) {
      toast({ 
        title: "Image upload failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.description || !formData.image || !formData.link) {
      toast({
        title: "Validation Error",
        description: "All fields marked with * are required",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{item.id ? 'Edit Featured Item' : 'Create Featured Item'}</CardTitle>
        <CardDescription>
          {item.id ? 'Update the featured item details' : 'Add a new item to the featured section'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800">Admin Required</AlertTitle>
            <AlertDescription className="text-blue-700">
              You must have admin privileges to create or edit featured items.
            </AlertDescription>
          </Alert>
          
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter item title"
              required
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter detailed description"
              required
              rows={3}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="image">Image *</Label>
            <div className="space-y-2 mt-1">
              {formData.image && (
                <div className="flex items-center gap-3 mb-2">
                  <img 
                    src={formData.image} 
                    alt="Preview" 
                    className="w-20 h-20 object-cover rounded-md border shadow-sm" 
                  />
                  <div className="text-sm text-gray-500">
                    Current image
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
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
                  {uploading ? "Uploading..." : "Upload"}
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Upload a high-quality image (max 5MB). Supported formats: JPG, PNG, WebP
              </p>
            </div>
          </div>
          
          <div>
            <Label htmlFor="link">Link *</Label>
            <Input
              id="link"
              name="link"
              value={formData.link}
              onChange={handleChange}
              placeholder="Enter URL or path (e.g., /courses or https://example.com)"
              required
              className="mt-1"
            />
          </div>
          
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="is_external"
              name="is_external"
              checked={formData.is_external || false}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, is_external: !!checked }))
              }
            />
            <Label htmlFor="is_external" className="text-sm font-medium">
              Open in new tab (external link)
            </Label>
          </div>
          
          <div className="flex gap-2 pt-4 border-t">
            <Button 
              type="button" 
              className="bg-gold hover:bg-gold/90 text-white"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save"}
            </Button>
            <Button 
              variant="outline" 
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Sortable row component
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
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr 
      ref={setNodeRef}
      style={style}
      className="border-b hover:bg-muted/50 transition-colors"
    >
      <td 
        className="p-3 cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </td>
      <td className="p-3 font-medium">{item.title}</td>
      <td className="p-3">
        <img 
          src={item.image} 
          alt={item.title}
          className="w-16 h-10 object-cover rounded shadow-sm"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://via.placeholder.com/64x40?text=No+Image";
          }}
        />
      </td>
      <td className="p-3">
        <div className="max-w-xs truncate text-sm text-gray-600">
          {item.link}
          {item.is_external && (
            <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
              External
            </span>
          )}
        </div>
      </td>
      <td className="p-3">
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onEdit(item)}
            className="h-8 px-3"
          >
            Edit
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 px-3 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(item.id)}
          >
            Delete
          </Button>
        </div>
      </td>
    </tr>
  );
};

// AI Settings Tab
const AISettingsTab = () => {
  const { settings, isLoading, updateSettings } = useAISettings();
  const [localSettings, setLocalSettings] = useState(settings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleToggle = async (field: string, value: boolean) => {
    if (!localSettings) return;
    
    const updated = { ...localSettings, [field]: value };
    setLocalSettings(updated);
    
    setSaving(true);
    try {
      await updateSettings({ [field]: value });
      toast({
        title: "AI Settings Updated",
        description: `${field.replace('_', ' ')} has been ${value ? 'enabled' : 'disabled'}.`
      });
    } catch (error: any) {
      handleSupabaseError(error, 'update AI settings');
      setLocalSettings(settings); // Revert on error
    } finally {
      setSaving(false);
    }
  };

  const handleTierToggle = async (tier: string) => {
    if (!localSettings) return;
    
    const currentTiers = localSettings.allowed_tiers || [];
    const updatedTiers = currentTiers.includes(tier)
      ? currentTiers.filter(t => t !== tier)
      : [...currentTiers, tier];
    
    const updated = { ...localSettings, allowed_tiers: updatedTiers };
    setLocalSettings(updated);
    
    setSaving(true);
    try {
      await updateSettings({ allowed_tiers: updatedTiers });
      toast({
        title: "Access Updated",
        description: `${tier.charAt(0).toUpperCase() + tier.slice(1)} tier ${updatedTiers.includes(tier) ? 'granted' : 'revoked'} AI access.`
      });
    } catch (error: any) {
      handleSupabaseError(error, 'update AI tiers');
      setLocalSettings(settings);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !localSettings) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
          <p className="mt-4 text-gray-500">Loading AI settings...</p>
        </CardContent>
      </Card>
    );
  }

  const tiers = ['free', 'basic', 'premium', 'professional'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Feature Settings</h1>
          <p className="text-sm text-muted-foreground">
            Control who can access the AI assistant feature
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            variant={localSettings.is_enabled ? "default" : "secondary"}
            className="text-sm"
          >
            {localSettings.is_enabled ? "Enabled" : "Disabled"}
          </Badge>
          {saving && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gold"></div>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>SaemsTunes AI Controls</CardTitle>
          <CardDescription>
            Configure AI assistant permissions and accessibility
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
              <Label htmlFor="ai-enabled" className="text-base font-medium">Enable AI Feature</Label>
              <p className="text-sm text-muted-foreground">
                Turn the entire AI assistant feature on or off globally
              </p>
            </div>
            <Switch
              id="ai-enabled"
              checked={localSettings.is_enabled}
              onCheckedChange={(checked) => handleToggle('is_enabled', checked)}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
              <Label htmlFor="require-subscription" className="text-base font-medium">Require Subscription</Label>
              <p className="text-sm text-muted-foreground">
                Only allow subscribed users to access AI features
              </p>
            </div>
            <Switch
              id="require-subscription"
              checked={localSettings.require_subscription}
              onCheckedChange={(checked) => handleToggle('require_subscription', checked)}
              disabled={saving}
            />
          </div>

          <div className="p-4 rounded-lg border space-y-4">
            <div>
              <Label className="text-base font-medium">Allowed Subscription Tiers</Label>
              <p className="text-sm text-muted-foreground">
                Select which subscription tiers can access the AI feature
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {tiers.map((tier) => (
                <Badge
                  key={tier}
                  variant={localSettings.allowed_tiers?.includes(tier) ? "default" : "outline"}
                  className="cursor-pointer capitalize px-3 py-1.5 text-sm"
                  onClick={() => handleTierToggle(tier)}
                >
                  {tier}
                  {localSettings.allowed_tiers?.includes(tier) && (
                    <span className="ml-1">✓</span>
                  )}
                </Badge>
              ))}
            </div>
          </div>

          <div className="bg-muted/30 p-4 rounded-lg border">
            <h4 className="font-medium mb-2 text-gray-700">Current Configuration</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">AI Feature Status:</span>
                <span className={`font-medium ${localSettings.is_enabled ? 'text-green-600' : 'text-red-600'}`}>
                  {localSettings.is_enabled ? 'ENABLED' : 'DISABLED'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Requires Subscription:</span>
                <span className="font-medium">
                  {localSettings.require_subscription ? 'YES' : 'NO'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Allowed Tiers:</span>
                <span className="font-medium">
                  {localSettings.allowed_tiers?.join(", ") || "None"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated:</span>
                <span className="font-medium">
                  {new Date(localSettings.updated_at || localSettings.created_at || '').toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Main Admin Component
const Admin = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [editingItem, setEditingItem] = useState<FeaturedItem | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(false);
  const { featuredItems, loading, refreshItems } = useFeaturedItems();
  
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

  // Check admin status on component mount
  useEffect(() => {
    const checkAdminStatus = async () => {
      const adminAuth = sessionStorage.getItem('adminAuth');
      if (adminAuth === 'true') {
        setCheckingAdmin(true);
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            // Verify user is actually admin in database
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('is_admin, role')
              .eq('id', user.id)
              .single();

            if (!error && (profile.is_admin || profile.role === 'admin')) {
              setIsAuthenticated(true);
            } else {
              // Not admin in database, clear session
              sessionStorage.removeItem('adminAuth');
              toast({
                title: "Admin Access Revoked",
                description: "Your admin privileges have been removed from the database.",
                variant: "destructive"
              });
            }
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
        } finally {
          setCheckingAdmin(false);
        }
      }
    };

    checkAdminStatus();
  }, []);

  // Fetch dashboard data when authenticated
  useEffect(() => {
    if (isAuthenticated && activeTab === 'dashboard') {
      fetchDashboardData();
    }
  }, [isAuthenticated, activeTab]);

  // Fetch users when users tab is active
  useEffect(() => {
    if (isAuthenticated && activeTab === 'users') {
      fetchUsers();
    }
  }, [isAuthenticated, activeTab, usersPage, usersSearch]);

  // Fetch content when content tab is active
  useEffect(() => {
    if (isAuthenticated && activeTab === 'content') {
      fetchContent();
    }
  }, [isAuthenticated, activeTab, contentPage, contentSearch]);

  // Fetch dashboard data function
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
        supabase.rpc('get_total_content_views'),
        supabase.rpc('get_current_month_revenue'),
        supabase
          .from('profiles')
          .select('id, first_name, last_name, email, role, is_admin, created_at')
          .order('created_at', { ascending: false })
          .limit(4),
        supabase.rpc('get_recent_content', { limit_count: 4 })
      ]);

      if (totalUsersRes.error) handleSupabaseError(totalUsersRes.error, 'total users');
      if (activeSubscriptionsRes.error) handleSupabaseError(activeSubscriptionsRes.error, 'active subscriptions');
      if (contentViewsRes.error) handleSupabaseError(contentViewsRes.error, 'content views');
      if (revenueRes.error) handleSupabaseError(revenueRes.error, 'revenue');
      if (usersRes.error) handleSupabaseError(usersRes.error, 'recent users');
      if (contentRes.error) handleSupabaseError(contentRes.error, 'recent content');

      setDashboardStats({
        totalUsers: totalUsersRes.count || 0,
        activeSubscriptions: activeSubscriptionsRes.count || 0,
        contentViews: contentViewsRes.data?.[0]?.total_views || 0,
        revenue: revenueRes.data?.[0]?.total_revenue || 0
      });
      
      setRecentUsers(usersRes.data || []);
      setRecentContent(contentRes.data || []);
    } catch (error: any) {
      toast({ 
        title: "Failed to load dashboard data",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setDashboardLoading(false);
    }
  };

  // Fetch users function
  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      let query = supabase
        .from('profiles')
        .select('id, first_name, last_name, email, role, is_admin, subscription_tier, created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((usersPage - 1) * usersPerPage, usersPage * usersPerPage - 1);

      if (usersSearch) {
        query = query.or(`first_name.ilike.%${usersSearch}%,last_name.ilike.%${usersSearch}%,email.ilike.%${usersSearch}%`);
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

  // Fetch content function
  const fetchContent = async () => {
    setContentLoading(true);
    try {
      const [
        videosRes,
        audioRes,
        coursesRes
      ] = await Promise.all([
        supabase.from('video_content').select('id, title, created_at, approved'),
        supabase.from('tracks').select('id, title, created_at, approved'),
        supabase.from('courses').select('id, title, created_at')
      ]);

      if (videosRes.error) handleSupabaseError(videosRes.error, 'fetch videos');
      if (audioRes.error) handleSupabaseError(audioRes.error, 'fetch audio');
      if (coursesRes.error) handleSupabaseError(coursesRes.error, 'fetch courses');

      const videos = videosRes.data?.map(item => ({
        ...item,
        type: 'video',
        views: 0,
        created_at: new Date(item.created_at).toISOString(),
        approved: item.approved || false
      })) || [];

      const audio = audioRes.data?.map(item => ({
        ...item,
        type: 'audio',
        plays: 0,
        created_at: new Date(item.created_at).toISOString(),
        approved: item.approved || false
      })) || [];

      const courses = coursesRes.data?.map(item => ({
        ...item,
        type: 'course',
        enrollments: 0,
        created_at: new Date(item.created_at).toISOString()
      })) || [];

      // Get statistics for each content type
      const [
        videoStatsRes,
        audioStatsRes,
        courseStatsRes
      ] = await Promise.all([
        supabase.rpc('get_video_view_counts'),
        supabase.rpc('get_audio_play_counts'),
        supabase.rpc('get_course_enrollment_counts')
      ]);

      const videoStats = videoStatsRes.data?.reduce((acc, curr) => {
        acc[curr.video_content_id] = curr.view_count;
        return acc;
      }, {} as Record<string, number>) || {};

      const audioStats = audioStatsRes.data?.reduce((acc, curr) => {
        acc[curr.track_id] = curr.play_count;
        return acc;
      }, {} as Record<string, number>) || {};

      const courseStats = courseStatsRes.data?.reduce((acc, curr) => {
        acc[curr.learning_path_id] = curr.enrollment_count;
        return acc;
      }, {} as Record<string, number>) || {};

      const combinedContent = [
        ...videos.map(video => ({
          ...video,
          views: videoStats[video.id] || 0
        })),
        ...audio.map(track => ({
          ...track,
          plays: audioStats[track.id] || 0
        })),
        ...courses.map(course => ({
          ...course,
          enrollments: courseStats[course.id] || 0
        }))
      ];

      // Sort by creation date
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

  // Handle admin login with proper Supabase auth
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    try {
      // First, sign in with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: loginForm.username,
        password: loginForm.password,
      });

      if (authError) {
        setLoginError(`Authentication failed: ${authError.message}`);
        return;
      }

      if (!authData.user) {
        setLoginError('No user data returned');
        return;
      }

      // Verify user is admin in database
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin, role')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        setLoginError('Failed to fetch user profile');
        await supabase.auth.signOut();
        return;
      }

      // Check both is_admin column and role column
      const isUserAdmin = profile.is_admin || profile.role === 'admin';
      
      if (!isUserAdmin) {
        setLoginError('User does not have admin privileges. Please contact an administrator.');
        await supabase.auth.signOut();
        return;
      }

      // Set authenticated state
      setIsAuthenticated(true);
      sessionStorage.setItem('adminAuth', 'true');
      
      toast({
        title: "Admin Access Granted",
        description: `Welcome, ${authData.user.email}`,
      });

    } catch (error: any) {
      setLoginError(`Login failed: ${error.message}`);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      sessionStorage.removeItem('adminAuth');
      setIsAuthenticated(false);
      setLoginForm({ username: '', password: '' });
      
      toast({
        title: "Logged out successfully",
        description: "You have been signed out of the admin panel.",
      });
    } catch (error: any) {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Handle saving featured items with RPC function
  const handleSaveFeaturedItem = async (item: FeaturedItem) => {
    try {
      if (item.id) {
        // Update existing item using RPC function
        const { error } = await supabase.rpc('admin_update_featured_item', {
          p_id: item.id,
          p_title: item.title,
          p_description: item.description,
          p_image: item.image,
          p_link: item.link,
          p_is_external: item.is_external || false,
          p_order: item.order || 0
        });
        
        if (error) {
          handleSupabaseError(error, 'update featured item');
          return;
        }
      } else {
        // Create new item using RPC function
        const { data, error } = await supabase.rpc('admin_create_featured_item', {
          p_title: item.title,
          p_description: item.description,
          p_image: item.image,
          p_link: item.link,
          p_is_external: item.is_external || false,
          p_order: featuredItems.length
        });

        if (error) {
          handleSupabaseError(error, 'create featured item');
          return;
        }
        
        // Update local item with new ID
        item.id = data;
      }
      
      // Refresh the items list
      await refreshItems();
      setEditingItem(null);
      
      toast({ 
        title: "Success!",
        description: item.id ? "Featured item updated successfully!" : "New featured item created!",
      });
      
    } catch (error: any) {
      toast({ 
        title: "Failed to save featured item",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Handle deleting featured items with RPC function
  const handleDeleteFeaturedItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this featured item? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase.rpc('admin_delete_featured_item', {
        p_id: id
      });

      if (error) {
        handleSupabaseError(error, 'delete featured item');
        return;
      }
      
      // Refresh the items list
      await refreshItems();
      
      toast({ 
        title: "Success!",
        description: "Featured item deleted successfully.",
      });
      
    } catch (error: any) {
      toast({ 
        title: "Failed to delete featured item",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Handle reordering featured items
  const handleReorder = async (startIndex: number, endIndex: number) => {
    const items = [...featuredItems];
    const [removed] = items.splice(startIndex, 1);
    items.splice(endIndex, 0, removed);
    
    // Update order for all items
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index
    }));

    try {
      // Use RPC function for bulk update
      const { error } = await supabase.rpc('admin_reorder_featured_items', {
        p_items: JSON.stringify(updatedItems.map(item => ({
          id: item.id,
          order: item.order
        })))
      });
      
      if (error) {
        handleSupabaseError(error, 'reorder items');
        return;
      }
      
      // Refresh the items list
      await refreshItems();
      
    } catch (error: any) {
      toast({ 
        title: "Failed to reorder items",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Set up drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (active && over && active.id !== over.id) {
      const oldIndex = featuredItems.findIndex(item => item.id === active.id);
      const newIndex = featuredItems.findIndex(item => item.id === over.id);
      handleReorder(oldIndex, newIndex);
    }
  };

  // Handle deleting user
  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) {
        handleSupabaseError(error, 'delete user');
        return;
      }
      
      // Refresh users list
      await fetchUsers();
      
      toast({ 
        title: "Success!",
        description: "User deleted successfully.",
      });
      
    } catch (error: any) {
      toast({ 
        title: "Failed to delete user",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Handle deleting content
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
          tableName = 'courses';
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
      
      // Refresh content list
      await fetchContent();
      
      toast({ 
        title: "Success!",
        description: `${contentType} deleted successfully.`,
      });
      
    } catch (error: any) {
      toast({ 
        title: "Failed to delete content",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // If checking admin status, show loading
  if (checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gold mb-4"></div>
          <h2 className="text-xl font-semibold">Verifying Admin Access...</h2>
          <p className="text-muted-foreground mt-2">Checking your admin privileges</p>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Logo size="lg" />
            </div>
            <CardTitle className="text-2xl">Admin Portal</CardTitle>
            <CardDescription>
              Enter your administrator credentials to access the admin panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-6 bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800">Admin Access Required</AlertTitle>
              <AlertDescription className="text-amber-700">
                You must have admin privileges in the database to access this panel.
              </AlertDescription>
            </Alert>
            
            <form onSubmit={handleAdminLogin} className="space-y-4">
              {loginError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Login Failed</AlertTitle>
                  <AlertDescription>{loginError}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="username">Admin Email</Label>
                <Input
                  id="username"
                  type="email"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="admin@saemstunes.com"
                  required
                  autoComplete="username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gold hover:bg-gold/90 text-white font-medium"
              >
                Access Admin Panel
              </Button>
            </form>
          </CardContent>
          <CardFooter className="border-t pt-4">
            <p className="text-xs text-center text-muted-foreground w-full">
              This panel requires database-level admin privileges. Contact your database administrator if you need access.
            </p>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Main admin panel layout
  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <header className="bg-background border-b sticky top-0 z-50 shadow-sm">
        <div className="container flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <Logo size="sm" />
            <div className="hidden md:flex items-center gap-2">
              <div className="bg-gold/10 text-gold px-2 py-1 rounded text-xs font-semibold">
                ADMIN PANEL
              </div>
              <div className="text-xs text-muted-foreground">
                v1.0.0 • Production
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative w-full max-w-xs hidden md:block">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search admin panel..." 
                className="pl-9 bg-background border-muted shadow-sm"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium">
                  {user?.email || 'Administrator'}
                </p>
                <p className="text-xs text-muted-foreground">Admin Access</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogout}
                className="hover:bg-destructive/10 hover:text-destructive"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside className="hidden md:block w-64 bg-background border-r p-4">
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <Button
                key={item.value}
                variant={activeTab === item.value ? "secondary" : "ghost"}
                className={`w-full justify-start ${
                  activeTab === item.value 
                    ? "bg-gold/10 text-gold hover:bg-gold/20 border border-gold/20" 
                    : "hover:bg-muted"
                }`}
                onClick={() => setActiveTab(item.value)}
              >
                <item.icon className="mr-2.5 h-4 w-4" />
                {item.label}
                {item.value === "featured" && featuredItems.length > 0 && (
                  <span className="ml-auto text-xs bg-gold/20 text-gold px-1.5 py-0.5 rounded">
                    {featuredItems.length}
                  </span>
                )}
              </Button>
            ))}
          </nav>
          
          <div className="mt-auto pt-6 border-t mt-6">
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>Database:</span>
                <span className="font-medium">PostgreSQL 15.8</span>
              </div>
              <div className="flex justify-between">
                <span>Server:</span>
                <span className="font-medium">Supabase</span>
              </div>
              <div className="flex justify-between">
                <span>Environment:</span>
                <span className="font-medium text-green-600">Production</span>
              </div>
            </div>
          </div>
        </aside>
        
        {/* Mobile tabs */}
        <div className="md:hidden w-full border-b bg-background shadow-sm">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full overflow-x-auto justify-start py-1 h-auto px-2">
              {NAV_ITEMS.slice(0, 4).map((item) => (
                <TabsTrigger 
                  key={item.value} 
                  value={item.value} 
                  className="flex items-center gap-1.5 px-3 py-2 text-xs"
                >
                  <item.icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </TabsTrigger>
              ))}
              <TabsTrigger value="more" className="px-3 py-2 text-xs">
                <span>More</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {/* Main content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Tabs value={activeTab} className="w-full">
            
            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                  <p className="text-sm text-muted-foreground">
                    Overview of your platform's performance and activity
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={fetchDashboardData}
                    disabled={dashboardLoading}
                  >
                    <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${dashboardLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <div className="text-xs text-muted-foreground">
                    {new Date().toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
              
              {dashboardLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader className="pb-2">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                      </CardHeader>
                      <CardContent>
                        <div className="h-6 bg-muted rounded w-1/2 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-3/4"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Users
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{dashboardStats.totalUsers.toLocaleString()}</div>
                      <p className="text-xs text-green-600 flex items-center mt-1">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500 mr-1"></span>
                        +12% from last month
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Active Subscriptions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{dashboardStats.activeSubscriptions.toLocaleString()}</div>
                      <p className="text-xs text-green-600 flex items-center mt-1">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500 mr-1"></span>
                        +5% from last month
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Content Views
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{dashboardStats.contentViews.toLocaleString()}</div>
                      <p className="text-xs text-green-600 flex items-center mt-1">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500 mr-1"></span>
                        +22% from last month
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Monthly Revenue
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">${dashboardStats.revenue.toLocaleString()}</div>
                      <p className="text-xs text-green-600 flex items-center mt-1">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500 mr-1"></span>
                        +18% from last month
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle>Recent Users</CardTitle>
                    <CardDescription>
                      Users who joined recently
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {dashboardLoading ? (
                      <div className="p-6">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="flex items-center justify-between py-3 border-b last:border-0">
                            <div className="space-y-2">
                              <div className="h-4 bg-muted rounded w-32"></div>
                              <div className="h-3 bg-muted rounded w-48"></div>
                            </div>
                            <div className="h-3 bg-muted rounded w-16"></div>
                          </div>
                        ))}
                      </div>
                    ) : recentUsers.length === 0 ? (
                      <div className="p-6 text-center text-muted-foreground">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No recent users found</p>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {recentUsers.map((user) => (
                          <div key={user.id} className="p-4 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">{user.first_name} {user.last_name}</div>
                                <div className="text-sm text-muted-foreground">{user.email}</div>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  user.is_admin || user.role === 'admin' 
                                    ? 'bg-purple-100 text-purple-800'
                                    : user.role === 'tutor'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {user.is_admin || user.role === 'admin' ? 'Admin' : user.role}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(user.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="border-t p-3">
                    <Button 
                      variant="link" 
                      className="text-gold h-auto p-0 font-medium"
                      onClick={() => setActiveTab("users")}
                    >
                      View all users →
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle>Recent Content</CardTitle>
                    <CardDescription>
                      Recently added content
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {dashboardLoading ? (
                      <div className="p-6">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="flex items-center justify-between py-3 border-b last:border-0">
                            <div className="space-y-2">
                              <div className="h-4 bg-muted rounded w-40"></div>
                              <div className="h-3 bg-muted rounded w-24"></div>
                            </div>
                            <div className="h-3 bg-muted rounded w-16"></div>
                          </div>
                        ))}
                      </div>
                    ) : recentContent.length === 0 ? (
                      <div className="p-6 text-center text-muted-foreground">
                        <Music className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No recent content found</p>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {recentContent.map((content) => (
                          <div key={content.id} className="p-4 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="min-w-0 flex-1">
                                <div className="font-medium truncate">{content.title}</div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                    content.type === 'video' 
                                      ? 'bg-red-100 text-red-800'
                                      : content.type === 'audio'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {content.type}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {content.views ? `${content.views} views` : 
                                    content.enrollments ? `${content.enrollments} enrollments` :
                                    content.plays ? `${content.plays} plays` :
                                    content.downloads ? `${content.downloads} downloads` : '0 engagement'}
                                  </span>
                                </div>
                              </div>
                              <div className="text-xs text-gray-500 ml-4 whitespace-nowrap">
                                {new Date(content.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="border-t p-3">
                    <Button 
                      variant="link" 
                      className="text-gold h-auto p-0 font-medium"
                      onClick={() => setActiveTab("content")}
                    >
                      View all content →
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>
            
            {/* Users Tab */}
            <TabsContent value="users">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold">User Management</h1>
                    <p className="text-sm text-muted-foreground">
                      Manage and monitor all registered users
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      onClick={fetchUsers}
                      disabled={usersLoading}
                    >
                      <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${usersLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                    <Button className="bg-gold hover:bg-gold/90 text-white">
                      Add New User
                    </Button>
                  </div>
                </div>
                
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <CardTitle>All Users</CardTitle>
                        <CardDescription>
                          Total users: {totalUsersCount.toLocaleString()}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input 
                          placeholder="Search users by name or email..." 
                          className="w-full md:w-64" 
                          value={usersSearch}
                          onChange={(e) => {
                            setUsersSearch(e.target.value);
                            setUsersPage(1);
                          }}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {usersLoading ? (
                      <div className="p-6">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="flex items-center justify-between py-4 border-b last:border-0">
                            <div className="space-y-2">
                              <div className="h-4 bg-muted rounded w-40"></div>
                              <div className="h-3 bg-muted rounded w-56"></div>
                            </div>
                            <div className="h-3 bg-muted rounded w-24"></div>
                            <div className="h-3 bg-muted rounded w-16"></div>
                            <div className="flex gap-2">
                              <div className="h-8 w-16 bg-muted rounded"></div>
                              <div className="h-8 w-16 bg-muted rounded"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : users.length === 0 ? (
                      <div className="p-8 text-center">
                        <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No users found</h3>
                        <p className="text-gray-500">
                          {usersSearch ? 'Try a different search term' : 'No users registered yet'}
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="border-b bg-muted/30">
                            <tr className="text-xs font-medium text-muted-foreground">
                              <th className="text-left p-4">User</th>
                              <th className="text-left p-4">Email</th>
                              <th className="text-left p-4">Role</th>
                              <th className="text-left p-4">Tier</th>
                              <th className="text-left p-4">Joined</th>
                              <th className="text-left p-4">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {users.map((user) => (
                              <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                                <td className="p-4">
                                  <div className="font-medium">{user.first_name} {user.last_name}</div>
                                </td>
                                <td className="p-4">
                                  <div className="text-sm">{user.email}</div>
                                </td>
                                <td className="p-4">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    user.is_admin || user.role === 'admin' 
                                      ? 'bg-purple-100 text-purple-800'
                                      : user.role === 'tutor'
                                      ? 'bg-blue-100 text-blue-800'
                                      : user.role === 'premium'
                                      ? 'bg-gold/20 text-gold'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {user.is_admin ? 'Admin' : user.role}
                                  </span>
                                </td>
                                <td className="p-4">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    user.subscription_tier === 'professional'
                                      ? 'bg-purple-100 text-purple-800'
                                      : user.subscription_tier === 'premium'
                                      ? 'bg-gold/20 text-gold'
                                      : user.subscription_tier === 'basic'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {user.subscription_tier}
                                  </span>
                                </td>
                                <td className="p-4 text-sm">
                                  {new Date(user.created_at).toLocaleDateString()}
                                </td>
                                <td className="p-4">
                                  <div className="flex items-center gap-2">
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      className="h-8 px-3"
                                    >
                                      Edit
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-8 px-3 text-destructive hover:text-destructive hover:bg-destructive/10"
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
                  {users.length > 0 && (
                    <CardFooter className="border-t p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-sm text-muted-foreground">
                        Showing {((usersPage - 1) * usersPerPage) + 1} to {Math.min(usersPage * usersPerPage, totalUsersCount)} of {totalUsersCount} users
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
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, Math.ceil(totalUsersCount / usersPerPage)) }, (_, i) => {
                            const pageNum = i + 1;
                            return (
                              <Button
                                key={pageNum}
                                variant={usersPage === pageNum ? "default" : "outline"}
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => setUsersPage(pageNum)}
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                        </div>
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
                  )}
                </Card>
              </div>
            </TabsContent>
            
            {/* Content Tab */}
            <TabsContent value="content">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold">Content Management</h1>
                    <p className="text-sm text-muted-foreground">
                      Manage lessons, music, and educational materials
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      onClick={fetchContent}
                      disabled={contentLoading}
                    >
                      <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${contentLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                    <Button className="bg-gold hover:bg-gold/90 text-white">
                      Add New Content
                    </Button>
                  </div>
                </div>
                
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <CardTitle>All Content</CardTitle>
                        <CardDescription>
                          Total items: {totalContentCount.toLocaleString()}
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
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="flex items-center justify-between py-4 border-b last:border-0">
                            <div className="space-y-2">
                              <div className="h-4 bg-muted rounded w-48"></div>
                              <div className="h-3 bg-muted rounded w-24"></div>
                            </div>
                            <div className="h-3 bg-muted rounded w-16"></div>
                            <div className="h-3 bg-muted rounded w-24"></div>
                            <div className="flex gap-2">
                              <div className="h-8 w-16 bg-muted rounded"></div>
                              <div className="h-8 w-16 bg-muted rounded"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : allContent.length === 0 ? (
                      <div className="p-8 text-center">
                        <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No content found</h3>
                        <p className="text-gray-500">
                          {contentSearch ? 'Try a different search term' : 'No content available yet'}
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="border-b bg-muted/30">
                            <tr className="text-xs font-medium text-muted-foreground">
                              <th className="text-left p-4">Title</th>
                              <th className="text-left p-4">Type</th>
                              <th className="text-left p-4">Engagement</th>
                              <th className="text-left p-4">Created</th>
                              <th className="text-left p-4">Status</th>
                              <th className="text-left p-4">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {paginatedContent.map((item) => (
                              <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                                <td className="p-4 font-medium">{item.title}</td>
                                <td className="p-4">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    item.type === 'video' 
                                      ? 'bg-red-100 text-red-800'
                                      : item.type === 'audio'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {item.type}
                                  </span>
                                </td>
                                <td className="p-4">
                                  <div className="text-sm font-medium">
                                    {item.views ? `${item.views} views` : 
                                    item.enrollments ? `${item.enrollments} enrollments` :
                                    item.plays ? `${item.plays} plays` :
                                    item.downloads ? `${item.downloads} downloads` : '0'}
                                  </div>
                                </td>
                                <td className="p-4 text-sm">
                                  {new Date(item.created_at).toLocaleDateString()}
                                </td>
                                <td className="p-4">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    (item as any).approved === false
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-green-100 text-green-800'
                                  }`}>
                                    {(item as any).approved === false ? 'Pending' : 'Approved'}
                                  </span>
                                </td>
                                <td className="p-4">
                                  <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="sm" className="h-8 px-3">
                                      Edit
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-8 px-3 text-destructive hover:text-destructive hover:bg-destructive/10"
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
                  {allContent.length > 0 && (
                    <CardFooter className="border-t p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-sm text-muted-foreground">
                        Showing {((contentPage - 1) * contentPerPage) + 1} to {Math.min(contentPage * contentPerPage, totalContentCount)} of {totalContentCount} items
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
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, Math.ceil(totalContentCount / contentPerPage)) }, (_, i) => {
                            const pageNum = i + 1;
                            return (
                              <Button
                                key={pageNum}
                                variant={contentPage === pageNum ? "default" : "outline"}
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => setContentPage(pageNum)}
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                        </div>
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
                  )}
                </Card>
              </div>
            </TabsContent>
            
            {/* Featured Items Tab */}
            <TabsContent value="featured" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">Featured Items</h1>
                  <p className="text-sm text-muted-foreground">
                    Manage featured content displayed on the homepage
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    onClick={refreshItems}
                    disabled={loading}
                  >
                    <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
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
                    <Star className="h-3.5 w-3.5 mr-1.5" />
                    Add New
                  </Button>
                </div>
              </div>

              {editingItem ? (
                <FeaturedItemForm 
                  item={editingItem}
                  onSave={handleSaveFeaturedItem}
                  onCancel={() => setEditingItem(null)}
                />
              ) : loading ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gold mb-4"></div>
                    <p className="text-gray-500">Loading featured items...</p>
                  </CardContent>
                </Card>
              ) : featuredItems.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Star className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No featured items</h3>
                    <p className="text-gray-500 mb-4">
                      Get started by creating your first featured item
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
                  <Card className="shadow-sm">
                    <CardHeader>
                      <CardTitle>Manage Featured Items</CardTitle>
                      <CardDescription>
                        Drag and drop to reorder. Items are displayed in this order on the homepage.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="border-b bg-muted/30">
                            <tr className="text-xs font-medium text-muted-foreground">
                              <th className="text-left p-4 w-10"></th>
                              <th className="text-left p-4">Title</th>
                              <th className="text-left p-4">Image</th>
                              <th className="text-left p-4">Link</th>
                              <th className="text-left p-4">Actions</th>
                            </tr>
                          </thead>
                          <SortableContext 
                            items={featuredItems.map(item => item.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            <tbody>
                              {featuredItems
                                .sort((a, b) => (a.order || 0) - (b.order || 0))
                                .map((item) => (
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
                    <CardFooter className="border-t p-4">
                      <div className="text-sm text-muted-foreground">
                        {featuredItems.length} featured item{featuredItems.length !== 1 ? 's' : ''} • Drag to reorder
                      </div>
                    </CardFooter>
                  </Card>
                </DndContext>
              )}
            </TabsContent>
            
            {/* Upload Tab */}
            <TabsContent value="upload" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">Content Upload</h1>
                  <p className="text-sm text-muted-foreground">
                    Upload new content to the platform
                  </p>
                </div>
              </div>
              
              <AdminUpload />
            </TabsContent>

            {/* AI Settings Tab */}
            <TabsContent value="ai-settings">
              <AISettingsTab />
            </TabsContent>

            {/* Admin Tools Tab */}
            <TabsContent value="admin-tools">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold">Admin Tools</h1>
                    <p className="text-sm text-muted-foreground">
                      Advanced tools for database and system administration
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    Restricted Access
                  </Badge>
                </div>

                <Alert className="bg-red-50 border-red-200">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertTitle className="text-red-800">Advanced Tools</AlertTitle>
                  <AlertDescription className="text-red-700">
                    These tools perform direct database operations. Use with extreme caution.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-gold" />
                        Database Maintenance
                      </CardTitle>
                      <CardDescription>
                        Run maintenance tasks on the database
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button variant="outline" className="w-full justify-start">
                        Clean Up Old Records
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        Rebuild Search Index
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        Update Statistics
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-gold" />
                        User Management
                      </CardTitle>
                      <CardDescription>
                        Advanced user operations
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button variant="outline" className="w-full justify-start">
                        Bulk User Export
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        Reset User Passwords
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        Audit Logs
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            {/* Other tabs placeholder */}
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
                  <p className="text-muted-foreground text-center max-w-md mb-6">
                    This section is currently under development.
                  </p>
                  <Button variant="outline">
                    Check Back Soon
                  </Button>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default Admin;
