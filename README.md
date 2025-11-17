# Promptify

Promptify is a lightweight Chrome extension and companion web app that transforms rough, unclear text into sharp, effective AI prompts.  
It runs on Gemini (free tier) and connects to a Supabase backend for authentication, usage tracking, and future billing options.

## Quick Start
1. Copy `.env.example` → `.env` (add your keys: Supabase, Gemini, Razorpay).
2. Extension: Sideload `packages/extension` in Chrome (Developer Mode).
3. Backend: `cd packages/backend && supabase init && supabase start`.
4. Site: `cd packages/site && npm install && npm run dev`.

## Story & Roadmap
See [roadmap.md](roadmap.md) for build journey.

## Structure
- `/packages/extension`: Chrome UI (floating panel).
- `/packages/backend`: Supabase functions/DB.
- `/packages/site`: Next.js landing/dashboard.



![Repo](https://github.com/ram63059/promptify) 