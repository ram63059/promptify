CREATE TABLE IF NOT EXISTS public.improvements (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  input_text TEXT NOT NULL,
  output_text TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.improvements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own improvements" ON public.improvements;

CREATE POLICY "Users can read own improvements"
ON public.improvements
FOR SELECT
USING (user_id = (SELECT auth.uid()));
