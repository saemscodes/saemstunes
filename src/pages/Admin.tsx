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
  Brain
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
];

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
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
}

const handleSupabaseError = (error: any, context: string) => {
  console.error(`Supabase Error (${context}):`, {
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async () => {
    if (!imageFile) return;
    
    try {
      setUploading(true);
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `featured/${fileName}`;
      
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
      
      setFormData(prev => ({ ...prev, image: publicUrl }));
      toast({ title: "Image uploaded successfully!" });
    } catch (error) {
      toast({ 
        title: "Image upload failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{item.id ? 'Edit Featured Item' : 'Create Featured Item'}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={3}
            />
          </div>
          
          <div>
            <Label htmlFor="image">Image *</Label>
            <div className="flex items-center gap-3">
              {formData.image && (
                <img 
                  src={formData.image} 
                  alt="Preview" 
                  className="w-16 h-16 object-cover rounded-md border" 
                />
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              />
              <Button 
                type="button" 
                variant="secondary"
                disabled={!imageFile || uploading}
                onClick={handleImageUpload}
              >
                {uploading ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </div>
          
          <div>
            <Label htmlFor="link">Link *</Label>
            <Input
              id="link"
              name="link"
              value={formData.link}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_external"
              name="is_external"
              checked={formData.is_external || false}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, is_external: !!checked }))
              }
            />
            <Label htmlFor="is_external">Open in new tab</Label>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button 
              type="button" 
              className="bg-gold hover:bg-gold/90 text-white"
              onClick={() => onSave(formData)}
            >
              Save
            </Button>
            <Button variant="outline" onClick={onCancel}>
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
      className="border-b hover:bg-muted/50"
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
        <img 
          src={item.image} 
          alt={item.title}
          className="w-16 h-10 object-cover rounded"
        />
      </td>
      <td className="p-3 text-sm max-w-xs truncate">{item.link}</td>
      <td className="p-3">
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onEdit(item)}
          >
            Edit
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-destructive"
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

const Admin = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [editingItem, setEditingItem] = useState<FeaturedItem | null>(null);
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

  useEffect(() => {
    const adminAuth = sessionStorage.getItem('adminAuth');
    if (adminAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

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
          .select('id, first_name, last_name, email, role, created_at')
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
    } catch (error) {
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
        .select('id, first_name, last_name, email, role, created_at', { count: 'exact' })
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
    } catch (error) {
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

      if (videosRes.error) handleSupabaseError(videosRes.error, 'fetch videos');
      if (audioRes.error) handleSupabaseError(audioRes.error, 'fetch audio');
      if (coursesRes.error) handleSupabaseError(coursesRes.error, 'fetch courses');

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

      const videoIds = videos.map(v => v.id);
      const audioIds = audio.map(a => a.id);
      const courseIds = courses.map(c => c.id);

      const [
        videoStatsRes,
        audioStatsRes,
        courseStatsRes
      ] = await Promise.all([
        supabase.rpc('get_video_view_counts'),
        supabase.rpc('get_audio_play_counts'),
        supabase.rpc('get_course_enrollment_counts')
      ]);

      if (videoStatsRes.error) handleSupabaseError(videoStatsRes.error, 'video stats');
      if (audioStatsRes.error) handleSupabaseError(audioStatsRes.error, 'audio stats');
      if (courseStatsRes.error) handleSupabaseError(courseStatsRes.error, 'course stats');

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

      combinedContent.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setAllContent(combinedContent);
    } catch (error) {
      toast({ 
        title: "Failed to load content",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setContentLoading(false);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (
      loginForm.username === process.env.NEXT_PUBLIC_ADMIN_USERNAME &&
      loginForm.password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD
    ) {
      setIsAuthenticated(true);
      sessionStorage.setItem('adminAuth', 'true');
    } else {
      setLoginError('Invalid credentials. Please check your username and password.');
    }
  };

  const handleLogout = async () => {
    try {
      sessionStorage.removeItem('adminAuth');
      setIsAuthenticated(false);
      setLoginForm({ username: '', password: '' });
      if (user) {
        await logout();
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleSaveFeaturedItem = async (item: FeaturedItem) => {
    try {
      if (item.id) {
        const { error } = await supabase
          .from('featured_items')
          .update(item)
          .eq('id', item.id);
          
        if (error) {
          handleSupabaseError(error, 'update featured item');
          return;
        }
      } else {
        const { data, error } = await supabase
          .from('featured_items')
          .insert([{
            title: item.title,
            description: item.description,
            image: item.image,
            link: item.link,
            is_external: item.is_external || false,
            order: featuredItems.length
          }])
          .select();

        if (error) {
          handleSupabaseError(error, 'create featured item');
          return;
        }
        if (data) item.id = data[0].id;
      }
      
      refreshItems();
      setEditingItem(null);
      toast({ title: "Featured item saved successfully!" });
    } catch (error) {
      toast({ 
        title: "Failed to save featured item",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDeleteFeaturedItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('featured_items')
        .delete()
        .eq('id', id);

      if (error) {
        handleSupabaseError(error, 'delete featured item');
        return;
      }
      
      refreshItems();
      toast({ title: "Featured item deleted!" });
    } catch (error) {
      toast({ 
        title: "Failed to delete featured item",
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
      const { error } = await supabase
        .from('featured_items')
        .upsert(updatedItems);
      
      if (error) {
        handleSupabaseError(error, 'reorder items');
        return;
      }
      
      refreshItems();
    } catch (error) {
      toast({ 
        title: "Failed to reorder items",
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
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) {
        handleSupabaseError(error, 'delete user');
        return;
      }
      
      fetchUsers();
      toast({ title: "User deleted successfully!" });
    } catch (error) {
      toast({ 
        title: "Failed to delete user",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDeleteContent = async (contentId: string, contentType: string) => {
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
        case 'sheet':
          tableName = 'sheet_music';
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
      toast({ title: "Content deleted successfully!" });
    } catch (error) {
      console.error("Delete error details:", {
        message: error.message,
        code: error.code,
        details: error.details
      });
      
      toast({ 
        title: "Failed to delete content",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Logo size="lg" />
            </div>
            <CardTitle className="text-2xl">Admin Access</CardTitle>
            <CardDescription>
              Enter your administrator credentials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              {loginError && (
                <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
                  {loginError}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Enter username"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter password"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gold hover:bg-gold/90 text-white"
              >
                Access Admin Panel
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <header className="bg-background border-b sticky top-0 z-10">
        <div className="container flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <Logo size="sm" />
            <div className="hidden md:block bg-gold/10 text-gold px-2 py-1 rounded text-xs font-semibold">
              ADMIN
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative w-full max-w-xs hidden md:block">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search..." 
                className="pl-8 bg-background border-muted"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium">Administrator</p>
                <p className="text-xs text-muted-foreground">Admin Panel</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <div className="flex flex-1">
        <aside className="hidden md:block w-64 bg-background border-r p-4">
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <Button
                key={item.value}
                variant={activeTab === item.value ? "secondary" : "ghost"}
                className={`w-full justify-start ${
                  activeTab === item.value ? "bg-gold/10 text-gold hover:bg-gold/20" : ""
                }`}
                onClick={() => setActiveTab(item.value)}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            ))}
          </nav>
          
          <div className="mt-auto pt-6 border-t mt-6">
            <div className="text-xs text-muted-foreground">
              <p>Saem's Tunes Admin</p>
              <p>Version 1.0.0</p>
            </div>
          </div>
        </aside>
        
        <div className="md:hidden w-full border-b bg-background">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full overflow-x-auto justify-start py-1 h-auto">
              {NAV_ITEMS.map((item) => (
                <TabsTrigger key={item.value} value={item.value} className="flex items-center gap-1">
                  <item.icon className="h-4 w-4" />
                  <span className="sr-only md:not-sr-only">{item.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Tabs value={activeTab} className="w-full">
            <TabsContent value="dashboard" className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleString()}</p>
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
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Users
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{dashboardStats.totalUsers.toLocaleString()}</div>
                      <p className="text-xs text-green-600 flex items-center mt-1">
                        +12% from last month
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Active Subscriptions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{dashboardStats.activeSubscriptions.toLocaleString()}</div>
                      <p className="text-xs text-green-600 flex items-center mt-1">
                        +5% from last month
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Content Views
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{dashboardStats.contentViews.toLocaleString()}</div>
                      <p className="text-xs text-green-600 flex items-center mt-1">
                        +22% from last month
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Revenue
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">${dashboardStats.revenue.toLocaleString()}</div>
                      <p className="text-xs text-green-600 flex items-center mt-1">
                        +18% from last month
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
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
                        No recent users found
                      </div>
                    ) : (
                      <table className="w-full">
                        <thead className="border-b">
                          <tr className="text-xs text-muted-foreground font-medium">
                            <th className="text-left p-3">Name</th>
                            <th className="text-left p-3">Role</th>
                            <th className="text-left p-3 hidden md:table-cell">Joined</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentUsers.map((user) => (
                            <tr key={user.id} className="border-b last:border-0 hover:bg-muted/50">
                              <td className="p-3">
                                <div className="font-medium">{user.first_name} {user.last_name}</div>
                                <div className="text-xs text-muted-foreground">{user.email}</div>
                              </td>
                              <td className="p-3">
                                <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-gold/10 text-gold">
                                  {user.role}
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
                      View all users
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card>
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
                        No recent content found
                      </div>
                    ) : (
                      <table className="w-full">
                        <thead className="border-b">
                          <tr className="text-xs text-muted-foreground font-medium">
                            <th className="text-left p-3">Title</th>
                            <th className="text-left p-3">Type</th>
                            <th className="text-left p-3 hidden md:table-cell">Created</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentContent.map((content) => (
                            <tr key={content.id} className="border-b last:border-0 hover:bg-muted/50">
                              <td className="p-3">
                                <div className="font-medium">{content.title}</div>
                                <div className="text-xs text-muted-foreground">
                                  {content.views ? `${content.views} views` : 
                                  content.enrollments ? `${content.enrollments} enrollments` :
                                  content.plays ? `${content.plays} plays` :
                                  content.downloads ? `${content.downloads} downloads` : 'N/A'}
                                  </div>
                              </td>
                              <td className="p-3">
                                <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-gold/10 text-gold">
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
                      View all content
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="users">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold">User Management</h1>
                  <Button className="bg-gold hover:bg-gold/90 text-white">
                    Add New User
                  </Button>
                </div>
                
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>All Users</CardTitle>
                        <CardDescription>
                          Manage and monitor all registered users
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input 
                          placeholder="Search users..." 
                          className="w-64" 
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
                        {[...Array(8)].map((_, i) => (
                          <div key={i} className="flex items-center justify-between py-3 border-b last:border-0">
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
                      <div className="p-6 text-center text-muted-foreground">
                        No users found
                      </div>
                    ) : (
                      <table className="w-full">
                        <thead className="border-b">
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
                            <tr key={user.id} className="border-b last:border-0 hover:bg-muted/50">
                              <td className="p-3 font-medium">{user.first_name} {user.last_name}</td>
                              <td className="p-3">{user.email}</td>
                              <td className="p-3">
                                <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-gold/10 text-gold">
                                  {user.role}
                                </span>
                              </td>
                              <td className="p-3">
                                {new Date(user.created_at).toLocaleDateString()}
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <Button variant="ghost" size="sm">Edit</Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-destructive"
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
                    )}
                  </CardContent>
                  <CardFooter className="border-t p-3 flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Showing {Math.min(usersPerPage, users.length)} of {totalUsersCount} users
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
            
            <TabsContent value="content">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold">Content Management</h1>
                  <div className="flex gap-2">
                    <Button 
                      variant="secondary"
                      onClick={fetchContent}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                    <Button className="bg-gold hover:bg-gold/90 text-white">
                      Add New Content
                    </Button>
                  </div>
                </div>
                
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>All Content</CardTitle>
                        <CardDescription>
                          Manage lessons, music, and educational materials
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input 
                          placeholder="Search content..." 
                          className="w-64" 
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
                      <div className="p-6 text-center text-muted-foreground">
                        No content found
                      </div>
                    ) : (
                      <table className="w-full">
                        <thead className="border-b">
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
                            <tr key={item.id} className="border-b last:border-0 hover:bg-muted/50">
                              <td className="p-3 font-medium">{item.title}</td>
                              <td className="p-3">
                                <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-gold/10 text-gold">
                                  {item.type}
                                </span>
                              </td>
                              <td className="p-3">
                                {item.views ? `${item.views} views` : 
                                item.enrollments ? `${item.enrollments} enrollments` :
                                item.plays ? `${item.plays} plays` :
                                item.downloads ? `${item.downloads} downloads` : 'N/A'}
                              </td>
                              <td className="p-3">
                                {new Date(item.created_at).toLocaleDateString()}
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <Button variant="ghost" size="sm">Edit</Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-destructive"
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
                    )}
                  </CardContent>
                  <CardFooter className="border-t p-3 flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Showing {Math.min(contentPerPage, paginatedContent.length)} of {totalContentCount} content items
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
            
            <TabsContent value="featured" className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Featured Items</h1>
                <Button 
                  onClick={() => setEditingItem({
                    id: '',
                    title: '',
                    description: '',
                    image: '',
                    link: '',
                    is_external: false
                  })}
                  className="bg-gold hover:bg-gold/90 text-white"
                >
                  Add New
                </Button>
              </div>

              {editingItem ? (
                <FeaturedItemForm 
                  item={editingItem}
                  onSave={handleSaveFeaturedItem}
                  onCancel={() => setEditingItem(null)}
                />
              ) : loading ? (
                <div className="flex items-center justify-center h-64">
                  <p>Loading featured items...</p>
                </div>
              ) : featuredItems.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No featured items available</p>
                    <Button 
                      className="mt-4 bg-gold hover:bg-gold/90 text-white"
                      onClick={() => setEditingItem({
                        id: '',
                        title: '',
                        description: '',
                        image: '',
                        link: '',
                        is_external: false
                      })}
                    >
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
                    <CardContent className="p-0">
                      <table className="w-full">
                        <thead className="border-b">
                          <tr className="text-xs text-muted-foreground font-medium">
                            <th className="text-left p-3 w-8"></th>
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
                            {featuredItems.map((item) => (
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
                    </CardContent>
                  </Card>
                </DndContext>
              )}
            </TabsContent>
            
            <TabsContent value="upload" className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Content Upload</h1>
                <p className="text-sm text-muted-foreground">Upload new content to the platform</p>
              </div>
              
              <AdminUpload />
            </TabsContent>

            <TabsContent value="ai-settings">
              <AISettingsTab />
            </TabsContent>
            
            {['schedule', 'notifications', 'reports', 'settings'].map((tab) => (
              <TabsContent key={tab} value={tab}>
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="bg-muted p-4 rounded-full mb-4">
                    {tab === 'schedule' && <Calendar className="h-8 w-8 text-gold" />}
                    {tab === 'notifications' && <Bell className="h-8 w-8 text-gold" />}
                    {tab === 'reports' && <FileText className="h-8 w-8 text-gold" />}
                    {tab === 'settings' && <Settings className="h-8 w-8 text-gold" />}
                  </div>
                  <h2 className="text-2xl font-bold mb-2 capitalize">{tab}</h2>
                  <p className="text-muted-foreground text-center max-w-md">
                    This section is currently under development. Check back soon for updates!
                  </p>
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
