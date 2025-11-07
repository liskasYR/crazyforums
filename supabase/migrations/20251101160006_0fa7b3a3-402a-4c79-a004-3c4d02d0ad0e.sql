-- Drop problematic policies
DROP POLICY IF EXISTS "Form editors can insert styles" ON public.form_styles;
DROP POLICY IF EXISTS "Form editors can update styles" ON public.form_styles;
DROP POLICY IF EXISTS "Form editors can insert questions" ON public.questions;
DROP POLICY IF EXISTS "Form editors can update questions" ON public.questions;
DROP POLICY IF EXISTS "Form editors can delete questions" ON public.questions;
DROP POLICY IF EXISTS "Form editors can insert options" ON public.question_options;
DROP POLICY IF EXISTS "Form editors can update options" ON public.question_options;
DROP POLICY IF EXISTS "Form editors can delete options" ON public.question_options;

-- Create security definer function to check if user is form editor
CREATE OR REPLACE FUNCTION public.is_form_editor(_user_id uuid, _form_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.forms 
    WHERE id = _form_id AND (
      created_by = _user_id OR 
      EXISTS (SELECT 1 FROM public.form_editors WHERE form_id = _form_id AND user_id = _user_id)
    )
  )
$$;

-- Recreate policies using the security definer function
CREATE POLICY "Form editors can insert styles" ON public.form_styles 
  FOR INSERT TO authenticated 
  WITH CHECK (public.is_form_editor(auth.uid(), form_id));

CREATE POLICY "Form editors can update styles" ON public.form_styles 
  FOR UPDATE TO authenticated 
  USING (public.is_form_editor(auth.uid(), form_id));

CREATE POLICY "Form editors can insert questions" ON public.questions 
  FOR INSERT TO authenticated 
  WITH CHECK (public.is_form_editor(auth.uid(), form_id));

CREATE POLICY "Form editors can update questions" ON public.questions 
  FOR UPDATE TO authenticated 
  USING (public.is_form_editor(auth.uid(), form_id));

CREATE POLICY "Form editors can delete questions" ON public.questions 
  FOR DELETE TO authenticated 
  USING (public.is_form_editor(auth.uid(), form_id));

-- Create security definer function for question options
CREATE OR REPLACE FUNCTION public.is_question_editor(_user_id uuid, _question_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.questions q
    JOIN public.forms f ON q.form_id = f.id
    WHERE q.id = _question_id AND (
      f.created_by = _user_id OR 
      EXISTS (SELECT 1 FROM public.form_editors WHERE form_id = f.id AND user_id = _user_id)
    )
  )
$$;

CREATE POLICY "Form editors can insert options" ON public.question_options 
  FOR INSERT TO authenticated 
  WITH CHECK (public.is_question_editor(auth.uid(), question_id));

CREATE POLICY "Form editors can update options" ON public.question_options 
  FOR UPDATE TO authenticated 
  USING (public.is_question_editor(auth.uid(), question_id));

CREATE POLICY "Form editors can delete options" ON public.question_options 
  FOR DELETE TO authenticated 
  USING (public.is_question_editor(auth.uid(), question_id));