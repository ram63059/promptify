DROP POLICY IF EXISTS "Users can read own improvements" ON public.improvements;

CREATE POLICY "Users can read own improvements"
ON public.improvements
FOR SELECT
USING (user_id = (SELECT auth.uid()));
