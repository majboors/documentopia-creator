
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestPayload {
  user_id: string;
  count: number;
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
    );

    // Check request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
      );
    }

    // Parse request body
    const { user_id, count } = await req.json() as RequestPayload;
    
    if (!user_id) {
      console.error('Missing user_id in request');
      return new Response(
        JSON.stringify({ error: 'Missing required field: user_id' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Updating usage for user: ${user_id} with count: ${count}`);

    // First check if user_subscriptions entry exists for this user
    const { data: existingUserSub, error: checkError } = await supabaseClient
      .from('user_subscriptions')
      .select('id, free_trial_used, is_subscribed')
      .eq('user_id', user_id)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking user subscription:', checkError);
      return new Response(
        JSON.stringify({ error: 'Error checking user subscription', details: checkError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('Existing user subscription:', existingUserSub);

    if (existingUserSub) {
      // If user is already subscribed, we don't need to mark trial as used
      if (existingUserSub.is_subscribed) {
        console.log('User is already subscribed, no need to mark trial as used');
        return new Response(
          JSON.stringify({ success: true, message: 'User is already subscribed' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // If trial is already used, don't do anything but return a message
      if (existingUserSub.free_trial_used) {
        console.log('Free trial already used for user:', user_id);
        return new Response(
          JSON.stringify({ success: true, message: 'Free trial already used' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update the existing record to mark trial as used
      const { data: updateData, error: updateError } = await supabaseClient
        .from('user_subscriptions')
        .update({ 
          free_trial_used: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingUserSub.id)
        .select();

      if (updateError) {
        console.error('Error updating user subscription:', updateError);
        return new Response(
          JSON.stringify({ error: 'Error updating user subscription', details: updateError }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      console.log('Successfully marked free trial as used:', updateData);
      return new Response(
        JSON.stringify({ success: true, message: 'Free trial marked as used', data: updateData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Create a new user_subscriptions entry
      console.log('Creating new user subscription entry');
      const { data: insertData, error: insertError } = await supabaseClient
        .from('user_subscriptions')
        .insert({
          user_id: user_id,
          free_trial_used: true,
          is_subscribed: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();

      if (insertError) {
        console.error('Error creating user subscription:', insertError);
        return new Response(
          JSON.stringify({ error: 'Error creating user subscription', details: insertError }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      console.log('Successfully created and marked free trial as used:', insertData);
      return new Response(
        JSON.stringify({ success: true, message: 'User subscription created with free trial used', data: insertData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Unexpected error in update-document-usage:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
