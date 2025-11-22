import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  const { text, userId } = await req.json()
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  // Quota check
  const { data: userData, error: quotaError } = await supabase
    .from('users')
    .select('prompts_left, plan')
    .eq('id', userId)
    .single()

  if (quotaError || userData.prompts_left <= 0) {
    // Fallback rule-based
    const fallback = text.charAt(0).toUpperCase() + text.slice(1).replace(/\.\s*/g, '. ') + '. Clear and concise for AI.'
    return new Response(JSON.stringify({ polished: fallback, quota_left: 0, exceeded: true }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }

  try {
    // Gemini call (free tier)
    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') ?? '')
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
    const prompt = `You are an expert communication assistant. Transform the following request into a concise, friendly email under 120 words. Maintain a professional tone, clearly state the purpose, and end with a direct call to action proposing a meeting next week. Return only the final email draft in English, formatted in short paragraphs. If details are missing, make reasonable assumptions.\n\nOriginal request: ${text}`
    const result = await model.generateContent(prompt)
    const polished = await result.response.text()

    // Update quota
    const newQuota = userData.prompts_left - 1
    await supabase.from('users').update({ prompts_left: newQuota }).eq('id', userId)

    // Log usage
    await supabase.from('improvements').insert({ user_id: userId, input_text: text, output_text: polished, tokens_used: 100 })  // Approx

    return new Response(JSON.stringify({ polished, quota_left: newQuota }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  } catch (error) {
    // Fallback
    const fallback = text.charAt(0).toUpperCase() + text.slice(1).replace(/\.\s*/g, '. ') + '. Clear and concise for AI.'
    return new Response(JSON.stringify({ polished: fallback, quota_left: userData.prompts_left, error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})

