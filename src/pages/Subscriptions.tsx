import React, { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Wallet, CreditCard, ShoppingBag, Music, Calendar, UserCheck, Zap, Crown, Star, Award } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { mockSubscriptionPlans } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import PricingCard from "@/components/subscription/PricingCard";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface PaymentMethod {
  id: string;
  user_id: string;
  type: "card" | "mpesa" | "paypal" | "bank";
  provider_id: string | null;
  is_default: boolean;
  details: {
    brand?: string;
    last4?: string;
    expiry_month?: number;
    expiry_year?: number;
    phone?: string;
    email?: string;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}

interface UserSubscription {
  id: string;
  user_id: string;
  type: string;
  status: string;
  valid_from: string;
  valid_until: string | null;
  payment_id: string | null;
  payment_method_id: string | null;
  created_at: string;
  updated_at: string;
  plan: {
    id: string;
    name: string;
    price: number;
    interval: string;
    credits: number;
  };
}

interface UserCredits {
  total: number;
  used: number;
  available: number;
}

const Subscriptions = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"subscriptions" | "payments" | "usage">("subscriptions");
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [userCredits, setUserCredits] = useState<UserCredits | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const urlSearchParams = new URLSearchParams(location.search);
  const contentType = urlSearchParams.get('contentType');
  const contentId = urlSearchParams.get('contentId');

  useEffect(() => {
    if (user) {
      fetchUserData();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        fetchUserSubscription(),
        fetchPaymentMethods(),
        fetchUserCredits()
      ]);
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast({
        title: "Error",
        description: "Failed to load your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserSubscription = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        payments(*)
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('valid_until', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("Error fetching subscription:", error);
      return;
    }

    if (data) {
      const plan = mockSubscriptionPlans.find(p => p.id.toString() === data.type) || {
        id: data.type as string,
        name: (data.type as string).charAt(0).toUpperCase() + (data.type as string).slice(1),
        price: 0,
        interval: 'month' as const,
        credits: 0
      };
      
      setUserSubscription({
        ...data,
        plan: {
          id: String(plan.id),
          name: plan.name,
          price: plan.price,
          interval: plan.interval as string,
          credits: plan.credits
        }
      } as any);
    }
  };

  const fetchPaymentMethods = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching payment methods:", error);
      return;
    }

    setPaymentMethods(data.map(method => ({
      ...method,
      details: typeof method.details === 'object' && method.details !== null 
        ? method.details as any 
        : {}
    })));
  };

  const fetchUserCredits = async () => {
    if (!user) return;

    try {
      const { data: subscriptionData } = await supabase
        .from('subscriptions')
        .select('type, valid_until')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('valid_until', { ascending: false })
        .limit(1)
        .single();

      if (subscriptionData) {
        const plan = mockSubscriptionPlans.find(p => p.id.toString() === subscriptionData.type);
        const totalCredits = (plan as any)?.credits || 0;
        
        const { count: usedCredits } = await supabase
          .from('bookings')
          .select('*', { count: 'exact' })
          .eq('student_id', user.id)
          .gte('start_time', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
          .lte('start_time', new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString())
          .eq('status', 'completed');

        setUserCredits({
          total: totalCredits,
          used: usedCredits || 0,
          available: totalCredits - (usedCredits || 0)
        });
      } else {
        setUserCredits({
          total: 0,
          used: 0,
          available: 0
        });
      }
    } catch (error) {
      console.error("Error fetching user credits:", error);
    }
  };

  const handleAddPaymentMethod = () => {
    navigate("/add-payment-method");
  };

  const handleSetDefaultPaymentMethod = async (methodId: string) => {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .update({ is_default: false })
        .eq('user_id', user?.id);

      if (error) throw error;

      const { error: updateError } = await supabase
        .from('payment_methods')
        .update({ is_default: true })
        .eq('id', methodId);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Default payment method updated",
      });

      fetchPaymentMethods();
    } catch (error) {
      console.error("Error setting default payment method:", error);
      toast({
        title: "Error",
        description: "Failed to update default payment method",
        variant: "destructive",
      });
    }
  };

  const handleRemovePaymentMethod = async (methodId: string) => {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', methodId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payment method removed",
      });

      fetchPaymentMethods();
    } catch (error) {
      console.error("Error removing payment method:", error);
      toast({
        title: "Error",
        description: "Failed to remove payment method",
        variant: "destructive",
      });
    }
  };

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to subscribe to a plan",
        variant: "default",
      });
      navigate("/auth");
      return;
    }

    setIsProcessing(true);
    try {
      const defaultPaymentMethod = paymentMethods.find(method => method.is_default);
      
      if (!defaultPaymentMethod) {
        toast({
          title: "Payment method required",
          description: "Please add a payment method before subscribing",
          variant: "destructive",
        });
        setActiveTab("payments");
        setIsProcessing(false);
        return;
      }

      const plan = mockSubscriptionPlans.find(p => p.id.toString() === planId);
      
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          user_id: user.id,
          amount: plan?.price || 0,
          method: defaultPaymentMethod.type as 'card' | 'mpesa' | 'paypal' | 'bank_transfer',
          status: 'completed',
          reference: `sub_${Date.now()}`,
          payment_method_id: defaultPaymentMethod.id,
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      const validUntil = new Date();
      validUntil.setMonth(validUntil.getMonth() + 1);

      const { error: subError } = await supabase
        .from('subscriptions')
        .insert([{
          user_id: user.id,
          type: planId as 'free' | 'basic' | 'premium' | 'professional',
          status: 'active' as const,
          valid_from: new Date().toISOString(),
          valid_until: validUntil.toISOString(),
          payment_id: payment.id,
          payment_method_id: defaultPaymentMethod.id,
        }]);

      if (subError) throw subError;

      await fetchUserData();
      
      toast({
        title: "Subscription successful!",
        description: `You've successfully subscribed to the ${plan?.name} plan`,
      });
      
    } catch (error) {
      console.error("Error completing subscription:", error);
      toast({
        title: "Subscription failed",
        description: "There was an error processing your subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBookSession = () => {
    navigate("/bookings");
  };

  const getPaymentMethodIcon = (type: string) => {
    switch (type) {
      case "mpesa":
        return <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold">M</div>;
      case "paypal":
        return <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">P</div>;
      case "card":
        return <CreditCard className="h-5 w-5" />;
      case "bank":
        return <div className="w-5 h-5 bg-gray-600 rounded-full flex items-center justify-center text-white text-xs font-bold">B</div>;
      default:
        return <CreditCard className="h-5 w-5" />;
    }
  };

  const getPaymentMethodColor = (type: string) => {
    switch (type) {
      case "card":
        return "bg-blue-50 text-blue-500 dark:bg-blue-900/20 dark:text-blue-400";
      case "mpesa":
        return "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400";
      case "paypal":
        return "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400";
      case "bank":
        return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  const formatPaymentMethodName = (method: PaymentMethod) => {
    switch (method.type) {
      case "card":
        return `${method.details.brand || 'Card'} ending in ${method.details.last4 || '****'}`;
      case "mpesa":
        return `M-Pesa ${method.details.phone ? `(${method.details.phone})` : ''}`;
      case "paypal":
        return `PayPal ${method.details.email ? `(${method.details.email})` : ''}`;
      case "bank":
        return `Bank Account ${method.details.last4 ? `(****${method.details.last4})` : ''}`;
      default:
        return "Payment Method";
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center">
            <Skeleton className="h-10 w-24 mr-4" />
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-80" />
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full max-w-md" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-proxima font-bold">Subscriptions & Payments</h1>
            <p className="text-muted-foreground">
              Manage your subscriptions, payment methods, and session credits
            </p>
          </div>
        </div>
  
        {contentType && contentId && (
          <Alert className="bg-gold/10 border-gold dark:bg-gold/20 dark:border-gold/50">
            <ShoppingBag className="h-4 w-4 text-gold" />
            <AlertTitle className="text-gold-foreground">Access Premium Content</AlertTitle>
            <AlertDescription className="text-gold-foreground/90 space-y-2">
              <p>Subscribe to access {contentType === 'exclusive' ? 'exclusive content' : contentType}</p>
              <Button size="sm" className="bg-gold hover:bg-gold/90 text-white mt-2" onClick={() => setActiveTab("subscriptions")}>
                View Plans
              </Button>
            </AlertDescription>
          </Alert>
        )}
  
        <Tabs 
          defaultValue={activeTab}
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as "subscriptions" | "payments" | "usage")}
          className="w-full"
        >
          <TabsList className="grid grid-cols-3 w-full md:w-[500px]">
            <TabsTrigger value="subscriptions">
              <Crown className="h-4 w-4 mr-2" />
              Subscriptions
            </TabsTrigger>
            <TabsTrigger value="payments">
              <Wallet
                className="h-4 w-4 mr-2"
                stroke="currentColor"
                fill="none"
                strokeWidth={2}
                />
              Payment Methods
            </TabsTrigger>
            <TabsTrigger value="usage">
              <Zap className="h-4 w-4 mr-2" />
              Usage & Credits
            </TabsTrigger>
          </TabsList>
  
          <TabsContent value="subscriptions" className="mt-6 space-y-6">
            <div className="space-y-6">
              {!user && (
                <Card className="border-gold/30 bg-gradient-to-r from-amber-50 to-gold/5 dark:from-gold/10 dark:to-gold/5 dark:border-gold/20">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-gold/20 rounded-full dark:bg-gold/30">
                        <Crown className="h-6 w-6 text-gold dark:text-gold" />
                      </div>
                      <CardTitle className="text-foreground">Unlock Premium Features</CardTitle>
                    </div>
                    <CardDescription className="text-base text-foreground/80">
                      Sign in to access and manage your subscriptions. Get personalized lessons, exclusive content, and track your progress.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button 
                        onClick={() => navigate("/auth")} 
                        className="bg-gold hover:bg-gold/90 text-white"
                      >
                        Sign In
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => navigate("/auth?signup=true")}
                        className="border-gold text-gold hover:bg-gold/80 dark:border-gold dark:text-gold dark:hover:bg-gold/20"
                      >
                        Create Account
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {userSubscription && (
                <Card className="border-gold/20 bg-gold/5 dark:bg-gold/10 dark:border-gold/30">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          Your Active Plan
                          <Badge className="bg-green-600">Active</Badge>
                        </CardTitle>
                        <CardDescription>
                          You're subscribed to the {userSubscription.plan.name} plan
                        </CardDescription>
                      </div>
                      <Button variant="outline" size="sm">
                        Manage Subscription
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Valid until: {userSubscription.valid_until ? new Date(userSubscription.valid_until).toLocaleDateString() : "No expiration date"}
                    </p>
                  </CardContent>
                </Card>
              )}
              
              <div>
                <h2 className="text-2xl font-proxima font-semibold mb-4">Choose Your Plan</h2>
                <p className="text-muted-foreground mb-6 max-w-3xl">
                  Select the subscription that fits your musical journey. All plans include access to premium content 
                  and exclusive resources from Saem's Tunes.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {mockSubscriptionPlans.map((plan, index) => (
                    <PricingCard 
                      key={plan.id}
                      plan={plan}
                      variant={index === 1 ? "default" : "outline"}
                      isCurrentPlan={userSubscription?.plan.id === String(plan.id)}
                      onSubscribe={() => handleSubscribe(String(plan.id))}
                      isLoading={isProcessing}
                      className={cn(
                        index === 1 && "ring-2 ring-gold ring-offset-2"
                      )}
                    />
                  ))}
                </div>
              </div>
              
              <div className="w-full bg-gradient-to-r from-amber-50 to-gold/5 dark:from-gold/10 dark:to-gold/5 rounded-lg p-6 md:p-8">
                <h3 className="text-xl font-proxima font-semibold mb-6 text-center text-foreground">Why subscribe to Saem's Tunes?</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center bg-background p-6 rounded-lg shadow-sm border dark:bg-card dark:border-border">
                    <div className="bg-gold/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 dark:bg-gold/30">
                      <Award className="h-6 w-6 text-gold dark:text-gold" />
                    </div>
                    <h4 className="font-proxima font-semibold mb-2 text-foreground">Exclusive Content</h4>
                    <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                      Access premium lessons and resources not available to free users
                    </p>
                  </div>
                  <div className="text-center bg-background p-6 rounded-lg shadow-sm border dark:bg-card dark:border-border">
                    <div className="bg-gold/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 dark:bg-gold/30">
                      <UserCheck className="h-6 w-6 text-gold dark:text-gold" />
                    </div>
                    <h4 className="font-proxima font-semibold mb-2 text-foreground">Personal Coaching</h4>
                    <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                      Get personalized feedback and guidance from experienced instructors
                    </p>
                  </div>
                  <div className="text-center bg-background p-6 rounded-lg shadow-sm border dark:bg-card dark:border-border">
                    <div className="bg-gold/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 dark:bg-gold/30">
                      <Calendar className="h-6 w-6 text-gold dark:text-gold" />
                    </div>
                    <h4 className="font-proxima font-semibold mb-2 text-foreground">Flexible Booking</h4>
                    <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                      Book sessions at your convenience with our easy scheduling system
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
  
          <TabsContent value="payments" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>
                  Manage your stored payment methods for seamless transactions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {paymentMethods.length > 0 ? (
                  paymentMethods.map((method) => (
                    <div 
                      key={method.id} 
                      className="flex items-center justify-between border rounded-lg p-4 dark:border-border"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "p-2 rounded-full",
                          getPaymentMethodColor(method.type)
                        )}>
                          {getPaymentMethodIcon(method.type)}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {formatPaymentMethodName(method)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Added {new Date(method.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {method.is_default && (
                          <Badge variant="secondary" className="bg-gold/20 text-gold-foreground dark:bg-gold/30 dark:text-gold">Default</Badge>
                        )}
                        {!method.is_default && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleSetDefaultPaymentMethod(method.id)}
                          >
                            Set Default
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleRemovePaymentMethod(method.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-medium mb-2 text-foreground">No payment methods</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add a payment method to make subscribing easier.
                    </p>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <Button variant="outline" className="flex-1" onClick={handleAddPaymentMethod}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Add Card
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <div className="mr-2 h-4 w-4 bg-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold">M</div>
                    Add M-Pesa
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Billing History</CardTitle>
                <CardDescription>
                  View your past transactions and invoices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-dashed p-8 text-center dark:border-border">
                  <CreditCard className="h-8 w-8 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2 text-foreground">No transactions yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Your billing history will appear here once you make a purchase.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="usage" className="mt-6 space-y-6">
            {!user ? (
              <Card className="border-gold/30 bg-gradient-to-r from-amber-50 to-gold/5 dark:from-gold/10 dark:to-gold/5 dark:border-gold/20">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gold/20 rounded-full dark:bg-gold/30">
                      <Star className="h-6 w-6 text-gold dark:text-gold" />
                    </div>
                    <CardTitle className="text-foreground">Track Your Progress</CardTitle>
                  </div>
                  <CardDescription className="text-base text-foreground/80">
                    Sign in to view your usage statistics, remaining credits, and upcoming sessions. 
                    Monitor your musical journey and make the most of your subscription.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      onClick={() => navigate("/auth")} 
                      className="bg-gold hover:bg-gold/90 text-white"
                    >
                      Sign In
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => navigate("/auth?signup=true")}
                      className="border-gold text-gold hover:bg-gold/10 dark:border-gold dark:text-gold dark:hover:bg-gold/80"
                    >
                      Create Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : userSubscription && userCredits ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Session Credits</CardTitle>
                    <CardDescription>
                      You have {userCredits.available} out of {userCredits.total} credits remaining this month
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Progress value={(userCredits.used / userCredits.total) * 100} className="h-2 mb-4" />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{userCredits.used} used</span>
                      <span>{userCredits.available} remaining</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Book a Session</CardTitle>
                    <CardDescription>
                      Use your credits to book a session with our instructors
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border rounded-lg p-4 dark:border-border">
                        <h4 className="font-medium mb-2 text-foreground">Private Lesson</h4>
                        <p className="text-sm text-muted-foreground mb-3">1-on-1 session with an instructor</p>
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-foreground">1 credit</span>
                          <Button size="sm" onClick={handleBookSession}>
                            Book Now
                          </Button>
                        </div>
                      </div>
                      <div className="border rounded-lg p-4 dark:border-border">
                        <h4 className="font-medium mb-2 text-foreground">Group Session</h4>
                        <p className="text-sm text-muted-foreground mb-3">Join a group learning session</p>
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-foreground">2 credits</span>
                          <Button size="sm" onClick={handleBookSession}>
                            Book Now
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Upcoming Sessions</CardTitle>
                    <CardDescription>
                      Your scheduled lessons and appointments
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg border border-dashed p-8 text-center dark:border-border">
                      <Calendar className="h-8 w-8 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-medium mb-2 text-foreground">No upcoming sessions</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Book your first session to get started on your musical journey.
                      </p>
                      <Button onClick={handleBookSession}>
                        Book a Session
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Alert>
                <AlertTitle>No active subscription</AlertTitle>
                <AlertDescription>
                  You need an active subscription to access credits and book sessions.
                  <Button className="ml-4" onClick={() => setActiveTab("subscriptions")}>
                    View Plans
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Subscriptions;
