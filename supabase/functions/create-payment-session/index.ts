
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-PAYMENT-SESSION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    logStep("Function started");

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      logStep("No Authorization header found");
      return new Response(JSON.stringify({
        error: 'Authentication required',
        message: 'Please sign in to proceed with payment. You need an account to purchase subscriptions and book classes.',
        requiresAuth: true
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '', 
      Deno.env.get('SUPABASE_ANON_KEY') ?? '', 
      {
        global: {
          headers: {
            Authorization: authHeader
          }
        }
      }
    );

    logStep('Attempting to get user...');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    logStep('User lookup result', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      error: userError?.message
    });

    if (userError || !user) {
      logStep('User authentication failed', userError);
      return new Response(JSON.stringify({
        error: 'Authentication required',
        message: 'Please sign in to proceed with payment. You need an account to purchase subscriptions and book classes.',
        requiresAuth: true,
        details: userError?.message
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    if (!user?.email) {
      logStep('User has no email');
      return new Response(JSON.stringify({
        error: 'User email not found',
        message: 'Your account needs a valid email address to process payments.'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    logStep('Parsing request body...');
    const requestBody = await req.json();
    const { orderType, itemId, itemName, amount, currency, paymentMethod, successUrl, cancelUrl, userPhone } = requestBody;

    logStep('Request data', {
      orderType,
      itemId,
      paymentMethod,
      amount,
      currency,
      hasSuccessUrl: !!successUrl,
      hasUserPhone: !!userPhone
    });

    // Validate required fields
    if (!orderType || !paymentMethod || !amount || !currency) {
      logStep('Missing required fields');
      return new Response(JSON.stringify({
        error: 'Missing required fields: orderType, paymentMethod, amount, currency'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Validate phone number for M-Pesa
    if (paymentMethod === 'mpesa' && !userPhone) {
      return new Response(JSON.stringify({
        error: 'Phone number required for M-Pesa payments',
        message: 'Please provide your M-Pesa phone number to proceed with payment.'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    logStep('Creating order record...');
    // Create order record
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .insert({
        user_id: user.id,
        order_type: orderType,
        item_id: itemId,
        item_name: itemName,
        amount,
        currency,
        payment_method: paymentMethod,
        status: 'pending'
      })
      .select()
      .single();

    if (orderError) {
      logStep('Order creation failed', orderError);
      return new Response(JSON.stringify({
        error: `Failed to create order: ${orderError.message}`,
        code: orderError.code,
        details: orderError.details
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    logStep('Order created successfully', order.id);

    let sessionData;
    switch (paymentMethod) {
      case 'paystack': {
        logStep('Processing Paystack payment...');
        const paystackKey = Deno.env.get('PAYSTACK_SECRET_KEY_TEST');
        if (!paystackKey) {
          throw new Error('Paystack secret key not configured');
        }

        const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${paystackKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: user.email,
            amount: amount,
            currency: currency,
            reference: `ST_${order.id}`,
            callback_url: successUrl || `${req.headers.get('origin')}/payment-success`,
            metadata: {
              orderId: order.id,
              orderType: orderType,
              itemName: itemName
            }
          })
        });

        const paystackData = await paystackResponse.json();
        logStep('Paystack response', paystackData);

        if (!paystackData.status) {
          throw new Error(`Paystack error: ${paystackData.message}`);
        }

        sessionData = {
          sessionId: paystackData.data.reference,
          url: paystackData.data.authorization_url,
          provider: 'paystack'
        };
        break;
      }
      case 'remitly': {
        logStep('Processing Remitly payment...');
        const recipientName = "Saem's Tunes";
        const recipientPhone = "+254798903373";
        const amountUSD = (amount / 100).toFixed(2);

        const remitlyUrl = `https://www.remitly.com/us/en/kenya/send-money?` +
          `amount=${amountUSD}&` +
          `recipient_name=${encodeURIComponent(recipientName)}&` +
          `recipient_phone=${encodeURIComponent(recipientPhone)}&` +
          `delivery_method=mobile_money&` +
          `source=saems_tunes`;

        sessionData = {
          sessionId: `remitly_${Date.now()}`,
          url: remitlyUrl,
          provider: 'remitly'
        };
        break;
      }
      case 'mpesa': {
        logStep('Processing M-Pesa payment...');
        
        const consumerKey = Deno.env.get('MPESA_CONSUMER_KEY');
        const consumerSecret = Deno.env.get('MPESA_CONSUMER_SECRET');
        const passkey = Deno.env.get('MPESA_PASSKEY');
        const shortcode = '174379'; // Sandbox shortcode
        const callbackUrl = `${req.headers.get('origin')}/api/mpesa-callback`;

        if (!consumerKey || !consumerSecret || !passkey) {
          throw new Error('M-Pesa credentials not configured properly');
        }

        // Generate timestamp and password
        const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
        const password = btoa(shortcode + passkey + timestamp);

        logStep('M-Pesa credentials prepared', { timestamp, shortcode });

        // Step 1: Get access token
        const auth = btoa(`${consumerKey}:${consumerSecret}`);
        const tokenRes = await fetch('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
          headers: {
            Authorization: `Basic ${auth}`,
          },
        });

        if (!tokenRes.ok) {
          throw new Error(`Failed to get M-Pesa token: ${tokenRes.statusText}`);
        }

        const tokenData = await tokenRes.json();
        const token = tokenData.access_token;
        
        if (!token) {
          throw new Error('No access token received from M-Pesa');
        }

        logStep('M-Pesa token obtained', { tokenLength: token?.length });

        // Step 2: Initiate STK Push
        const stkPushData = {
          BusinessShortCode: shortcode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: 'CustomerPayBillOnline',
          Amount: Math.floor(amount / 100), // Convert from cents to shillings
          PartyA: userPhone.replace(/\+/, ''), // Remove + if present
          PartyB: shortcode,
          PhoneNumber: userPhone.replace(/\+/, ''),
          CallBackURL: callbackUrl,
          AccountReference: `SaemsTunes_${order.id}`,
          TransactionDesc: itemName || 'Saem Tunes Payment'
        };

        logStep('Initiating STK Push', stkPushData);

        const stkRes = await fetch('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(stkPushData)
        });

        if (!stkRes.ok) {
          throw new Error(`M-Pesa STK Push failed: ${stkRes.statusText}`);
        }

        const stkData = await stkRes.json();
        logStep('M-Pesa STK Push response', stkData);

        if (stkData.ResponseCode !== '0') {
          throw new Error(`M-Pesa STK Push error: ${stkData.ResponseDescription || 'Unknown error'}`);
        }

        sessionData = {
          sessionId: stkData.CheckoutRequestID,
          url: null, // No redirect URL for M-Pesa
          provider: 'mpesa',
          checkoutRequestId: stkData.CheckoutRequestID,
          merchantRequestId: stkData.MerchantRequestID
        };
        break;
      }
      default:
        throw new Error(`Unsupported payment method: ${paymentMethod}`);
    }

    logStep('Storing payment session...');
    const { error: sessionError } = await supabaseClient
      .from('payment_sessions')
      .insert({
        order_id: order.id,
        session_id: sessionData.sessionId,
        provider: paymentMethod,
        session_url: sessionData.url,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        metadata: sessionData
      });

    if (sessionError) {
      logStep('Payment session storage failed', sessionError);
      return new Response(JSON.stringify({
        error: `Failed to store payment session: ${sessionError.message}`,
        code: sessionError.code
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    logStep('Payment session created successfully', sessionData.sessionId);

    return new Response(JSON.stringify({
      success: true,
      orderId: order.id,
      sessionData
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error: unknown) {
    const err = error as Error;
    logStep('Payment session creation error', err);
    console.error('Error stack:', err.stack);
    
    return new Response(JSON.stringify({
      error: err.message,
      type: err.constructor.name
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
