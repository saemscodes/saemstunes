import React, { useState, useEffect, useRef } from 'react';
import { Heart, X, Gift, Copy, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const DONATION_OPTIONS = [
  {
    name: 'Ko-fi',
    url: 'https://ko-fi.com/saemstunes',
    description: 'Help fund our vision',
    icon: '☕'
  },
  {
    name: 'M-Pesa + International Donations',
    url: 'https://zenlipa.co.ke/c/8UsifM',
    description: 'Partner with us',
    icon: '📱'
  }
];

const MAX_WIDGET_DISPLAY_TIME = 20 * 60 * 1000;

interface DonationWidgetProps {
  onTimedOut?: () => void;
  isVisible?: boolean;
  offsetY?: number;
  onClose?: () => void;
}

const DonationWidget: React.FC<DonationWidgetProps> = ({ onTimedOut, isVisible: controlledVisibility, offsetY = 140, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [opacity, setOpacity] = useState(1);
  const [redirecting, setRedirecting] = useState(false);
  
  const widgetMountTimeRef = useRef<number>(Date.now());
  const visibilityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hoverInactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const opacityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const clearTimers = () => {
    [visibilityTimerRef, timeoutTimerRef, hoverInactivityTimerRef, opacityTimerRef].forEach(timerRef => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    });
  };

  useEffect(() => {
    if (isHovering || isExpanded) {
      setOpacity(1);
      if (opacityTimerRef.current) {
        clearTimeout(opacityTimerRef.current);
        opacityTimerRef.current = null;
      }
    } else {
      opacityTimerRef.current = setTimeout(() => {
        setOpacity(0.2);
      }, 5000);
    }

    return () => {
      if (opacityTimerRef.current) {
        clearTimeout(opacityTimerRef.current);
      }
    };
  }, [isHovering, isExpanded]);

  const handleMouseEnter = () => {
    if (!isExpanded) {
      setIsHovering(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isExpanded) {
      setIsHovering(false);
    }
  };

  useEffect(() => {
    if (controlledVisibility !== undefined) {
      setIsVisible(controlledVisibility);
      return;
    }

    visibilityTimerRef.current = setTimeout(() => {
      setIsVisible(true);
    }, 5000);
    
    timeoutTimerRef.current = setTimeout(() => {
      if (!isExpanded) {
        setIsVisible(false);
        setHasTimedOut(true);
        if (onTimedOut) onTimedOut();
      }
    }, MAX_WIDGET_DISPLAY_TIME);
    
    return clearTimers;
  }, [isExpanded, onTimedOut, controlledVisibility]);

  const handleExpand = () => {
    setIsExpanded(true);
  };

  const handleCollapse = () => {
    setIsExpanded(false);
    if (onClose) {
      onClose();
    }
  };

  const handleMpesaRedirect = () => {
    setRedirecting(true);

    const mpesaOption = DONATION_OPTIONS.find(option =>
      option.name.includes('M-Pesa')
      );
    const redirectUrl = mpesaOption ? mpesaOption.url : 'https://zenlipa.co.ke/c/8UsifM';

    
    toast({
      title: "Redirecting to Secure Payment",
      description: "You will be taken to ZenLipa for M-Pesa processing",
      duration: 2500,
    });
    
    setTimeout(() => {
      window.open(redirectUrl, '_blank', 'noopener,noreferrer');
      setRedirecting(false);
    }, 800);
  };
  

  return (
    <div
      data-donation-trigger
      className="fixed z-30 transition-all duration-500 ease-out"
      style={{
        zIndex: 30,
        opacity,
        bottom: `${offsetY}px`,
        ...(isExpanded ? {
          top: '50%',
          bottom: 'auto',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        } : {
          right: '2rem',
        })
      }}
    >
      {!isExpanded ? (
        <div
          className="relative group cursor-pointer"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={handleExpand}
        >
          <div className="relative w-48 h-12 flex items-center">
            <div 
              className={`absolute right-12 top-0 h-12 flex items-center transition-all duration-500 ease-out ${
                isHovering 
                  ? 'opacity-100 translate-x-0' 
                  : 'opacity-0 translate-x-4 pointer-events-none'
              }`}
            >
              <div 
                className={`absolute inset-0 rounded-full transition-all duration-500 ease-out ${
                  isHovering 
                    ? 'bg-[hsl(20_14%_21%)] backdrop-blur-sm scale-100' 
                    : 'bg-[hsl(20_14%_21%)]/0 backdrop-blur-none scale-75'
                }`} 
              />
              <span 
                className={`relative px-4 py-2 text-white font-semibold text-sm whitespace-nowrap transition-all duration-500 ease-out drop-shadow-lg ${
                  isHovering 
                    ? 'opacity-100 scale-100' 
                    : 'opacity-0 scale-90'
                }`}
              >
                Support Us
              </span>
            </div>
            <div 
              className={`absolute right-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ease-out shadow-2xl ${
                isHovering
                  ? 'bg-gradient-to-br from-[#D4A936] via-[#A67C00] to-[#7A5A00] shadow-[#A67C00]/50 scale-110'
                  : 'bg-gradient-to-br from-[#A67C00] via-[#7A5A00] to-[#5A4A00] shadow-[#7A5A00]/40 scale-100'
              }`}
            >
              <div className="absolute inset-1 rounded-full bg-gradient-to-br from-[#D4A936]/30 to-transparent" />
              <Heart 
                className={`relative z-10 transition-all duration-300 ease-out ${
                  isHovering 
                    ? 'h-6 w-6 text-white drop-shadow-lg' 
                    : 'h-5 w-5 text-white/90'
                }`} 
                fill={isHovering ? "white" : "transparent"}
              />
              <div 
                className={`absolute inset-0 rounded-full bg-[#D4A936] transition-all duration-1000 ease-out ${
                  isHovering 
                    ? 'animate-ping opacity-20' 
                    : 'opacity-0'
                }`} 
              />
            </div>
          </div>
          {isHovering && (
            <>
              <div className="absolute top-2 right-2 w-1 h-1 bg-[#D4A936] rounded-full animate-bounce opacity-60" style={{ animationDelay: '0s' }} />
              <div className="absolute top-4 right-6 w-0.5 h-0.5 bg-[#A67C00] rounded-full animate-bounce opacity-40" style={{ animationDelay: '0.2s' }} />
              <div className="absolute top-6 right-3 w-1 h-1 bg-[#7A5A00] rounded-full animate-bounce opacity-50" style={{ animationDelay: '0.4s' }} />
            </>
          )}
        </div>
      ) : (
        <div className="w-80 bg-white dark:bg-[hsl(20_14%_15%)] backdrop-blur-xl border border-[hsl(20_5%_85%)] dark:border-[hsl(20_14%_25%)] rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-[#A67C00]/20 to-[#7A5A00]/20 dark:from-[#A67C00]/30 dark:to-[#7A5A00]/30 p-4 border-b border-[hsl(20_5%_85%)] dark:border-[hsl(20_14%_25%)]">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center text-[hsl(20_14%_21%)] dark:text-[hsl(0_0%_95%)]">
                <div className="relative mr-3">
                  <Gift className="h-6 w-6 text-[#A67C00] dark:text-[#D4A936] drop-shadow-sm" />
                  <div className="absolute inset-0 bg-[#A67C00] blur-sm opacity-30 rounded-full" />
                </div>
                Support Saem's Tunes
              </h3>
              <button
                className="relative group rounded-full p-2 hover:bg-[#A67C00]/10 dark:hover:bg-[#D4A936]/10 transition-all duration-300 backdrop-blur-sm"
                onClick={handleCollapse}
              >
                <X className="h-4 w-4 text-[hsl(43_10%_40%)] dark:text-[hsl(0_0%_65%)] group-hover:text-[hsl(20_14%_21%)] dark:group-hover:text-[hsl(0_0%_95%)] transition-colors" />
                <div className="absolute inset-0 rounded-full bg-[#A67C00]/10 scale-0 group-hover:scale-100 transition-transform duration-300" />
              </button>
            </div>
          </div>
          <div className="p-4">
             <p className="text-sm text-[hsl(20_14%_21%)] dark:text-[hsl(0_0%_95%)] mb-4 leading-relaxed text-center">
                Empower musicians, equip worship leaders, and raise up the next generation to represent Christ through music.
            </p>
            <div className="space-y-3">
              {DONATION_OPTIONS.map((option, index) => (
                <div 
                  key={option.name}
                  className="group relative p-4 rounded-xl flex items-center justify-between hover:bg-[hsl(43_30%_90%)] dark:hover:bg-[hsl(20_14%_20%)] transition-all duration-300 border border-[hsl(20_5%_85%)] dark:border-[hsl(20_14%_25%)] backdrop-blur-sm"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-[hsl(43_30%_90%)]/30 dark:via-[hsl(20_14%_20%)]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="flex items-center relative z-10">
                    <div className="text-2xl mr-4 transition-transform duration-300 group-hover:scale-110">
                      {option.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-[hsl(20_14%_21%)] dark:text-[hsl(0_0%_95%)] mb-1">{option.name}</p>
                      <p className="text-xs text-[hsl(43_10%_40%)] dark:text-[hsl(0_0%_65%)]">{option.description}</p>
                    </div>
                  </div>
                  {option.name.includes('M-Pesa') ? (
                    <button
                      onClick={handleMpesaRedirect}
                      disabled={redirecting}
                      className={`relative z-10 px-4 py-2 text-sm rounded-lg flex items-center backdrop-blur-sm transition-all duration-300 shadow-lg border border-[#A67C00]/20 dark:border-[#D4A936]/20 ${
                        redirecting
                          ? 'bg-[hsl(43_30%_80%)] dark:bg-[hsl(20_14%_30%)] text-[hsl(43_10%_40%)] dark:text-[hsl(0_0%_65%)] cursor-not-allowed'
                          : 'bg-[#A67C00] hover:bg-[#7A5A00] text-white hover:scale-105'
                      }`}
                    >
                      {redirecting ? (
                        <span className="flex items-center">
                          <span className="mr-2">Redirecting</span>
                          <div className="h-3 w-3 border-2 border-t-transparent border-current rounded-full animate-spin" />
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <span className="mr-2">Donate</span>
                          <ExternalLink className="h-3 w-3" />
                        </span>
                      )}
                    </button>
                  ) : (
                    <a
                      href={option.url}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="relative z-10 px-4 py-2 text-sm rounded-lg flex items-center bg-[hsl(20_14%_21%)] dark:bg-[hsl(20_14%_30%)] hover:bg-[hsl(20_14%_15%)] dark:hover:bg-[hsl(20_14%_35%)] backdrop-blur-sm transition-all duration-300 text-white hover:scale-105 shadow-lg"
                    >
                      <span className="mr-2">Visit</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
            <button
              className="w-full mt-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-[#A67C00] to-[#7A5A00] hover:from-[#7A5A00] hover:to-[#5A4A00] text-white transition-all duration-300 shadow-lg hover:shadow-[#A67C00]/25 hover:scale-[1.02] backdrop-blur-sm border border-[#A67C00]/20"
              onClick={handleCollapse}
            >
              Maybe Later
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonationWidget;
