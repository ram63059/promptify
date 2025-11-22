-- Create users table (linked to Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'starter' CHECK (plan IN ('starter', 'pro')),
  prompts_left INTEGER DEFAULT 0,
  reset_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read/update own row
CREATE POLICY "Users can access own data" ON public.users
  FOR ALL USING (auth.uid() = id);

-- Index for performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_plan ON public.users(plan);

-- Trigger for monthly reset (run via Edge function cron later)
CREATE OR REPLACE FUNCTION reset_monthly_quota()
RETURNS TRIGGER AS $$  
BEGIN
  IF EXTRACT(MONTH FROM CURRENT_DATE) != EXTRACT(MONTH FROM NEW.reset_date) THEN
    NEW.prompts_left = CASE WHEN NEW.plan = 'starter' THEN 20 ELSE 200 END;
    NEW.reset_date = CURRENT_DATE;
  END IF;
  RETURN NEW;
END;
  $$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_reset_quota
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION reset_monthly_quota();