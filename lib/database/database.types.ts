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
      appointments_v2: {
        Row: {
          business_id: string
          created_at: string | null
          description: string | null
          end_time: string
          id: string
          party_size: number | null
          start_time: string
          status: Database["public"]["Enums"]["appointment_status"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string | null
          description?: string | null
          end_time: string
          id?: string
          party_size?: number | null
          start_time: string
          status?: Database["public"]["Enums"]["appointment_status"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string | null
          description?: string | null
          end_time?: string
          id?: string
          party_size?: number | null
          start_time?: string
          status?: Database["public"]["Enums"]["appointment_status"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_v2_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      business_files_v2: {
        Row: {
          business_id: string
          created_at: string
          file_size: number
          file_type: string
          id: string
          metadata: Json | null
          mime_type: string
          original_name: string
          storage_path: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          file_size: number
          file_type: string
          id?: string
          metadata?: Json | null
          mime_type: string
          original_name: string
          storage_path: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          file_size?: number
          file_type?: string
          id?: string
          metadata?: Json | null
          mime_type?: string
          original_name?: string
          storage_path?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_files_v2_business_id_fkey1"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      business_v2: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          profile_image: string | null
          type: Database["public"]["Enums"]["business_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          profile_image?: string | File | null
          type: Database["public"]["Enums"]["business_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          profile_image?: string | File | null
          type?: Database["public"]["Enums"]["business_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      restaurant_details_v2: {
        Row: {
          agent_instructions: string | null
          ai_communication_style: string | null
          business_id: string
          created_at: string
          cuisine_type: string | null
          delivery_available: boolean | null
          greeting_message: string | null
          id: string
          menu_items: string | null
          operating_hours: string | null
          seating_capacity: number | null
          special_instructions: string | null
          takeout_available: boolean | null
          updated_at: string
        }
        Insert: {
          agent_instructions?: string | null
          ai_communication_style?: string | null
          business_id: string
          created_at?: string
          cuisine_type?: string | null
          delivery_available?: boolean | null
          greeting_message?: string | null
          id?: string
          menu_items?: string | null
          operating_hours?: string | null
          seating_capacity?: number | null
          special_instructions?: string | null
          takeout_available?: boolean | null
          updated_at?: string
        }
        Update: {
          agent_instructions?: string | null
          ai_communication_style?: string | null
          business_id?: string
          created_at?: string
          cuisine_type?: string | null
          delivery_available?: boolean | null
          greeting_message?: string | null
          id?: string
          menu_items?: string | null
          operating_hours?: string | null
          seating_capacity?: number | null
          special_instructions?: string | null
          takeout_available?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_details_v2_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      retail_details_v2: {
        Row: {
          agent_instructions: string | null
          ai_communication_style: string | null
          business_id: string
          created_at: string
          delivery_available: boolean | null
          greeting_message: string | null
          has_online_store: boolean | null
          id: string
          inventory_size: number | null
          operating_hours: string | null
          special_instructions: string | null
          store_type: string | null
          updated_at: string
        }
        Insert: {
          agent_instructions?: string | null
          ai_communication_style?: string | null
          business_id: string
          created_at?: string
          delivery_available?: boolean | null
          greeting_message?: string | null
          has_online_store?: boolean | null
          id?: string
          inventory_size?: number | null
          operating_hours?: string | null
          special_instructions?: string | null
          store_type?: string | null
          updated_at?: string
        }
        Update: {
          agent_instructions?: string | null
          ai_communication_style?: string | null
          business_id?: string
          created_at?: string
          delivery_available?: boolean | null
          greeting_message?: string | null
          has_online_store?: boolean | null
          id?: string
          inventory_size?: number | null
          operating_hours?: string | null
          special_instructions?: string | null
          store_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "retail_details_v2_business_id_fkey1"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      service_details_v2: {
        Row: {
          agent_instructions: string | null
          ai_communication_style: string | null
          business_id: string
          created_at: string
          greeting_message: string | null
          id: string
          is_mobile_service: boolean | null
          operating_hours: string | null
          requires_booking: boolean | null
          service_area: string | null
          service_type: string | null
          special_instructions: string | null
          updated_at: string
        }
        Insert: {
          agent_instructions?: string | null
          ai_communication_style?: string | null
          business_id: string
          created_at?: string
          greeting_message?: string | null
          id?: string
          is_mobile_service?: boolean | null
          operating_hours?: string | null
          requires_booking?: boolean | null
          service_area?: string | null
          service_type?: string | null
          special_instructions?: string | null
          updated_at?: string
        }
        Update: {
          agent_instructions?: string | null
          ai_communication_style?: string | null
          business_id?: string
          created_at?: string
          greeting_message?: string | null
          id?: string
          is_mobile_service?: boolean | null
          operating_hours?: string | null
          requires_booking?: boolean | null
          service_area?: string | null
          service_type?: string | null
          special_instructions?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_details_v2_business_id_fkey1"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      User: {
        Row: {
          createdAt: string
          email: string
          full_name: string | null
          id: string
        }
        Insert: {
          createdAt?: string
          email: string
          full_name?: string | null
          id?: string
        }
        Update: {
          createdAt?: string
          email?: string
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      appointment_status:
        | "pending"
        | "confirmed"
        | "cancelled"
        | "completed"
        | "no_show"
      business_type: "restaurant" | "retail" | "service"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
