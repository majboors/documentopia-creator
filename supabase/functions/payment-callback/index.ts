
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
    const userId = url.searchParams.get('user_id'); // This would need to be passed in the redirect URL

    console.log('Payment callback received:', {
      paymentId,
      success,
      amount,
      txnResponseCode,
      userId
    });

    // If we have a valid payment
    if (paymentId && success && txnResponseCode === 'APPROVED' && userId) {
      // Create a subscription expiration date (30 days from now)
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 30);
      
      // Insert data into subscriptions table
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
        // Redirect to error page
        return new Response(null, {
          status: 302,
          headers: {
            ...corsHeaders,
            'Location': '/create?payment=error&reason=subscription_creation_failed'
          }
        });
      }

      // Record the successful payment transaction
      const { error: transactionError } = await supabaseClient
        .from('payment_transactions')
        .insert({
          user_id: userId,
          amount: amount / 100,
          status: 'completed',
          payment_reference: paymentId,
          subscription_id: subscriptionData?.[0]?.id,
          payment_data: { txn_response_code: txnResponseCode, success }
        });

      if (transactionError) {
        console.error('Error recording payment transaction:', transactionError);
        // Continue anyway as subscription was created successfully
      }

      // Update user_subscriptions to mark user as subscribed
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
        // Continue anyway as subscription was created successfully
      }

      // Redirect to success page
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': '/create?payment=success&subscription_id=' + subscriptionData?.[0]?.id
        }
      });
    } else {
      // Log the failed payment
      if (userId && paymentId) {
        const { error: logError } = await supabaseClient
          .from('payment_transactions')
          .insert({
            user_id: userId,
            amount: amount / 100,
            status: 'failed',
            payment_reference: paymentId,
            payment_data: { txn_response_code: txnResponseCode, success }
          });
          
        if (logError) {
          console.error('Error logging failed payment:', logError);
        }
      }
      
      // Payment failed, redirect to error page
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': '/create?payment=failed&reason=' + (txnResponseCode || 'unknown')
        }
      });
    }
  } catch (error) {
    console.error('Error processing payment callback:', error);
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': '/create?payment=error&reason=server_error'
      }
    });
  }
})
