
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.36.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Parse the request body
    const { user_id, count } = await req.json();
    
    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "Missing user_id parameter" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    // First check if there's an existing record for this user
    const { data: existingData, error: fetchError } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", user_id)
      .maybeSingle();
    
    if (fetchError) {
      console.error("Error fetching user subscription:", fetchError);
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    // Update the record tracking free trial usage
    // Also update the updated_at timestamp
    const { data, error } = await supabase
      .from("user_subscriptions")
      .upsert({ 
        user_id, 
        free_trial_used: count > 0, // Track if free trial has been used
        is_subscribed: existingData?.is_subscribed || false, // Don't change subscription status
        updated_at: new Date().toISOString() 
      });
    
    if (error) {
      console.error("Error updating document usage:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    return new Response(
      JSON.stringify({ success: true, data }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Server error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
};

serve(handler);
