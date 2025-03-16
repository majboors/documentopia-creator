
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Get URL parameters
    const url = new URL(req.url);
    const paymentId = url.searchParams.get('id');
    const success = url.searchParams.get('success') === 'true';
    const amount = parseInt(url.searchParams.get('amount_cents') || '0', 10);
    const txnResponseCode = url.searchParams.get('txn_response_code');
    const userId = url.searchParams.get('user_id');

    console.log('Payment fallback received:', {
      paymentId,
      success,
      amount,
      txnResponseCode,
      userId
    });

    // If we don't have a user ID, redirect to general error page
    if (!userId) {
      console.error('Payment fallback missing user ID');
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': '/create?payment=error&reason=missing_user_id'
        }
      });
    }

    // If payment was unsuccessful, record the failed attempt and redirect
    if (!success || txnResponseCode !== 'APPROVED') {
      console.log('Payment was unsuccessful', { txnResponseCode, success });
      
      // Record the failed payment
      const { error: logError } = await supabaseClient
        .from('payment_transactions')
        .insert({
          user_id: userId,
          amount: amount / 100,
          status: 'failed',
          payment_reference: paymentId,
          payment_data: { txn_response_code: txnResponseCode, success, fallback: true }
        });
        
      if (logError) {
        console.error('Error logging failed payment:', logError);
      }
        
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': '/create?payment=failed&reason=' + (txnResponseCode || 'unknown')
        }
      });
    }

    // Payment was successful
    console.log('Processing successful payment:', { paymentId, userId });

    // 1. Create a subscription record
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 30); // 30 days from now
    
    const { data: subscriptionData, error: subscriptionError } = await supabaseClient
      .from('subscriptions')
      .insert({
        user_id: userId,
        is_active: true,
        payment_reference: paymentId,
        amount: amount / 100, // Convert from cents to main currency unit
        expires_at: expirationDate.toISOString(),
        status: 'active'
      })
      .select();

    if (subscriptionError) {
      console.error('Error creating subscription:', subscriptionError);
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': '/create?payment=error&reason=subscription_creation_failed'
        }
      });
    }

    // 2. Record the successful payment transaction
    const { error: transactionError } = await supabaseClient
      .from('payment_transactions')
      .insert({
        user_id: userId,
        amount: amount / 100,
        status: 'completed',
        payment_reference: paymentId,
        subscription_id: subscriptionData?.[0]?.id,
        payment_data: { txn_response_code: txnResponseCode, success, fallback: true }
      });

    if (transactionError) {
      console.error('Error recording payment transaction:', transactionError);
      // Continue anyway, as the subscription was created successfully
    }

    // 3. Update user_subscriptions to mark user as subscribed
    const { error: userSubError } = await supabaseClient
      .from('user_subscriptions')
      .upsert({
        user_id: userId,
        is_subscribed: true,
        payment_reference: paymentId,
        subscription_start_date: new Date().toISOString(),
        subscription_end_date: expirationDate.toISOString(),
        updated_at: new Date().toISOString()
      });

    if (userSubError) {
      console.error('Error updating user subscription status:', userSubError);
      // Continue anyway, as the main subscription record was created
    }

    // Redirect to success page
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': '/create?payment=success&subscription_id=' + subscriptionData?.[0]?.id
      }
    });
  } catch (error) {
    console.error('Error processing payment fallback:', error);
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': '/create?payment=error&reason=server_error'
      }
    });
  }
})
