-- Create forms table
CREATE TABLE public.forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create form_styles table
CREATE TABLE public.form_styles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid REFERENCES public.forms(id) ON DELETE CASCADE NOT NULL UNIQUE,
  background_color text DEFAULT '#ffffff',
  text_color text DEFAULT '#000000',
  primary_color text DEFAULT '#3b82f6',
  border_radius text DEFAULT 'medium',
  spacing text DEFAULT 'normal',
  background_type text DEFAULT 'solid' CHECK (background_type IN ('solid', 'gradient', 'image')),
  gradient_start text,
  gradient_end text,
  gradient_direction text,
  background_image text,
  success_message text DEFAULT 'תודה רבה! הטופס נשלח בהצלחה.',
  closed_message text DEFAULT 'הטופס סגור כרגע. אנא נסה שוב מאוחר יותר.',
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create questions table
CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid REFERENCES public.forms(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('text', 'textarea', 'multiple-choice', 'checkbox', 'number')),
  title text NOT NULL,
  required boolean DEFAULT false NOT NULL,
  position integer NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create question_options table
CREATE TABLE public.question_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
  label text NOT NULL,
  position integer NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create form_responses table
CREATE TABLE public.form_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid REFERENCES public.forms(id) ON DELETE CASCADE NOT NULL,
  submitted_at timestamptz DEFAULT now() NOT NULL,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- Create form_editors table (for sharing editor access)
CREATE TABLE public.form_editors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid REFERENCES public.forms(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(form_id, user_id)
);

-- Enable RLS
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_editors ENABLE ROW LEVEL SECURITY;

-- RLS Policies for forms
CREATE POLICY "Anyone can view forms" ON public.forms FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create forms" ON public.forms FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Form creators and editors can update" ON public.forms FOR UPDATE TO authenticated 
  USING (
    created_by = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.form_editors WHERE form_id = forms.id AND user_id = auth.uid())
  );
CREATE POLICY "Form creators can delete" ON public.forms FOR DELETE TO authenticated USING (created_by = auth.uid());

-- RLS Policies for form_styles
CREATE POLICY "Anyone can view form styles" ON public.form_styles FOR SELECT USING (true);
CREATE POLICY "Form editors can insert styles" ON public.form_styles FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.forms 
      WHERE id = form_styles.form_id AND (
        created_by = auth.uid() OR 
        EXISTS (SELECT 1 FROM public.form_editors WHERE form_id = forms.id AND user_id = auth.uid())
      )
    )
  );
CREATE POLICY "Form editors can update styles" ON public.form_styles FOR UPDATE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.forms 
      WHERE id = form_styles.form_id AND (
        created_by = auth.uid() OR 
        EXISTS (SELECT 1 FROM public.form_editors WHERE form_id = forms.id AND user_id = auth.uid())
      )
    )
  );

-- RLS Policies for questions
CREATE POLICY "Anyone can view questions" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Form editors can insert questions" ON public.questions FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.forms 
      WHERE id = questions.form_id AND (
        created_by = auth.uid() OR 
        EXISTS (SELECT 1 FROM public.form_editors WHERE form_id = forms.id AND user_id = auth.uid())
      )
    )
  );
CREATE POLICY "Form editors can update questions" ON public.questions FOR UPDATE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.forms 
      WHERE id = questions.form_id AND (
        created_by = auth.uid() OR 
        EXISTS (SELECT 1 FROM public.form_editors WHERE form_id = forms.id AND user_id = auth.uid())
      )
    )
  );
CREATE POLICY "Form editors can delete questions" ON public.questions FOR DELETE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.forms 
      WHERE id = questions.form_id AND (
        created_by = auth.uid() OR 
        EXISTS (SELECT 1 FROM public.form_editors WHERE form_id = forms.id AND user_id = auth.uid())
      )
    )
  );

-- RLS Policies for question_options
CREATE POLICY "Anyone can view question options" ON public.question_options FOR SELECT USING (true);
CREATE POLICY "Form editors can insert options" ON public.question_options FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.questions q
      JOIN public.forms f ON q.form_id = f.id
      WHERE q.id = question_options.question_id AND (
        f.created_by = auth.uid() OR 
        EXISTS (SELECT 1 FROM public.form_editors WHERE form_id = f.id AND user_id = auth.uid())
      )
    )
  );
CREATE POLICY "Form editors can update options" ON public.question_options FOR UPDATE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.questions q
      JOIN public.forms f ON q.form_id = f.id
      WHERE q.id = question_options.question_id AND (
        f.created_by = auth.uid() OR 
        EXISTS (SELECT 1 FROM public.form_editors WHERE form_id = f.id AND user_id = auth.uid())
      )
    )
  );
CREATE POLICY "Form editors can delete options" ON public.question_options FOR DELETE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.questions q
      JOIN public.forms f ON q.form_id = f.id
      WHERE q.id = question_options.question_id AND (
        f.created_by = auth.uid() OR 
        EXISTS (SELECT 1 FROM public.form_editors WHERE form_id = f.id AND user_id = auth.uid())
      )
    )
  );

-- RLS Policies for form_responses
CREATE POLICY "Anyone can submit responses" ON public.form_responses FOR INSERT WITH CHECK (true);
CREATE POLICY "Form editors can view responses" ON public.form_responses FOR SELECT TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.forms 
      WHERE id = form_responses.form_id AND (
        created_by = auth.uid() OR 
        EXISTS (SELECT 1 FROM public.form_editors WHERE form_id = forms.id AND user_id = auth.uid())
      )
    )
  );
CREATE POLICY "Form editors can delete responses" ON public.form_responses FOR DELETE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.forms 
      WHERE id = form_responses.form_id AND (
        created_by = auth.uid() OR 
        EXISTS (SELECT 1 FROM public.form_editors WHERE form_id = forms.id AND user_id = auth.uid())
      )
    )
  );

-- RLS Policies for form_editors
CREATE POLICY "Form editors can view editors list" ON public.form_editors FOR SELECT TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.forms 
      WHERE id = form_editors.form_id AND (
        created_by = auth.uid() OR 
        EXISTS (SELECT 1 FROM public.form_editors fe WHERE fe.form_id = forms.id AND fe.user_id = auth.uid())
      )
    )
  );
CREATE POLICY "Form creators can add editors" ON public.form_editors FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.forms 
      WHERE id = form_editors.form_id AND created_by = auth.uid()
    )
  );
CREATE POLICY "Form creators can remove editors" ON public.form_editors FOR DELETE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.forms 
      WHERE id = form_editors.form_id AND created_by = auth.uid()
    )
  );

-- Create function to generate unique slug
CREATE OR REPLACE FUNCTION generate_unique_slug(base_text text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  new_slug text;
  counter integer := 0;
BEGIN
  -- Create initial slug from title (simple version)
  new_slug := lower(regexp_replace(base_text, '[^a-zA-Z0-9]+', '-', 'g'));
  new_slug := trim(both '-' from new_slug);
  
  -- If empty, use random string
  IF new_slug = '' THEN
    new_slug := 'form-' || substr(gen_random_uuid()::text, 1, 8);
  END IF;
  
  -- Check if slug exists and add counter if needed
  WHILE EXISTS (SELECT 1 FROM public.forms WHERE slug = new_slug) LOOP
    counter := counter + 1;
    new_slug := new_slug || '-' || counter::text;
  END LOOP;
  
  RETURN new_slug;
END;
$$;

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_forms_updated_at
  BEFORE UPDATE ON public.forms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();