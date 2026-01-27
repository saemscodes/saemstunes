import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Minus, Plus, ChevronDown, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { SubscriptionPlan } from "@/data/mockData";
import PaymentDialog from "@/components/payment/PaymentDialog";

const PRICING_CONFIG = {
  1: { // Starter
    regular: 1200,
    discounted: 800,
    discount: 33.33,
    baseCoefficient: 1.1,
    penaltyMultipliers: [1.0, 1.15, 1.31],
    classCounts: [4, 3, 2],
    minClasses: 2,
    maxClasses: 4
  },
  2: { // Standard
    regular: 2000,
    discounted: 1500,
    discount: 25,
    baseCoefficient: 1.05,
    penaltyMultipliers: [1.0, 1.08, 1.26, 1.5],
    classCounts: [6, 5, 4, 3],
    minClasses: 3,
    maxClasses: 6
  },
  3: { // Professional (Premium)
    regular: 4500,
    discounted: 3600,
    discount: 20,
    baseCoefficient: 1.0,
    // Fixed: Correctly interpolated to maintain 1.0 (lowest) to 1.44 (highest)
    penaltyMultipliers: [1.0, 1.015, 1.03, 1.065, 1.1, 1.21, 1.32, 1.44],
    classCounts: [12, 11, 10, 9, 8, 7, 6, 5],
    minClasses: 5,
    maxClasses: 12
  }
};

// Exported function to calculate raw price
export const calculateRawPrice = (
  planId: number, 
  classCount: number, 
  paymentType: 'subscription' | 'one-time',
  planPrice?: number
) => {
  const pricingConfig = PRICING_CONFIG[planId as keyof typeof PRICING_CONFIG];
  const isTieredPlan = [1, 2, 3].includes(planId);
  
  if (paymentType === 'subscription') {
    return pricingConfig ? pricingConfig.discounted : 0;
  }
  
  if (isTieredPlan && pricingConfig) {
    const classCountIndex = pricingConfig.classCounts.indexOf(classCount);
    if (classCountIndex === -1) return pricingConfig.regular;
    
    const penalty = pricingConfig.penaltyMultipliers[classCountIndex];
    const rawPrice = (pricingConfig.regular * pricingConfig.baseCoefficient * penalty) / classCount;
    const maxPrice = (pricingConfig.regular * 1.5) / classCount;
    const oneTimePrice = Math.min(Math.round(rawPrice), maxPrice);
    return oneTimePrice * classCount;
  }
  
  // For non-tiered plans
  return planPrice ? Math.round(planPrice * 130 * 0.3) : 0;
};

interface PricingCardProps {
  plan: SubscriptionPlan;
  variant?: "default" | "outline";
  isCurrentPlan?: boolean;   
  onSubscribe: () => Promise<void> | void;
  isLoading: boolean;
  className?: string;
}

const PricingCard: React.FC<PricingCardProps> = ({ plan, variant = "default", className }) => {
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentType, setPaymentType] = useState<'subscription' | 'one-time'>('subscription');
  const [classCount, setClassCount] = useState<number>(4);
  const [isTieredPlan, setIsTieredPlan] = useState(false);
  const [mobileDetailsOpen, setMobileDetailsOpen] = useState(false);
  
  const isPrimary = variant === "default";
  const isPremium = plan.id === 2; // Premium tier (Professional)
  const pricingConfig = PRICING_CONFIG[plan.id as keyof typeof PRICING_CONFIG] || {
    regular: 0,
    discounted: 0,
    discount: 0,
    baseCoefficient: 1.0,
    penaltyMultipliers: [1.0],
    classCounts: [1],
    minClasses: 1,
    maxClasses: 1
  };

  useEffect(() => {
    const tiered = [1, 2, 3].includes(plan.id);
    setIsTieredPlan(tiered);
    if (tiered) setClassCount(pricingConfig.maxClasses);
  }, [plan.id, pricingConfig.maxClasses]);

  const calculateOneTimePrice = () => {
    const classCountIndex = pricingConfig.classCounts.indexOf(classCount);
    if (classCountIndex === -1) return pricingConfig.regular;
    
    const penalty = pricingConfig.penaltyMultipliers[classCountIndex];
    const rawPrice = (pricingConfig.regular * pricingConfig.baseCoefficient * penalty) / classCount;
    const maxPrice = (pricingConfig.regular * 1.5) / classCount;
    return Math.min(Math.round(rawPrice), maxPrice);
  };

  const oneTimePrice = isTieredPlan ? calculateOneTimePrice() : Math.round(plan.price * 130 * 0.3);

  const handleSubscribe = (type: 'subscription' | 'one-time') => {
    setPaymentType(type);
    setShowPaymentDialog(true);
  };
  
  // Calculate raw price for payment dialog
  const rawPrice = calculateRawPrice(plan.id, classCount, paymentType, plan.price);

  const paymentRequest = {
    orderType: (paymentType === 'subscription' ? 'subscription' : 'service') as 'subscription' | 'service' | 'product',
    itemId: String(plan.id), // Convert to string to match PaymentRequest interface
    itemName: `${plan.name} ${paymentType === 'subscription' ? 'Subscription' : `Class Pack (${classCount} classes)`}`,
    amount: Math.round(rawPrice * 100), // Amount in cents
    currency: 'KES',
  };

  return (
    <>
      <Card
        className={cn(
          "flex flex-col justify-between relative",
          isPrimary && "border-gold shadow-lg shadow-gold/10",
          isPremium && "ring-2 ring-gold ring-offset-2 transform scale-105",
          className
        )}
      >
        {/* Popular Badge for Premium */}
        {isPremium && (
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
            <div className="bg-gradient-to-r from-gold to-yellow-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1 shadow-lg">
              <Star className="h-3 w-3 fill-current" />
              Most Popular
            </div>
          </div>
        )}

        <CardHeader className={cn(isPremium && "pt-8")}>
          <CardTitle className="text-xl font-proxima text-center">
            {plan.name}
          </CardTitle>
          <CardDescription className="text-center">
            {plan.shortDescription || ""}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="text-center space-y-6">
          {/* Main Subscription Price Display */}
          <div className="relative">
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-3">
                <div className="flex flex-col items-end">
                  <p className="text-lg text-muted-foreground line-through">
                    KSh {pricingConfig.regular.toLocaleString()}
                  </p>
                  <p className="text-4xl font-bold text-gold">
                    KSh {pricingConfig.discounted.toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm">
                    Save {Math.round(pricingConfig.discount)}%
                  </div>
                  <div className="text-xs text-green-600 font-medium">
                    KSh {(pricingConfig.regular - pricingConfig.discounted).toLocaleString()} off<br />
                    the first month
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">per month</p>
              
              {/* Mobile minimalist indicator */}
              <div className="md:hidden mt-3">
                <button 
                  onClick={() => setMobileDetailsOpen(!mobileDetailsOpen)}
                  className="w-full py-3 px-4 bg-muted/50 hover:bg-muted transition-colors rounded-lg flex items-center justify-center gap-2"
                >
                  <span className="text-sm font-medium text-foreground">
                    {mobileDetailsOpen ? "Hide" : "More"} pricing options
                  </span>
                  <ChevronDown className={cn("h-4 w-4 text-gold transition-transform", mobileDetailsOpen && "rotate-180")} />
                </button>
              </div>
            </div>
            
            {/* Desktop Dropdown - Inside Card */}
            <div className="hidden md:block">
              <div className="group relative inline-block w-full">
                <button className="w-full text-xs text-muted-foreground hover:text-gold transition-colors py-2 flex items-center justify-center gap-1">
                  <ChevronDown className="h-3 w-3" />
                  View all pricing options
                </button>
                
                <div className="absolute top-full left-0 right-0 mt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible 
                              transition-all duration-200 bg-card border border-border rounded-lg p-4 shadow-lg z-10">
                  <div className="space-y-4">
                    <div className="text-center">
                      <h4 className="font-semibold text-sm text-gold mb-2">MONTHLY SUBSCRIPTION</h4>
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <p className="text-sm text-muted-foreground line-through">
                          Regular: KSh {pricingConfig.regular.toLocaleString()}/month
                        </p>
                        <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-2 py-0.5 rounded text-xs font-bold">
                          -{Math.round(pricingConfig.discount)}%
                        </span>
                      </div>
                      {plan.annualDiscount && (
                        <p className="text-sm text-muted-foreground">
                          Save {plan.annualDiscount}% annually
                        </p>
                      )}
                    </div>
                    
                    <div className="border-t border-border pt-3">
                      <h4 className="font-semibold text-sm mb-2 text-center">PAY PER CLASS</h4>
                      {isTieredPlan ? (
                        <div className="space-y-2">
                          <div className="flex justify-center items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="w-6 h-6"
                              disabled={classCount <= pricingConfig.minClasses}
                              onClick={() => setClassCount(prev => Math.max(prev - 1, pricingConfig.minClasses))}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-lg font-bold">{classCount}</span>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="w-6 h-6"
                              disabled={classCount >= pricingConfig.maxClasses}
                              onClick={() => setClassCount(prev => Math.min(prev + 1, pricingConfig.maxClasses))}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-lg font-bold text-center">
                            KSh {oneTimePrice.toLocaleString()}
                            <span className="text-xs text-muted-foreground font-normal"> per class</span>
                          </p>
                          <p className="text-xs text-muted-foreground text-center">
                            Total: KSh {(oneTimePrice * classCount).toLocaleString()}
                          </p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <p className="text-lg font-bold">
                            KSh {oneTimePrice.toLocaleString()}/class
                          </p>
                          <p className="text-xs text-muted-foreground">
                            No commitment • Pay as you go
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Mobile Collapsible Details */}
          <div className={cn(
            "md:hidden overflow-hidden transition-all duration-300 space-y-4",
            mobileDetailsOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          )}>
            <div className="space-y-3 p-4 bg-muted rounded-lg">
              <div className="text-center">
                <h4 className="font-semibold text-sm text-gold mb-2">MONTHLY SUBSCRIPTION</h4>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <p className="text-sm text-muted-foreground line-through">
                    Regular: KSh {pricingConfig.regular.toLocaleString()}/month
                  </p>
                  <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-2 py-0.5 rounded text-xs font-bold">
                    -{Math.round(pricingConfig.discount)}%
                  </span>
                </div>
                {plan.annualDiscount && (
                  <p className="text-sm text-muted-foreground">
                    Save {plan.annualDiscount}% annually
                  </p>
                )}
              </div>
            </div>
            
            <div className="space-y-3 p-4 border border-border rounded-lg">
              <h4 className="font-semibold text-sm text-center">PAY PER CLASS</h4>
              {isTieredPlan ? (
                <>
                  <div className="flex justify-center items-center gap-3 mb-2">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="w-8 h-8"
                      disabled={classCount <= pricingConfig.minClasses}
                      onClick={() => setClassCount(prev => Math.max(prev - 1, pricingConfig.minClasses))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-2xl font-bold">
                      {classCount}
                    </span>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="w-8 h-8"
                      disabled={classCount >= pricingConfig.maxClasses}
                      onClick={() => setClassCount(prev => Math.min(prev + 1, pricingConfig.maxClasses))}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-2xl font-bold text-center">
                    KSh {oneTimePrice.toLocaleString()}
                    <span className="text-sm text-muted-foreground font-normal"> per class</span>
                  </p>
                  <p className="text-sm text-muted-foreground text-center">
                    Total: KSh {(oneTimePrice * classCount).toLocaleString()}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold text-center">
                    KSh {oneTimePrice.toLocaleString()}
                    <span className="text-muted-foreground text-sm font-normal">
                      /class
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground text-center">
                    No commitment • Pay as you go
                  </p>
                </>
              )}
            </div>
          </div>
          
          {/* Features */}
          <div className="space-y-2">
            {plan.features.map((feature, index) => (
              <div key={index} className="flex items-center">
                <Check className="h-4 w-4 text-gold mr-2 shrink-0" />
                <p className="text-sm text-left">{feature}</p>
              </div>
            ))}
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col gap-2">
          <Button
            className={cn("w-full", 
              isPrimary || isPremium
                ? "bg-gold hover:bg-gold/90 text-white font-medium" 
                : "bg-muted/70 hover:bg-muted text-foreground dark:bg-muted/30 dark:hover:bg-muted/40 dark:text-foreground"
            )}
            onClick={() => handleSubscribe('subscription')}
          >
            {isPremium ? "Get Premium Plan" : "Start Subscription"}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleSubscribe('one-time')}
          >
            {isTieredPlan ? `Buy ${classCount} Classes` : "Buy Single Class"}
          </Button>
        </CardFooter>
      </Card>
      
      <PaymentDialog
        isOpen={showPaymentDialog}
        onClose={() => setShowPaymentDialog(false)}
        paymentRequest={paymentRequest}
      />
    </>
  );
};

export default PricingCard;
