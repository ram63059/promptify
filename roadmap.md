# Promptify Roadmap: From Idea to MVP

## The Vision
Promptify is a lightweight Chrome extension that helps users turn rough text into clearer and more effective AI prompts. It uses Gemini (free tier) for processing and connects to a small backend built with Supabase. The website (Next.js) will handle authentication, usage limits, and future paid plans.  
The goal is to make writing prompts faster and easier without switching tabs or losing focus.

## Why Build This?
- I wanted to learn how browser extensions, serverless functions, and full-stack flows work together in a real product.
- This project helps me practice clean architecture, Git workflow, and production-ready decisions.
- It also solves a personal problem—writing prompts becomes smoother without copy-pasting between tools.

## Phases (as of November 17, 2025)
1. **Setup & Planning** (Completed): Repo structure, initial docs, and roadmap.
2. **Extension**: Floating UI, simple auth, and local sideload testing.
3. **Backend**: Supabase DB, API routes, and Gemini integration.
4. **Website**: Next.js landing page, dashboard, and Razorpay integration for future paid tiers.
5. **Integration & Deployment**: Vercel + Supabase, end-to-end testing.
6. **Post-MVP**: More model options, analytics, and refinement.

## Tech Decisions
- Monorepo for shared types and smoother coordination between extension, site, and backend.
- Supabase for quick auth, RLS, and serverless functions.
- Basic handling for free-tier limits and fallback options.

## Learnings So Far
- Early planning and structure make the project easier to expand.
- Semantic commits help keep Git history clear and easy to navigate.

