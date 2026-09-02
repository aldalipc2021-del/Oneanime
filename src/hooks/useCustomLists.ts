import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface CustomList {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

interface CustomListItem {
  id: string;
  list_id: string;
  anime_id: number;
  anime_title: string;
  anime_image: string | null;
  notes: string | null;
  added_at: string;
}

export const useCustomLists = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["customLists", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("custom_lists")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as CustomList[];
    },
    enabled: !!user,
  });
};

export const useCustomListItems = (listId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["customListItems", listId, user?.id],
    queryFn: async () => {
      if (!listId) return [];

      const { data, error } = await supabase
        .from("custom_list_items")
        .select("*")
        .eq("list_id", listId)
        .order("added_at", { ascending: false });

      if (error) throw error;

      const items = (data || []).map((item) => ({
        ...item,
        notes: null as string | null,
      })) as CustomListItem[];

      if (!user || items.length === 0) return items;

      // Notes are private to the owner and stored in a separate protected table
      const { data: notes } = await supabase
        .from("custom_list_item_notes")
        .select("item_id, note")
        .in(
          "item_id",
          items.map((i) => i.id),
        );

      const noteMap = new Map((notes || []).map((n) => [n.item_id, n.note]));
      return items.map((i) => ({ ...i, notes: noteMap.get(i.id) ?? null }));
    },
    enabled: !!listId && !!user,
  });
};


export const useCreateCustomList = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      name,
      description,
      is_public = false,
    }: {
      name: string;
      description?: string;
      is_public?: boolean;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("custom_lists")
        .insert({
          user_id: user.id,
          name,
          description: description || null,
          is_public,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customLists"] });
    },
  });
};

export const useUpdateCustomList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      listId,
      updates,
    }: {
      listId: string;
      updates: Partial<Pick<CustomList, "name" | "description" | "is_public">>;
    }) => {
      const { error } = await supabase
        .from("custom_lists")
        .update(updates)
        .eq("id", listId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customLists"] });
    },
  });
};

export const useDeleteCustomList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (listId: string) => {
      const { error } = await supabase
        .from("custom_lists")
        .delete()
        .eq("id", listId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customLists"] });
    },
  });
};

export const useAddToCustomList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      listId,
      animeId,
      animeTitle,
      animeImage,
      notes,
    }: {
      listId: string;
      animeId: number;
      animeTitle: string;
      animeImage?: string;
      notes?: string;
    }) => {
      const { error } = await supabase.from("custom_list_items").insert({
        list_id: listId,
        anime_id: animeId,
        anime_title: animeTitle,
        anime_image: animeImage || null,
        notes: notes || null,
      });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["customListItems", variables.listId],
      });
    },
  });
};

export const useRemoveFromCustomList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      listId,
      animeId,
    }: {
      listId: string;
      animeId: number;
    }) => {
      const { error } = await supabase
        .from("custom_list_items")
        .delete()
        .eq("list_id", listId)
        .eq("anime_id", animeId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["customListItems", variables.listId],
      });
    },
  });
};

export const useUserListCount = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["customListCount", user?.id],
    queryFn: async () => {
      if (!user) return 0;

      const { count, error } = await supabase
        .from("custom_lists")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });
};
