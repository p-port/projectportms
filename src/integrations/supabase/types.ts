export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      customer_shop_history: {
        Row: {
          customer_email: string
          customer_phone: string | null
          id: string
          interaction_date: string
          interaction_type: string
          job_id: string | null
          notes: string | null
          shop_id: string
        }
        Insert: {
          customer_email: string
          customer_phone?: string | null
          id?: string
          interaction_date?: string
          interaction_type: string
          job_id?: string | null
          notes?: string | null
          shop_id: string
        }
        Update: {
          customer_email?: string
          customer_phone?: string | null
          id?: string
          interaction_date?: string
          interaction_type?: string
          job_id?: string | null
          notes?: string | null
          shop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_shop_history_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      external_job_tracking: {
        Row: {
          created_at: string
          endpoint: string
          error_message: string | null
          http_method: string
          id: string
          job_id: string | null
          request_id: string | null
          request_payload: Json | null
          response_payload: Json | null
          response_status: number | null
          source_app: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          error_message?: string | null
          http_method?: string
          id?: string
          job_id?: string | null
          request_id?: string | null
          request_payload?: Json | null
          response_payload?: Json | null
          response_status?: number | null
          source_app: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          error_message?: string | null
          http_method?: string
          id?: string
          job_id?: string | null
          request_id?: string | null
          request_payload?: Json | null
          response_payload?: Json | null
          response_status?: number | null
          source_app?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          created_at: string | null
          customer: Json
          date_completed: string | null
          date_created: string | null
          id: string
          job_id: string
          motorcycle: Json
          notes: Json | null
          photos: Json | null
          service_type: string
          shop_id: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          customer: Json
          date_completed?: string | null
          date_created?: string | null
          id?: string
          job_id: string
          motorcycle: Json
          notes?: Json | null
          photos?: Json | null
          service_type: string
          shop_id?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          customer?: Json
          date_completed?: string | null
          date_created?: string | null
          id?: string
          job_id?: string
          motorcycle?: Json
          notes?: Json | null
          photos?: Json | null
          service_type?: string
          shop_id?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_disclosures: {
        Row: {
          created_at: string
          customer_email: string
          customer_phone: string | null
          id: string
          ip_address: string | null
          job_id: string | null
          privacy_accepted: boolean | null
          privacy_accepted_at: string | null
          terms_accepted: boolean | null
          terms_accepted_at: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          customer_email: string
          customer_phone?: string | null
          id?: string
          ip_address?: string | null
          job_id?: string | null
          privacy_accepted?: boolean | null
          privacy_accepted_at?: string | null
          terms_accepted?: boolean | null
          terms_accepted_at?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          customer_email?: string
          customer_phone?: string | null
          id?: string
          ip_address?: string | null
          job_id?: string | null
          privacy_accepted?: boolean | null
          privacy_accepted_at?: string | null
          terms_accepted?: boolean | null
          terms_accepted_at?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          recipient_id: string | null
          sender_id: string | null
          subject: string | null
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          recipient_id?: string | null
          sender_id?: string | null
          subject?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          recipient_id?: string | null
          sender_id?: string | null
          subject?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          reference_id: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          reference_id?: string | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          reference_id?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          approved: boolean | null
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          role: string | null
          shop_id: string | null
        }
        Insert: {
          approved?: boolean | null
          created_at?: string | null
          email?: string | null
          id: string
          name?: string | null
          role?: string | null
          shop_id?: string | null
        }
        Update: {
          approved?: boolean | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          role?: string | null
          shop_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      quick_notes: {
        Row: {
          category: string
          created_at: string
          id: string
          is_default: boolean | null
          note_text: string
          shop_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          note_text: string
          shop_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          note_text?: string
          shop_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quick_notes_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invitation_code: string
          invited_by: string
          phone: string | null
          shop_id: string
          status: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invitation_code: string
          invited_by: string
          phone?: string | null
          shop_id: string
          status?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invitation_code?: string
          invited_by?: string
          phone?: string | null
          shop_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shop_invitations_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shops: {
        Row: {
          business_phone: string | null
          business_registration_number: string | null
          created_at: string | null
          district: string
          employee_count: number
          fax_number: string | null
          full_address: string | null
          id: string
          logo_url: string | null
          mobile_phone: string | null
          name: string
          owner_id: string | null
          region: string
          services: string[]
          tax_email: string | null
          unique_identifier: string
        }
        Insert: {
          business_phone?: string | null
          business_registration_number?: string | null
          created_at?: string | null
          district: string
          employee_count?: number
          fax_number?: string | null
          full_address?: string | null
          id?: string
          logo_url?: string | null
          mobile_phone?: string | null
          name: string
          owner_id?: string | null
          region: string
          services: string[]
          tax_email?: string | null
          unique_identifier: string
        }
        Update: {
          business_phone?: string | null
          business_registration_number?: string | null
          created_at?: string | null
          district?: string
          employee_count?: number
          fax_number?: string | null
          full_address?: string | null
          id?: string
          logo_url?: string | null
          mobile_phone?: string | null
          name?: string
          owner_id?: string | null
          region?: string
          services?: string[]
          tax_email?: string | null
          unique_identifier?: string
        }
        Relationships: []
      }
      support_chat_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_from_support: boolean | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_from_support?: boolean | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_from_support?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          creator_id: string | null
          id: string
          priority: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          creator_id?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          creator_id?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          sender_id: string | null
          ticket_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          sender_id?: string | null
          ticket_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          sender_id?: string | null
          ticket_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      translations: {
        Row: {
          id: string
          key: string
          language: string
          namespace: string
          value: string
        }
        Insert: {
          id?: string
          key: string
          language: string
          namespace: string
          value: string
        }
        Update: {
          id?: string
          key?: string
          language?: string
          namespace?: string
          value?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_shop_owner: {
        Args: { shop_id: string; owner_id: string }
        Returns: undefined
      }
      assign_user_to_shop_by_identifier: {
        Args: { user_id: string; shop_identifier: string }
        Returns: string
      }
      exec_sql: {
        Args: { sql_string: string }
        Returns: undefined
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_current_user_approved: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_user_approved: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      remove_shop_owner: {
        Args: { shop_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
