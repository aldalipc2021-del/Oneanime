import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Subscription {
  id: string;
  user_id: string;
  status: string;
  plan: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
}

export const useSubscription = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Subscription | null;
    },
    enabled: !!user,
  });
};

export const useIsPremium = () => {
  const { data: subscription, isLoading } = useSubscription();

  return {
    isPremium: subscription?.status === "active",
    isLoading,
    subscription,
  };
};

export const useCreateSubscription = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      plan,
    }: {
      plan: "monthly" | "yearly";
    }) => {
      if (!user) throw new Error("Not authenticated");

      // For now, just create a placeholder subscription
      // This will be replaced with actual Stripe integration later
      const { data, error } = await supabase
        .from("subscriptions")
        .upsert({
          user_id: user.id,
          status: "pending",
          plan,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
  });
};
