
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', { apiVersion: '2023-10-16' });
    const signature = req.headers.get('stripe-signature');
    const body = await req.text();

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature!,
        Deno.env.get('STRIPE_WEBHOOK_SECRET')!
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new Response('Webhook signature verification failed', { status: 400 });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;

        if (!orderId) {
          console.error('No orderId in session metadata');
          break;
        }

        // Update order status
        const { error: orderError } = await supabaseClient
          .from('orders')
          .update({
            status: 'completed',
            payment_provider_id: session.id,
            payment_metadata: { session }
          })
          .eq('id', orderId);

        if (orderError) {
          console.error('Failed to update order:', orderError);
          break;
        }

        // Get order details to create subscription if needed
        const { data: order } = await supabaseClient
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();

        if (order?.order_type === 'subscription') {
          // Create or update subscription
          const validUntil = new Date();
          validUntil.setMonth(validUntil.getMonth() + 1); // 1 month subscription

          await supabaseClient
            .from('subscriptions')
            .upsert({
              user_id: order.user_id,
              type: order.item_id as string,
              status: 'active',
              valid_until: validUntil.toISOString(),
              order_id: orderId
            });
        }

        console.log('Payment completed successfully for order:', orderId);
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;

        if (orderId) {
          await supabaseClient
            .from('orders')
            .update({ status: 'cancelled' })
            .eq('id', orderId);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        // Handle subscription renewals
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Subscription payment succeeded:', invoice.id);
        break;
      }

      case 'invoice.payment_failed': {
        // Handle failed subscription payments
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Subscription payment failed:', invoice.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    const err = error as Error;
    console.error('Webhook error:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
