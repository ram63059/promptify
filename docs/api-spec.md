# Promptify API Spec

## Endpoints (Supabase Edge Functions)
- POST /functions/v1/improve: Enhance text (req: {text: string}, auth: JWT; res: {polished: string, quota_left: number}).
- POST /functions/v1/webhook: Razorpay subscription update (req: webhook payload; updates user plan/quota).

## Auth
- Supabase JWT: Short-lived (1h), auto-refresh. Magic links for smooth signup.

## DB Schema
- users: id (uuid), email, plan ('starter' | 'pro'), prompts_left (int), reset_date (date).
- improvements: user_id, input_text, output_text, timestamp.

## Models
- Gemini 2.5 Pro (free tier: 100 req/day; fallback: rule-based rewrite).

## Security
- RLS: Users read/update own row only.
- Rate Limit: 5/min per user.