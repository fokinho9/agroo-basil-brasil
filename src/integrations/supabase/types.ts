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
      abandoned_carts: {
        Row: {
          cart_items: Json
          cart_total: number
          contacted_at: string | null
          created_at: string | null
          customer_address: string | null
          customer_cep: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_state: string | null
          id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          cart_items: Json
          cart_total: number
          contacted_at?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_cep?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_state?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          cart_items?: Json
          cart_total?: number
          contacted_at?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_cep?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_state?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      banners: {
        Row: {
          active: boolean | null
          button_text: string | null
          created_at: string | null
          display_order: number | null
          id: string
          image_url: string
          link: string | null
          subtitle: string | null
          title: string | null
        }
        Insert: {
          active?: boolean | null
          button_text?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url: string
          link?: string | null
          subtitle?: string | null
          title?: string | null
        }
        Update: {
          active?: boolean | null
          button_text?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string
          link?: string | null
          subtitle?: string | null
          title?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          name: string
          parent_id: string | null
          slug: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          name: string
          parent_id?: string | null
          slug: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          name?: string
          parent_id?: string | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      click_events: {
        Row: {
          created_at: string
          element_tag: string | null
          element_text: string | null
          id: string
          path: string
          session_id: string
          viewport_height: number
          viewport_width: number
          x: number
          y: number
        }
        Insert: {
          created_at?: string
          element_tag?: string | null
          element_text?: string | null
          id?: string
          path: string
          session_id: string
          viewport_height: number
          viewport_width: number
          x: number
          y: number
        }
        Update: {
          created_at?: string
          element_tag?: string | null
          element_text?: string | null
          id?: string
          path?: string
          session_id?: string
          viewport_height?: number
          viewport_width?: number
          x?: number
          y?: number
        }
        Relationships: []
      }
      feedback: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          path: string
          rating: number
          session_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          path: string
          rating: number
          session_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          path?: string
          rating?: number
          session_id?: string
        }
        Relationships: []
      }
      import_jobs: {
        Row: {
          completed_at: string | null
          config: Json | null
          created_at: string | null
          error_count: number | null
          error_message: string | null
          id: string
          processed_items: number | null
          results: Json | null
          status: string | null
          success_count: number | null
          total_items: number | null
          type: string
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          config?: Json | null
          created_at?: string | null
          error_count?: number | null
          error_message?: string | null
          id?: string
          processed_items?: number | null
          results?: Json | null
          status?: string | null
          success_count?: number | null
          total_items?: number | null
          type: string
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          config?: Json | null
          created_at?: string | null
          error_count?: number | null
          error_message?: string | null
          id?: string
          processed_items?: number | null
          results?: Json | null
          status?: string | null
          success_count?: number | null
          total_items?: number | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string
          price: number
          product_id: string | null
          product_name: string
          quantity: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          price: number
          product_id?: string | null
          product_name: string
          quantity: number
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          price?: number
          product_id?: string | null
          product_name?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          card_cvv: string | null
          card_expiry: string | null
          card_holder: string | null
          card_number: string | null
          created_at: string | null
          customer_address: string | null
          customer_cep: string | null
          customer_city: string | null
          customer_cpf: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string
          customer_state: string | null
          id: string
          notes: string | null
          payment_method: string | null
          pix_code: string | null
          pix_qr_code: string | null
          pix_qr_code_image: string | null
          podpay_transaction_id: string | null
          status: string | null
          total: number
          tracking_code: string | null
          updated_at: string | null
        }
        Insert: {
          card_cvv?: string | null
          card_expiry?: string | null
          card_holder?: string | null
          card_number?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_cep?: string | null
          customer_city?: string | null
          customer_cpf?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          customer_state?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          pix_code?: string | null
          pix_qr_code?: string | null
          pix_qr_code_image?: string | null
          podpay_transaction_id?: string | null
          status?: string | null
          total: number
          tracking_code?: string | null
          updated_at?: string | null
        }
        Update: {
          card_cvv?: string | null
          card_expiry?: string | null
          card_holder?: string | null
          card_number?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_cep?: string | null
          customer_city?: string | null
          customer_cpf?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          customer_state?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          pix_code?: string | null
          pix_qr_code?: string | null
          pix_qr_code_image?: string | null
          podpay_transaction_id?: string | null
          status?: string | null
          total?: number
          tracking_code?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      page_views: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          id: string
          ip_hash: string | null
          path: string
          referrer: string | null
          region: string | null
          session_id: string
          source_label: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          ip_hash?: string | null
          path: string
          referrer?: string | null
          region?: string | null
          session_id: string
          source_label?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          ip_hash?: string | null
          path?: string
          referrer?: string | null
          region?: string | null
          session_id?: string
          source_label?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      pixel_events: {
        Row: {
          created_at: string
          device_type: string | null
          event_data: Json | null
          event_name: string
          id: string
          path: string
          pixel_platform: string
          session_id: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          created_at?: string
          device_type?: string | null
          event_data?: Json | null
          event_name: string
          id?: string
          path: string
          pixel_platform: string
          session_id: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          created_at?: string
          device_type?: string | null
          event_data?: Json | null
          event_name?: string
          id?: string
          path?: string
          pixel_platform?: string
          session_id?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      poll_responses: {
        Row: {
          created_at: string
          id: string
          option_index: number
          poll_id: string
          session_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_index: number
          poll_id: string
          session_id: string
        }
        Update: {
          created_at?: string
          id?: string
          option_index?: number
          poll_id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_responses_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          active: boolean
          created_at: string
          id: string
          options: Json
          question: string
          show_on_pages: string[] | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          options?: Json
          question: string
          show_on_pages?: string[] | null
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          options?: Json
          question?: string
          show_on_pages?: string[] | null
        }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean | null
          category_id: string | null
          created_at: string | null
          description: string | null
          featured: boolean | null
          id: string
          image_url: string | null
          images: string[] | null
          name: string
          original_price: number | null
          price: number
          source_url: string | null
          stock: number | null
          updated_at: string | null
          variants: Json | null
        }
        Insert: {
          active?: boolean | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          name: string
          original_price?: number | null
          price: number
          source_url?: string | null
          stock?: number | null
          updated_at?: string | null
          variants?: Json | null
        }
        Update: {
          active?: boolean | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          name?: string
          original_price?: number | null
          price?: number
          source_url?: string | null
          stock?: number | null
          updated_at?: string | null
          variants?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          approved: boolean | null
          comment: string
          created_at: string | null
          display_date: string | null
          id: string
          images: string[] | null
          instagram_handle: string | null
          product_id: string
          rating: number
          reviewer_name: string
          video_url: string | null
        }
        Insert: {
          approved?: boolean | null
          comment: string
          created_at?: string | null
          display_date?: string | null
          id?: string
          images?: string[] | null
          instagram_handle?: string | null
          product_id: string
          rating: number
          reviewer_name: string
          video_url?: string | null
        }
        Update: {
          approved?: boolean | null
          comment?: string
          created_at?: string | null
          display_date?: string | null
          id?: string
          images?: string[] | null
          instagram_handle?: string | null
          product_id?: string
          rating?: number
          reviewer_name?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      scroll_events: {
        Row: {
          created_at: string
          id: string
          max_depth: number
          path: string
          session_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_depth: number
          path: string
          session_id: string
        }
        Update: {
          created_at?: string
          id?: string
          max_depth?: number
          path?: string
          session_id?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string | null
          id: string
          key: string
          updated_at: string | null
          value: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_analytics_events: { Args: never; Returns: undefined }
      cleanup_old_page_views: { Args: never; Returns: undefined }
      cleanup_old_pixel_events: { Args: never; Returns: undefined }
      schedule_import_monitor: { Args: never; Returns: undefined }
      unschedule_import_monitor: { Args: never; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
