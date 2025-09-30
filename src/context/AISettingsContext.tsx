import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AISettings {
  id: string;
  feature_name: string;
  is_enabled: boolean;
  allowed_tiers: string[];
  require_subscription: boolean;
}

interface AISettingsContextType {
  settings: AISettings | null;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
  updateSettings: (updates: Partial<AISettings>) => Promise<void>;
}

const AISettingsContext = createContext<AISettingsContextType | undefined>(undefined);

export const AISettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AISettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('ai_feature_settings')
        .select('*')
        .eq('feature_name', 'saemstunes_ai')
        .single();

      if (error) throw error;
      setSettings(data);
    } catch (error) {
      console.error('Error fetching AI settings:', error);
      toast({
        title: "Error",
        description: "Failed to load AI settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<AISettings>) => {
    try {
      const { data, error } = await supabase
        .from('ai_feature_settings')
        .update(updates)
        .eq('feature_name', 'saemstunes_ai')
        .select()
        .single();

      if (error) throw error;
      
      setSettings(data);
      toast({
        title: "Success",
        description: "AI settings updated successfully",
      });
    } catch (error) {
      console.error('Error updating AI settings:', error);
      toast({
        title: "Error",
        description: "Failed to update AI settings",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <AISettingsContext.Provider value={{
      settings,
      isLoading,
      refreshSettings: fetchSettings,
      updateSettings,
    }}>
      {children}
    </AISettingsContext.Provider>
  );
};

export const useAISettings = () => {
  const context = useContext(AISettingsContext);
  if (context === undefined) {
    throw new Error("useAISettings must be used within an AISettingsProvider");
  }
  return context;
};
