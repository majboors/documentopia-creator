
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestPayload {
  paymentId: string;
  userId: string;
  success: boolean;
  amount: number;
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
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Check request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
      )
    }

    // Parse request body
    const { paymentId, userId, success, amount } = await req.json() as RequestPayload;
    
    if (!paymentId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // If payment was successful, update or create subscription
    if (success) {
      // Create expiration date (30 days from now)
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 30);
      
      // Insert data into subscriptions table
      const { data: subscriptionData, error: subscriptionError } = await supabaseClient
        .from('subscriptions')
        .insert({
          user_id: userId,
          is_active: true,
          payment_reference: paymentId,
          amount: amount,
          status: 'active',
          expires_at: expirationDate.toISOString()
        })
        .select();

      if (subscriptionError) {
        console.error('Error creating subscription:', subscriptionError);
        return new Response(
          JSON.stringify({ error: 'Failed to create subscription', details: subscriptionError }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      // Record the successful payment transaction
      const { error: transactionError } = await supabaseClient
        .from('payment_transactions')
        .insert({
          user_id: userId,
          amount: amount,
          status: 'completed',
          payment_reference: paymentId,
          subscription_id: subscriptionData?.[0]?.id,
          payment_data: { verify_payment: true }
        });

      if (transactionError) {
        console.error('Error recording payment transaction:', transactionError);
        // Continue anyway as the subscription was created successfully
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
        // Continue anyway as the subscription was created successfully
      }

      return new Response(
        JSON.stringify({ success: true, subscription: subscriptionData?.[0] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Payment failed, record the failed payment attempt
      const { error: logError } = await supabaseClient
        .from('payment_transactions')
        .insert({
          user_id: userId,
          amount: amount,
          status: 'failed',
          payment_reference: paymentId,
          payment_data: { verify_payment: true }
        });
        
      if (logError) {
        console.error('Error logging failed payment:', logError);
      }
      
      return new Response(
        JSON.stringify({ success: false, message: 'Payment verification failed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error processing payment verification:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
})
