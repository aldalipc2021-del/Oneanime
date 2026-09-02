-- Separate owner-only notes table
CREATE TABLE public.custom_list_item_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL UNIQUE REFERENCES public.custom_list_items(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  note text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_list_item_notes TO authenticated;
GRANT ALL ON public.custom_list_item_notes TO service_role;

ALTER TABLE public.custom_list_item_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own item notes"
ON public.custom_list_item_notes FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_custom_list_item_notes_updated_at
BEFORE UPDATE ON public.custom_list_item_notes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing notes
INSERT INTO public.custom_list_item_notes (item_id, user_id, note)
SELECT i.id, l.user_id, i.notes
FROM public.custom_list_items i
JOIN public.custom_lists l ON l.id = i.list_id
WHERE i.notes IS NOT NULL AND btrim(i.notes) <> '';

ALTER TABLE public.custom_list_items DROP COLUMN notes;

-- View no longer needed; use invoker semantics via table policy
DROP VIEW IF EXISTS public.public_custom_list_items;

CREATE POLICY "Anyone can view items in public lists"
ON public.custom_list_items FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.custom_lists l
  WHERE l.id = custom_list_items.list_id AND l.is_public = true
));