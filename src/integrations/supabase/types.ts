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
      campaigns: {
        Row: {
          beneficiary_name: string | null
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
        Relationships: []
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
    }
    Enums: {
      app_role: "admin" | "ngo" | "user"
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
      app_role: ["admin", "ngo", "user"],
    },
  },
} as const
