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
      blog_posts: {
        Row: {
          body: string
          created_at: string | null
          date: string
          excerpt: string
          external_url: string | null
          id: string
          slug: string
          thumbnail_url: string | null
          title: string
        }
        Insert: {
          body: string
          created_at?: string | null
          date: string
          excerpt: string
          external_url?: string | null
          id?: string
          slug: string
          thumbnail_url?: string | null
          title: string
        }
        Update: {
          body?: string
          created_at?: string | null
          date?: string
          excerpt?: string
          external_url?: string | null
          id?: string
          slug?: string
          thumbnail_url?: string | null
          title?: string
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          created_at: string | null
          email: string
          id: string
          message: string
          name: string
          read: boolean | null
          subject: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          message: string
          name: string
          read?: boolean | null
          subject: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          message?: string
          name?: string
          read?: boolean | null
          subject?: string
        }
        Relationships: []
      }
      download_tokens: {
        Row: {
          created_at: string | null
          downloaded_at: string | null
          email: string
          expires_at: string
          id: string
          items: Json
          purchase_id: string
          token: string
        }
        Insert: {
          created_at?: string | null
          downloaded_at?: string | null
          email: string
          expires_at?: string
          id?: string
          items?: Json
          purchase_id: string
          token?: string
        }
        Update: {
          created_at?: string | null
          downloaded_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          items?: Json
          purchase_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "download_tokens_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string | null
          date_time: string
          description: string | null
          id: string
          image_url: string | null
          location: string
          published: boolean | null
          ticket_link: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          date_time: string
          description?: string | null
          id?: string
          image_url?: string | null
          location?: string
          published?: boolean | null
          ticket_link?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          date_time?: string
          description?: string | null
          id?: string
          image_url?: string | null
          location?: string
          published?: boolean | null
          ticket_link?: string | null
          title?: string
        }
        Relationships: []
      }
      gallery_items: {
        Row: {
          alt: string
          aspect_ratio: string | null
          collection: string
          created_at: string | null
          id: string
          image_url: string | null
          media_type: string
          meta: string | null
          sort_order: number | null
        }
        Insert: {
          alt: string
          aspect_ratio?: string | null
          collection?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          media_type?: string
          meta?: string | null
          sort_order?: number | null
        }
        Update: {
          alt?: string
          aspect_ratio?: string | null
          collection?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          media_type?: string
          meta?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }
      merch_product_images: {
        Row: {
          created_at: string | null
          id: string
          image_url: string
          merch_product_id: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url?: string
          merch_product_id: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string
          merch_product_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "merch_product_images_merch_product_id_fkey"
            columns: ["merch_product_id"]
            isOneToOne: false
            referencedRelation: "merch_products"
            referencedColumns: ["id"]
          },
        ]
      }
      merch_products: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          image_url: string | null
          meta: string | null
          price: number
          title: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          meta?: string | null
          price?: number
          title: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          meta?: string | null
          price?: number
          title?: string
        }
        Relationships: []
      }
      music_links: {
        Row: {
          created_at: string | null
          id: string
          itunes_url: string | null
          sort_order: number | null
          title: string
          youtube_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          itunes_url?: string | null
          sort_order?: number | null
          title: string
          youtube_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          itunes_url?: string | null
          sort_order?: number | null
          title?: string
          youtube_id?: string
        }
        Relationships: []
      }
      music_products: {
        Row: {
          active: boolean | null
          artist: string
          audio_url: string | null
          cover_url: string | null
          created_at: string | null
          description: string | null
          id: string
          preview_audio_url: string | null
          price: number
          title: string
        }
        Insert: {
          active?: boolean | null
          artist?: string
          audio_url?: string | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          preview_audio_url?: string | null
          price?: number
          title: string
        }
        Update: {
          active?: boolean | null
          artist?: string
          audio_url?: string | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          preview_audio_url?: string | null
          price?: number
          title?: string
        }
        Relationships: []
      }
      music_releases: {
        Row: {
          artwork_url: string | null
          audio_url: string | null
          created_at: string | null
          description: string | null
          id: string
          parent_album_id: string | null
          platform: string
          platform_link: string
          release_type: string
          sort_order: number | null
          title: string
        }
        Insert: {
          artwork_url?: string | null
          audio_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          parent_album_id?: string | null
          platform?: string
          platform_link?: string
          release_type?: string
          sort_order?: number | null
          title: string
        }
        Update: {
          artwork_url?: string | null
          audio_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          parent_album_id?: string | null
          platform?: string
          platform_link?: string
          release_type?: string
          sort_order?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "music_releases_parent_album_id_fkey"
            columns: ["parent_album_id"]
            isOneToOne: false
            referencedRelation: "music_releases"
            referencedColumns: ["id"]
          },
        ]
      }
      site_sections: {
        Row: {
          description: string
          empty_message: string
          image_alt: string
          image_meta: string
          image_url: string
          note: string
          section_id: string
          sort_order: number | null
          subtitle: string
          title: string
          updated_at: string | null
        }
        Insert: {
          description?: string
          empty_message?: string
          image_alt?: string
          image_meta?: string
          image_url?: string
          note?: string
          section_id: string
          sort_order?: number | null
          subtitle?: string
          title?: string
          updated_at?: string | null
        }
        Update: {
          description?: string
          empty_message?: string
          image_alt?: string
          image_meta?: string
          image_url?: string
          note?: string
          section_id?: string
          sort_order?: number | null
          subtitle?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          label: string
          section_id: string
          sort_order: number | null
          updated_at: string | null
          value: string
        }
        Insert: {
          key: string
          label?: string
          section_id?: string
          sort_order?: number | null
          updated_at?: string | null
          value?: string
        }
        Update: {
          key?: string
          label?: string
          section_id?: string
          sort_order?: number | null
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      about_credits: {
        Row: {
          created_at: string | null
          id: string
          name: string
          role: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name?: string
          role?: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          role?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      social_links: {
        Row: {
          created_at: string | null
          id: string
          label: string
          sort_order: number | null
          url: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          label?: string
          sort_order?: number | null
          url?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          label?: string
          sort_order?: number | null
          url?: string | null
        }
        Relationships: []
      }
      press_features: {
        Row: {
          created_at: string | null
          headline: string
          id: string
          outlet: string
          published: boolean | null
          published_at: string | null
          sort_order: number | null
          url: string
        }
        Insert: {
          created_at?: string | null
          headline: string
          id?: string
          outlet: string
          published?: boolean | null
          published_at?: string | null
          sort_order?: number | null
          url?: string
        }
        Update: {
          created_at?: string | null
          headline?: string
          id?: string
          outlet?: string
          published?: boolean | null
          published_at?: string | null
          sort_order?: number | null
          url?: string
        }
        Relationships: []
      }
      outreach_logs: {
        Row: {
          contact_name: string
          created_at: string | null
          id: string
          notes: string | null
          publication_link: string | null
          status: string
          topic: string
        }
        Insert: {
          contact_name: string
          created_at?: string | null
          id?: string
          notes?: string | null
          publication_link?: string | null
          status?: string
          topic?: string
        }
        Update: {
          contact_name?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          publication_link?: string | null
          status?: string
          topic?: string
        }
        Relationships: []
      }
      page_views: {
        Row: {
          id: string
          page: string
          session_id: string | null
          viewed_at: string
        }
        Insert: {
          id?: string
          page?: string
          session_id?: string | null
          viewed_at?: string
        }
        Update: {
          id?: string
          page?: string
          session_id?: string | null
          viewed_at?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          created_at: string | null
          email: string
          id: string
          item_type: string
          items: Json
          status: string
          stripe_session_id: string | null
          total: number
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          item_type?: string
          items?: Json
          status?: string
          stripe_session_id?: string | null
          total?: number
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          item_type?: string
          items?: Json
          status?: string
          stripe_session_id?: string | null
          total?: number
        }
        Relationships: []
      }
      site_stats: {
        Row: {
          id: number
          total_views: number
          unique_visitors: number
          updated_at: string
        }
        Insert: {
          id: number
          total_views?: number
          unique_visitors?: number
          updated_at?: string
        }
        Update: {
          id?: number
          total_views?: number
          unique_visitors?: number
          updated_at?: string
        }
        Relationships: []
      }
      social_embeds: {
        Row: {
          created_at: string | null
          embed_type: string
          id: string
          sort_order: number | null
          url: string
        }
        Insert: {
          created_at?: string | null
          embed_type?: string
          id?: string
          sort_order?: number | null
          url: string
        }
        Update: {
          created_at?: string | null
          embed_type?: string
          id?: string
          sort_order?: number | null
          url?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      view_throttle: {
        Row: {
          last_view: string
          page: string
          session_id: string
        }
        Insert: {
          last_view?: string
          page: string
          session_id: string
        }
        Update: {
          last_view?: string
          page?: string
          session_id?: string
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
      record_page_view: {
        Args: { p_page: string; p_session: string }
        Returns: undefined
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
