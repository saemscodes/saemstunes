
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MPESA-CALLBACK] ${step}${detailsStr}`);
};

interface TransactionData {
  amount?: number;
  mpesaReceiptNumber?: string;
  transactionDate?: string;
  phoneNumber?: string;
}

interface CallbackItem {
  Name: string;
  Value: string | number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("M-Pesa callback received");

    // Use service role key for database operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const callbackData = await req.json();
    logStep("Callback data received", callbackData);

    // Extract the callback data structure
    const { Body } = callbackData;
    if (!Body || !Body.stkCallback) {
      logStep("Invalid callback structure");
      return new Response(JSON.stringify({
        ResultCode: 1,
        ResultDesc: "Invalid callback structure"
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    const stkCallback = Body.stkCallback;
    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata
    } = stkCallback;

    logStep("Processing STK callback", {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc
    });

    // Find the corresponding payment session
    const { data: paymentSession, error: sessionError } = await supabaseClient
      .from('payment_sessions')
      .select('*, orders(*)')
      .eq('session_id', CheckoutRequestID)
      .single();

    if (sessionError || !paymentSession) {
      logStep("Payment session not found", { CheckoutRequestID, error: sessionError });
      return new Response(JSON.stringify({
        ResultCode: 1,
        ResultDesc: "Payment session not found"
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    logStep("Payment session found", paymentSession.id);

    // Process the payment result
    if (ResultCode === 0) {
      // Payment successful
      logStep("Payment successful");

      const transactionData: TransactionData = {};
      if (CallbackMetadata && CallbackMetadata.Item) {
        // Extract transaction details
        CallbackMetadata.Item.forEach((item: CallbackItem) => {
          switch (item.Name) {
            case 'Amount':
              transactionData.amount = item.Value as number;
              break;
            case 'MpesaReceiptNumber':
              transactionData.mpesaReceiptNumber = item.Value as string;
              break;
            case 'TransactionDate':
              transactionData.transactionDate = item.Value as string;
              break;
            case 'PhoneNumber':
              transactionData.phoneNumber = item.Value as string;
              break;
          }
        });
      }

      logStep("Transaction data extracted", transactionData);

      // Update the order status
      const { error: orderUpdateError } = await supabaseClient
        .from('orders')
        .update({
          status: 'completed',
          payment_completed_at: new Date().toISOString(),
          payment_details: {
            ...transactionData,
            ResultCode,
            ResultDesc,
            MerchantRequestID,
            CheckoutRequestID
          }
        })
        .eq('id', paymentSession.order_id);

      if (orderUpdateError) {
        logStep("Order update failed", orderUpdateError);
      } else {
        logStep("Order updated successfully");
      }

      // Update payment session
      const { error: sessionUpdateError } = await supabaseClient
        .from('payment_sessions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          metadata: {
            ...paymentSession.metadata,
            ...transactionData,
            ResultCode,
            ResultDesc
          }
        })
        .eq('id', paymentSession.id);

      if (sessionUpdateError) {
        logStep("Payment session update failed", sessionUpdateError);
      } else {
        logStep("Payment session updated successfully");
      }

    } else {
      // Payment failed or cancelled
      logStep("Payment failed", { ResultCode, ResultDesc });

      // Update order status to failed
      const { error: orderUpdateError } = await supabaseClient
        .from('orders')
        .update({
          status: 'failed',
          payment_details: {
            ResultCode,
            ResultDesc,
            MerchantRequestID,
            CheckoutRequestID
          }
        })
        .eq('id', paymentSession.order_id);

      if (orderUpdateError) {
        logStep("Order failure update failed", orderUpdateError);
      }

      // Update payment session
      const { error: sessionUpdateError } = await supabaseClient
        .from('payment_sessions')
        .update({
          status: 'failed',
          metadata: {
            ...paymentSession.metadata,
            ResultCode,
            ResultDesc
          }
        })
        .eq('id', paymentSession.id);

      if (sessionUpdateError) {
        logStep("Payment session failure update failed", sessionUpdateError);
      }
    }

    // Return success response to M-Pesa
    return new Response(JSON.stringify({
      ResultCode: 0,
      ResultDesc: "Callback processed successfully"
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error: unknown) {
    const err = error as Error;
    logStep("Callback processing error", err);
    console.error('Error stack:', err.stack);

    return new Response(JSON.stringify({
      ResultCode: 1,
      ResultDesc: "Internal server error"
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
