export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      anime_comments: {
        Row: {
          anime_id: number
          content: string
          created_at: string
          display_name: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          anime_id: number
          content: string
          created_at?: string
          display_name: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          anime_id?: number
          content?: string
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      anime_ratings: {
        Row: {
          anime_id: number
          created_at: string
          id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          anime_id: number
          created_at?: string
          id?: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          anime_id?: number
          created_at?: string
          id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      anime_tracking: {
        Row: {
          anime_id: number
          anime_image: string | null
          anime_title: string
          created_at: string
          current_episode: number | null
          id: string
          notes: string | null
          status: string | null
          total_episodes: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          anime_id: number
          anime_image?: string | null
          anime_title: string
          created_at?: string
          current_episode?: number | null
          id?: string
          notes?: string | null
          status?: string | null
          total_episodes?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          anime_id?: number
          anime_image?: string | null
          anime_title?: string
          created_at?: string
          current_episode?: number | null
          id?: string
          notes?: string | null
          status?: string | null
          total_episodes?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      custom_list_items: {
        Row: {
          added_at: string
          anime_id: number
          anime_image: string | null
          anime_title: string
          id: string
          list_id: string
          notes: string | null
        }
        Insert: {
          added_at?: string
          anime_id: number
          anime_image?: string | null
          anime_title: string
          id?: string
          list_id: string
          notes?: string | null
        }
        Update: {
          added_at?: string
          anime_id?: number
          anime_image?: string | null
          anime_title?: string
          id?: string
          list_id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_list_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "custom_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_lists: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      episode_notifications: {
        Row: {
          anime_id: number
          anime_title: string
          created_at: string
          episode_number: number
          id: string
          notified: boolean | null
          release_date: string | null
          user_id: string
        }
        Insert: {
          anime_id: number
          anime_title: string
          created_at?: string
          episode_number: number
          id?: string
          notified?: boolean | null
          release_date?: string | null
          user_id: string
        }
        Update: {
          anime_id?: number
          anime_title?: string
          created_at?: string
          episode_number?: number
          id?: string
          notified?: boolean | null
          release_date?: string | null
          user_id?: string
        }
        Relationships: []
      }
      episode_progress: {
        Row: {
          anime_id: number
          created_at: string
          episode_number: number
          id: string
          season_id: number
          updated_at: string
          user_id: string
          watched: boolean
          watched_at: string | null
        }
        Insert: {
          anime_id: number
          created_at?: string
          episode_number: number
          id?: string
          season_id: number
          updated_at?: string
          user_id: string
          watched?: boolean
          watched_at?: string | null
        }
        Update: {
          anime_id?: number
          created_at?: string
          episode_number?: number
          id?: string
          season_id?: number
          updated_at?: string
          user_id?: string
          watched?: boolean
          watched_at?: string | null
        }
        Relationships: []
      }
      episodes: {
        Row: {
          air_date: string | null
          created_at: string
          duration_minutes: number | null
          episode_number: number
          id: string
          season_id: string
          synopsis: string | null
          thumbnail: string | null
          title: string | null
          title_jp: string | null
          updated_at: string
        }
        Insert: {
          air_date?: string | null
          created_at?: string
          duration_minutes?: number | null
          episode_number: number
          id?: string
          season_id: string
          synopsis?: string | null
          thumbnail?: string | null
          title?: string | null
          title_jp?: string | null
          updated_at?: string
        }
        Update: {
          air_date?: string | null
          created_at?: string
          duration_minutes?: number | null
          episode_number?: number
          id?: string
          season_id?: string
          synopsis?: string | null
          thumbnail?: string | null
          title?: string | null
          title_jp?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "episodes_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          country: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          preferred_language: string | null
          push_token: string | null
          translate_descriptions: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          preferred_language?: string | null
          push_token?: string | null
          translate_descriptions?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          country?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          preferred_language?: string | null
          push_token?: string | null
          translate_descriptions?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      seasons: {
        Row: {
          aired_from: string | null
          aired_to: string | null
          anilist_id: number
          cover_image: string | null
          created_at: string
          episode_count: number | null
          id: string
          season_number: number
          series_id: string
          status: string | null
          title: string | null
          trailer_url: string | null
          updated_at: string
        }
        Insert: {
          aired_from?: string | null
          aired_to?: string | null
          anilist_id: number
          cover_image?: string | null
          created_at?: string
          episode_count?: number | null
          id?: string
          season_number: number
          series_id: string
          status?: string | null
          title?: string | null
          trailer_url?: string | null
          updated_at?: string
        }
        Update: {
          aired_from?: string | null
          aired_to?: string | null
          anilist_id?: number
          cover_image?: string | null
          created_at?: string
          episode_count?: number | null
          id?: string
          season_number?: number
          series_id?: string
          status?: string | null
          title?: string | null
          trailer_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seasons_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      series: {
        Row: {
          anilist_id: number
          cover_image: string | null
          created_at: string
          description: string | null
          genres: string[] | null
          id: string
          status: string | null
          title: string
          title_en: string | null
          title_jp: string | null
          updated_at: string
        }
        Insert: {
          anilist_id: number
          cover_image?: string | null
          created_at?: string
          description?: string | null
          genres?: string[] | null
          id?: string
          status?: string | null
          title: string
          title_en?: string | null
          title_jp?: string | null
          updated_at?: string
        }
        Update: {
          anilist_id?: number
          cover_image?: string | null
          created_at?: string
          description?: string | null
          genres?: string[] | null
          id?: string
          status?: string | null
          title?: string
          title_en?: string | null
          title_jp?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          created_at: string
          episodes_watched: number | null
          id: string
          notes: string | null
          rating: number | null
          season_id: string
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          episodes_watched?: number | null
          id?: string
          notes?: string | null
          rating?: number | null
          season_id: string
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          episodes_watched?: number | null
          id?: string
          notes?: string | null
          rating?: number | null
          season_id?: string
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
