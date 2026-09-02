-- 1. Revoke EXECUTE on SECURITY DEFINER / internal functions from anon + authenticated
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_comment_content() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- 2. Allow owners to edit their own comments
CREATE POLICY "Users can update their own comments"
ON public.anime_comments
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. Stop leaking private notes of public list items
DROP POLICY IF EXISTS "Users can view items in public lists" ON public.custom_list_items;

CREATE OR REPLACE VIEW public.public_custom_list_items AS
SELECT i.id, i.list_id, i.anime_id, i.anime_title, i.anime_image, i.added_at
FROM public.custom_list_items i
JOIN public.custom_lists l ON l.id = i.list_id
WHERE l.is_public = true;

GRANT SELECT ON public.public_custom_list_items TO anon, authenticated;

-- 4. Explicitly deny role writes to end users
CREATE POLICY "No one can insert roles"
ON public.user_roles FOR INSERT TO anon, authenticated WITH CHECK (false);

CREATE POLICY "No one can update roles"
ON public.user_roles FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);

CREATE POLICY "No one can delete roles"
ON public.user_roles FOR DELETE TO anon, authenticated USING (false);

REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM anon, authenticated;