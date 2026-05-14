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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      assistance_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assistance_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "assistance_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
        }
        Relationships: []
      }
      blessings: {
        Row: {
          category_id: string | null
          created_at: string
          currency: string
          description: string | null
          id: string
          image_url: string | null
          price: number
          provider_id: string | null
          shopify_product_id: string | null
          shopify_variant_id: string | null
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          image_url?: string | null
          price?: number
          provider_id?: string | null
          shopify_product_id?: string | null
          shopify_variant_id?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          image_url?: string | null
          price?: number
          provider_id?: string | null
          shopify_product_id?: string | null
          shopify_variant_id?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blessings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "assistance_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blessings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          beneficiary_name: string | null
          category_slug: string | null
          created_at: string
          currency: string
          donor_count: number
          featured: boolean
          goal_amount: number
          handle: string
          id: string
          image_url: string | null
          location: string | null
          raised_amount: number
          shopify_product_id: string | null
          shopify_variant_id: string | null
          short_description: string | null
          status: string
          story: string | null
          title: string
          updated_at: string
        }
        Insert: {
          beneficiary_name?: string | null
          category_slug?: string | null
          created_at?: string
          currency?: string
          donor_count?: number
          featured?: boolean
          goal_amount?: number
          handle: string
          id?: string
          image_url?: string | null
          location?: string | null
          raised_amount?: number
          shopify_product_id?: string | null
          shopify_variant_id?: string | null
          short_description?: string | null
          status?: string
          story?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          beneficiary_name?: string | null
          category_slug?: string | null
          created_at?: string
          currency?: string
          donor_count?: number
          featured?: boolean
          goal_amount?: number
          handle?: string
          id?: string
          image_url?: string | null
          location?: string | null
          raised_amount?: number
          shopify_product_id?: string | null
          shopify_variant_id?: string | null
          short_description?: string | null
          status?: string
          story?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_category_slug_fkey"
            columns: ["category_slug"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["slug"]
          },
        ]
      }
      cases: {
        Row: {
          category_id: string | null
          country: string | null
          created_at: string
          currency: string
          description: string | null
          id: string
          priority: string
          recipient_user_id: string
          region: string | null
          status: string
          target_amount: number
          title: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          country?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          priority?: string
          recipient_user_id: string
          region?: string | null
          status?: string
          target_amount?: number
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          country?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          priority?: string
          recipient_user_id?: string
          region?: string | null
          status?: string
          target_amount?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cases_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "assistance_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      donations: {
        Row: {
          amount: number
          campaign_id: string | null
          created_at: string
          currency: string
          donor_email: string | null
          donor_name: string | null
          id: string
          is_anonymous: boolean
          message: string | null
          shopify_checkout_id: string | null
          shopify_order_id: string
        }
        Insert: {
          amount: number
          campaign_id?: string | null
          created_at?: string
          currency?: string
          donor_email?: string | null
          donor_name?: string | null
          id?: string
          is_anonymous?: boolean
          message?: string | null
          shopify_checkout_id?: string | null
          shopify_order_id: string
        }
        Update: {
          amount?: number
          campaign_id?: string | null
          created_at?: string
          currency?: string
          donor_email?: string | null
          donor_name?: string | null
          id?: string
          is_anonymous?: boolean
          message?: string | null
          shopify_checkout_id?: string | null
          shopify_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "donations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      fulfillment_events: {
        Row: {
          actor_user_id: string | null
          cost: number | null
          created_at: string
          currency: string | null
          event_type: string
          id: string
          idempotency_key: string | null
          match_id: string | null
          notes: string | null
          provider: string | null
          response: Json | null
          sponsorship_id: string | null
          status: string | null
        }
        Insert: {
          actor_user_id?: string | null
          cost?: number | null
          created_at?: string
          currency?: string | null
          event_type: string
          id?: string
          idempotency_key?: string | null
          match_id?: string | null
          notes?: string | null
          provider?: string | null
          response?: Json | null
          sponsorship_id?: string | null
          status?: string | null
        }
        Update: {
          actor_user_id?: string | null
          cost?: number | null
          created_at?: string
          currency?: string | null
          event_type?: string
          id?: string
          idempotency_key?: string | null
          match_id?: string | null
          notes?: string | null
          provider?: string | null
          response?: Json | null
          sponsorship_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fulfillment_events_sponsorship_id_fkey"
            columns: ["sponsorship_id"]
            isOneToOne: false
            referencedRelation: "sponsorships"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_entries: {
        Row: {
          account: string
          amount: number
          created_at: string
          currency: string
          donation_id: string | null
          id: string
          memo: string | null
          side: string
        }
        Insert: {
          account: string
          amount: number
          created_at?: string
          currency?: string
          donation_id?: string | null
          id?: string
          memo?: string | null
          side: string
        }
        Update: {
          account?: string
          amount?: number
          created_at?: string
          currency?: string
          donation_id?: string | null
          id?: string
          memo?: string | null
          side?: string
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "donations"
            referencedColumns: ["id"]
          },
        ]
      }
      ngo_applications: {
        Row: {
          causes: string[]
          country: string | null
          created_at: string
          email: string
          geography: string | null
          id: string
          intelligence_status: string
          name: string
          status: string
          submitted_by: string | null
          trust_score: number
          updated_at: string
        }
        Insert: {
          causes?: string[]
          country?: string | null
          created_at?: string
          email: string
          geography?: string | null
          id?: string
          intelligence_status?: string
          name: string
          status?: string
          submitted_by?: string | null
          trust_score?: number
          updated_at?: string
        }
        Update: {
          causes?: string[]
          country?: string | null
          created_at?: string
          email?: string
          geography?: string | null
          id?: string
          intelligence_status?: string
          name?: string
          status?: string
          submitted_by?: string | null
          trust_score?: number
          updated_at?: string
        }
        Relationships: []
      }
      ngo_profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          ngo_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          ngo_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          ngo_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ngo_profiles_ngo_id_fkey"
            columns: ["ngo_id"]
            isOneToOne: false
            referencedRelation: "ngo_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      petri_feedback: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          match_id: string | null
          rating: number
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          match_id?: string | null
          rating: number
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          match_id?: string | null
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "petri_feedback_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "petri_matches"
            referencedColumns: ["id"]
          },
        ]
      }
      petri_matches: {
        Row: {
          category: string | null
          confidence_score: number
          cost: number
          created_at: string
          currency: string
          execution_status: string
          help_request_id: string | null
          id: string
          last_executed_at: string | null
          match_generation: string
          provider: string | null
          score: number
          sponsor_id: string | null
          status: string
        }
        Insert: {
          category?: string | null
          confidence_score?: number
          cost?: number
          created_at?: string
          currency?: string
          execution_status?: string
          help_request_id?: string | null
          id?: string
          last_executed_at?: string | null
          match_generation?: string
          provider?: string | null
          score?: number
          sponsor_id?: string | null
          status?: string
        }
        Update: {
          category?: string | null
          confidence_score?: number
          cost?: number
          created_at?: string
          currency?: string
          execution_status?: string
          help_request_id?: string | null
          id?: string
          last_executed_at?: string | null
          match_generation?: string
          provider?: string | null
          score?: number
          sponsor_id?: string | null
          status?: string
        }
        Relationships: []
      }
      petri_tokens: {
        Row: {
          confidence_score: number
          created_at: string
          feedback_score: number
          id: string
          match_generation: string
          payload: Json
          score: number
          source_id: string | null
          status: string
          type: string
        }
        Insert: {
          confidence_score?: number
          created_at?: string
          feedback_score?: number
          id?: string
          match_generation?: string
          payload?: Json
          score?: number
          source_id?: string | null
          status?: string
          type: string
        }
        Update: {
          confidence_score?: number
          created_at?: string
          feedback_score?: number
          id?: string
          match_generation?: string
          payload?: Json
          score?: number
          source_id?: string | null
          status?: string
          type?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      providers: {
        Row: {
          country: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          owner_user_id: string | null
          slug: string
          updated_at: string
          verification_status: string
          website: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          owner_user_id?: string | null
          slug: string
          updated_at?: string
          verification_status?: string
          website?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          owner_user_id?: string | null
          slug?: string
          updated_at?: string
          verification_status?: string
          website?: string | null
        }
        Relationships: []
      }
      sponsors: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          help_interests: string[]
          id: string
          organization_details: string | null
          organization_name: string | null
          sponsor_role: string
          state: string | null
          updated_at: string
          user_id: string
          verification_notes: string | null
          verification_status: string
          zip: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          help_interests?: string[]
          id?: string
          organization_details?: string | null
          organization_name?: string | null
          sponsor_role: string
          state?: string | null
          updated_at?: string
          user_id: string
          verification_notes?: string | null
          verification_status?: string
          zip?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          help_interests?: string[]
          id?: string
          organization_details?: string | null
          organization_name?: string | null
          sponsor_role?: string
          state?: string | null
          updated_at?: string
          user_id?: string
          verification_notes?: string | null
          verification_status?: string
          zip?: string | null
        }
        Relationships: []
      }
      sponsorships: {
        Row: {
          amount: number
          blessing_id: string | null
          case_id: string | null
          created_at: string
          currency: string
          id: string
          shopify_order_id: string | null
          sponsor_user_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          blessing_id?: string | null
          case_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          shopify_order_id?: string | null
          sponsor_user_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          blessing_id?: string | null
          case_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          shopify_order_id?: string | null
          sponsor_user_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsorships_blessing_id_fkey"
            columns: ["blessing_id"]
            isOneToOne: false
            referencedRelation: "blessings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsorships_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          event_id: string
          id: string
          processed_at: string
          source: string
          topic: string | null
        }
        Insert: {
          event_id: string
          id?: string
          processed_at?: string
          source: string
          topic?: string | null
        }
        Update: {
          event_id?: string
          id?: string
          processed_at?: string
          source?: string
          topic?: string | null
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
      increment_campaign_totals: {
        Args: { _amount: number; _campaign_id: string; _donor_delta?: number }
        Returns: undefined
      }
      reverse_donation_ledger: {
        Args: { _donation_id: string; _reason?: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "ngo" | "user" | "sponsor" | "recipient"
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
      app_role: ["admin", "ngo", "user", "sponsor", "recipient"],
    },
  },
} as const
