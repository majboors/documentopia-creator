
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
      // Insert data into subscriptions table
      const { data: subscriptionData, error: subscriptionError } = await supabaseClient
        .from('subscriptions')
        .insert({
          user_id: userId,
          is_active: true,
          payment_reference: paymentId,
          amount: amount / 100, // Convert from cents to main currency unit
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        })
        .select()

      if (subscriptionError) {
        console.error('Error creating subscription:', subscriptionError)
        // Redirect to error page
        return new Response(null, {
          status: 302,
          headers: {
            ...corsHeaders,
            'Location': '/create?payment=error'
          }
        })
      }

      // Redirect to success page
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': '/create?payment=success'
        }
      })
    } else {
      // Payment failed, redirect to error page
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': '/create?payment=failed'
        }
      })
    }
  } catch (error) {
    console.error('Error processing payment callback:', error)
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': '/create?payment=error'
      }
    })
  }
})
