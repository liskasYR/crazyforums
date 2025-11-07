-- Fix recursive policy on form_editors causing infinite recursion
DROP POLICY IF EXISTS "Form editors can view editors list" ON public.form_editors;

-- Allow creators to view all editors for their forms
CREATE POLICY "Creators can view all editors" ON public.form_editors
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.forms f
    WHERE f.id = form_editors.form_id AND f.created_by = auth.uid()
  )
);

-- Allow each editor to view their own editor row
CREATE POLICY "Editors can view themselves" ON public.form_editors
FOR SELECT TO authenticated
USING (form_editors.user_id = auth.uid());