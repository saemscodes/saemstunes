import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { SupabaseClient } from "@supabase/supabase-js";
import { toast } from "sonner";

type PurchaseEntity = 'course' | 'module' | 'class' | 'lesson';

export const usePayment = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const supabaseCustom = supabase as unknown as SupabaseClient;

  // Check if user has access to a specific entity
  const checkAccess = async (entityType: PurchaseEntity, entityId: string) => {
    if (!user) return false;

    // 1. Check direct purchase
    const { data: purchase } = await supabaseCustom
      .from("custom_purchases")
      .select("*")
      .eq("user_id", user.id)
      .eq("payment_status", "completed")
      .contains(
        entityType === 'course' ? 'selected_courses' :
          entityType === 'module' ? 'selected_modules' :
            entityType === 'class' ? 'selected_classes' : 'selected_lessons',
        [entityId]
      )
      .maybeSingle();

    if (purchase) return true;

    // 2. Access via subscription (handled in AuthContext usually, but here as backup)
    // Add logic here if needed

    return false;
  };

  // Create intent
  const initiatePurchase = useMutation({
    mutationFn: async ({
      items,
      totalAmount,
      phoneNumber,
      currency = 'KES'
    }: {
      items: { type: PurchaseEntity, id: string }[],
      totalAmount: number,
      phoneNumber?: string,
      currency?: string
    }) => {
      if (!user) throw new Error("Authentication required");

      const courses = items.filter(i => i.type === 'course').map(i => i.id);
      const modules = items.filter(i => i.type === 'module').map(i => i.id);
      const classes = items.filter(i => i.type === 'class').map(i => i.id);
      const lessons = items.filter(i => i.type === 'lesson').map(i => i.id);

      const { data, error } = await supabaseCustom
        .from("custom_purchases")
        .insert({
          user_id: user.id,
          selected_courses: courses,
          selected_modules: modules,
          selected_classes: classes,
          selected_lessons: lessons,
          total_items: items.length,
          base_price: totalAmount,
          final_price: totalAmount,
          currency,
          payment_status: 'pending',
          payment_method: 'mpesa',
          phone_number: phoneNumber || ''
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.info("STK Push initiated. Check your phone to complete the payment.");
    },
    onError: (error) => {
      toast.error(`Purchase failed: ${error.message}`);
    }
  });

  // Confirm purchase (typically called after STK Push or manual verification)
  const confirmPurchase = useMutation({
    mutationFn: async (purchaseId: string) => {
      const { data, error } = await supabaseCustom
        .from("custom_purchases")
        .update({
          payment_status: 'completed',
          access_granted_at: new Date().toISOString(),
          transaction_id: `txn_${Math.random().toString(36).substring(7)}`
        })
        .eq("id", purchaseId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Purchase confirmed! Content unlocked.");
      queryClient.invalidateQueries({ queryKey: ["learning-content"] });
    }
  });

  return {
    initiatePurchase,
    confirmPurchase,
    checkAccess
  };
};
