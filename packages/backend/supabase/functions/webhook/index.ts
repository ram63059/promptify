import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = { /* same as above */ }

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders })

  const payload = await req.json()
  const supabase = createClient(/* env */)

  // Verify Razorpay sig (stub—add real verification)
  if (payload.event === 'subscription.created') {
    const userId = payload.payload.subscription.customer_id  // Map to user
    const plan = payload.payload.subscription.plan_id.includes('pro') ? 'pro' : 'starter'
    const prompts = plan === 'pro' ? 200 : 20

    await supabase.from('users').update({ plan, prompts_left: prompts }).eq('id', userId)
  }

  return new Response(JSON.stringify({ received: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
})