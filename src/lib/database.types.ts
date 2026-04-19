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
      affiliate_payments: {
        Row: {
          affiliate_id: string
          amount: number
          created_at: string
          id: string
          package_from: string | null
          package_to: string | null
          reactivation_month: string | null
          receipt_url: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          type: string
          updated_at: string
          wallet_credit_amount: number | null
          withdrawal_account: string | null
          withdrawal_method: string | null
        }
        Insert: {
          affiliate_id: string
          amount: number
          created_at?: string
          id?: string
          package_from?: string | null
          package_to?: string | null
          reactivation_month?: string | null
          receipt_url?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          type: string
          updated_at?: string
          wallet_credit_amount?: number | null
          withdrawal_account?: string | null
          withdrawal_method?: string | null
        }
        Update: {
          affiliate_id?: string
          amount?: number
          created_at?: string
          id?: string
          package_from?: string | null
          package_to?: string | null
          reactivation_month?: string | null
          receipt_url?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          type?: string
          updated_at?: string
          wallet_credit_amount?: number | null
          withdrawal_account?: string | null
          withdrawal_method?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_payments_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_payments_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_store_config: {
        Row: {
          accent_color: string | null
          affiliate_id: string
          banner_emoji: string | null
          banner_icon: string | null
          banner_image_url: string | null
          banner_type: string | null
          created_at: string | null
          custom_prices: Json | null
          featured_product_ids: string[] | null
          header_preset: string | null
          id: string
          is_public: boolean | null
          logo_url: string | null
          show_all_products: boolean | null
          store_name: string | null
          store_style: string | null
          tagline: string | null
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          accent_color?: string | null
          affiliate_id: string
          banner_emoji?: string | null
          banner_icon?: string | null
          banner_image_url?: string | null
          banner_type?: string | null
          created_at?: string | null
          custom_prices?: Json | null
          featured_product_ids?: string[] | null
          header_preset?: string | null
          id?: string
          is_public?: boolean | null
          logo_url?: string | null
          show_all_products?: boolean | null
          store_name?: string | null
          store_style?: string | null
          tagline?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          accent_color?: string | null
          affiliate_id?: string
          banner_emoji?: string | null
          banner_icon?: string | null
          banner_image_url?: string | null
          banner_type?: string | null
          created_at?: string | null
          custom_prices?: Json | null
          featured_product_ids?: string[] | null
          header_preset?: string | null
          id?: string
          is_public?: boolean | null
          logo_url?: string | null
          show_all_products?: boolean | null
          store_name?: string | null
          store_style?: string | null
          tagline?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_store_config_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: true
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates: {
        Row: {
          account_status: string
          activated_at: string | null
          active_directos: number
          affiliate_code: string
          created_at: string | null
          depth_unlocked: number
          dni: string
          email: string
          id: string
          last_reactivation_at: string | null
          name: string
          next_reactivation_due: string | null
          package: string | null
          phone: string | null
          referral_count: number | null
          referred_by: string | null
          shipping_address: string | null
          shipping_city: string | null
          suspended_at: string | null
          total_commissions: number | null
          total_sales: number | null
          updated_at: string | null
          user_id: string | null
          yape_number: string | null
        }
        Insert: {
          account_status?: string
          activated_at?: string | null
          active_directos?: number
          affiliate_code: string
          created_at?: string | null
          depth_unlocked?: number
          dni: string
          email: string
          id?: string
          last_reactivation_at?: string | null
          name: string
          next_reactivation_due?: string | null
          package?: string | null
          phone?: string | null
          referral_count?: number | null
          referred_by?: string | null
          shipping_address?: string | null
          shipping_city?: string | null
          suspended_at?: string | null
          total_commissions?: number | null
          total_sales?: number | null
          updated_at?: string | null
          user_id?: string | null
          yape_number?: string | null
        }
        Update: {
          account_status?: string
          activated_at?: string | null
          active_directos?: number
          affiliate_code?: string
          created_at?: string | null
          depth_unlocked?: number
          dni?: string
          email?: string
          id?: string
          last_reactivation_at?: string | null
          name?: string
          next_reactivation_due?: string | null
          package?: string | null
          phone?: string | null
          referral_count?: number | null
          referred_by?: string | null
          shipping_address?: string | null
          shipping_city?: string | null
          suspended_at?: string | null
          total_commissions?: number | null
          total_sales?: number | null
          updated_at?: string | null
          user_id?: string | null
          yape_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliates_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      business_settings: {
        Row: {
          account_holder_name: string | null
          address: string | null
          bank_account: string | null
          bank_name: string | null
          business_name: string
          commission_level_1: number
          commission_level_10: number
          commission_level_2: number
          commission_level_3: number
          commission_level_4: number
          commission_level_5: number
          commission_level_6: number
          commission_level_7: number
          commission_level_8: number
          commission_level_9: number
          company_profit_percentage: number
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          logo_url: string | null
          min_withdrawal: number
          notify_new_affiliates: boolean
          notify_new_orders: boolean
          package_basico_price: number
          package_intermedio_price: number
          package_vip_price: number
          partner_price_base: number
          plin_number: string | null
          public_price_base: number
          reactivation_fee: number
          updated_at: string
          whatsapp_number: string | null
          wp_conversion_rate: number
          yape_number: string | null
          yape_qr_url: string | null
        }
        Insert: {
          account_holder_name?: string | null
          address?: string | null
          bank_account?: string | null
          bank_name?: string | null
          business_name?: string
          commission_level_1?: number
          commission_level_10?: number
          commission_level_2?: number
          commission_level_3?: number
          commission_level_4?: number
          commission_level_5?: number
          commission_level_6?: number
          commission_level_7?: number
          commission_level_8?: number
          commission_level_9?: number
          company_profit_percentage?: number
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          min_withdrawal?: number
          notify_new_affiliates?: boolean
          notify_new_orders?: boolean
          package_basico_price?: number
          package_intermedio_price?: number
          package_vip_price?: number
          partner_price_base?: number
          plin_number?: string | null
          public_price_base?: number
          reactivation_fee?: number
          updated_at?: string
          whatsapp_number?: string | null
          wp_conversion_rate?: number
          yape_number?: string | null
          yape_qr_url?: string | null
        }
        Update: {
          account_holder_name?: string | null
          address?: string | null
          bank_account?: string | null
          bank_name?: string | null
          business_name?: string
          commission_level_1?: number
          commission_level_10?: number
          commission_level_2?: number
          commission_level_3?: number
          commission_level_4?: number
          commission_level_5?: number
          commission_level_6?: number
          commission_level_7?: number
          commission_level_8?: number
          commission_level_9?: number
          company_profit_percentage?: number
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          min_withdrawal?: number
          notify_new_affiliates?: boolean
          notify_new_orders?: boolean
          package_basico_price?: number
          package_intermedio_price?: number
          package_vip_price?: number
          partner_price_base?: number
          plin_number?: string | null
          public_price_base?: number
          reactivation_fee?: number
          updated_at?: string
          whatsapp_number?: string | null
          wp_conversion_rate?: number
          yape_number?: string | null
          yape_qr_url?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      commissions: {
        Row: {
          affiliate_id: string
          amount: number
          base_amount: number | null
          created_at: string
          id: string
          is_breakage: boolean
          level: number
          order_id: string | null
          originator_id: string | null
          percentage: number | null
          status: string | null
          wp_amount: number | null
          wp_credited: boolean | null
        }
        Insert: {
          affiliate_id: string
          amount?: number
          base_amount?: number | null
          created_at?: string
          id?: string
          is_breakage?: boolean
          level?: number
          order_id?: string | null
          originator_id?: string | null
          percentage?: number | null
          status?: string | null
          wp_amount?: number | null
          wp_credited?: boolean | null
        }
        Update: {
          affiliate_id?: string
          amount?: number
          base_amount?: number | null
          created_at?: string
          id?: string
          is_breakage?: boolean
          level?: number
          order_id?: string | null
          originator_id?: string | null
          percentage?: number | null
          status?: string | null
          wp_amount?: number | null
          wp_credited?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "commissions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_originator_id_fkey"
            columns: ["originator_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          mensaje: string
          nombre: string
          status: string | null
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          mensaje: string
          nombre: string
          status?: string | null
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          mensaje?: string
          nombre?: string
          status?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          admin_id: string | null
          amount: number
          created_at: string
          description: string | null
          id: string
          order_id: string | null
          point_value_at_time: number | null
          type: string
          user_credit_id: string
        }
        Insert: {
          admin_id?: string | null
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string | null
          point_value_at_time?: number | null
          type: string
          user_credit_id: string
        }
        Update: {
          admin_id?: string | null
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string | null
          point_value_at_time?: number | null
          type?: string
          user_credit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_user_credit_id_fkey"
            columns: ["user_credit_id"]
            isOneToOne: false
            referencedRelation: "user_credits"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          name: string
          order_id: string
          price: number
          product_id: string | null
          quantity: number
          subtotal: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          order_id: string
          price: number
          product_id?: string | null
          quantity?: number
          subtotal?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          order_id?: string
          price?: number
          product_id?: string | null
          quantity?: number
          subtotal?: number | null
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
          affiliate_id: string | null
          created_at: string | null
          customer_dni: string | null
          customer_email: string
          customer_name: string
          customer_phone: string | null
          id: string
          is_activation_order: boolean
          is_dropshipping: boolean | null
          order_number: string
          payment_method: string
          shipped_at: string | null
          shipping_address: string | null
          shipping_city: string | null
          shipping_company: string | null
          shipping_voucher_url: string | null
          status: string | null
          total: number
          tracking_code: string | null
          updated_at: string | null
        }
        Insert: {
          affiliate_id?: string | null
          created_at?: string | null
          customer_dni?: string | null
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          id?: string
          is_activation_order?: boolean
          is_dropshipping?: boolean | null
          order_number: string
          payment_method?: string
          shipped_at?: string | null
          shipping_address?: string | null
          shipping_city?: string | null
          shipping_company?: string | null
          shipping_voucher_url?: string | null
          status?: string | null
          total: number
          tracking_code?: string | null
          updated_at?: string | null
        }
        Update: {
          affiliate_id?: string | null
          created_at?: string | null
          customer_dni?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          id?: string
          is_activation_order?: boolean
          is_dropshipping?: boolean | null
          order_number?: string
          payment_method?: string
          shipped_at?: string | null
          shipping_address?: string | null
          shipping_city?: string | null
          shipping_company?: string | null
          shipping_voucher_url?: string | null
          status?: string | null
          total?: number
          tracking_code?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          account_holder: string | null
          account_number: string | null
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          qr_code_url: string | null
        }
        Insert: {
          account_holder?: string | null
          account_number?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          qr_code_url?: string | null
        }
        Update: {
          account_holder?: string | null
          account_number?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          qr_code_url?: string | null
        }
        Relationships: []
      }
      payment_proofs: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string | null
          id: string
          order_id: string
          payment_method: string
          proof_url: string
          status: string | null
          updated_at: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string | null
          id?: string
          order_id: string
          payment_method: string
          proof_url: string
          status?: string | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string | null
          id?: string
          order_id?: string
          payment_method?: string
          proof_url?: string
          status?: string | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string | null
          description: string | null
          gallery_images: Json
          id: string
          image_alt: string | null
          image_url: string | null
          is_active: boolean
          name: string
          organic: boolean
          partner_price: number | null
          price: number
          public_price: number | null
          rating: number | null
          reviews_count: number
          stock: number | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          gallery_images?: Json
          id?: string
          image_alt?: string | null
          image_url?: string | null
          is_active?: boolean
          name: string
          organic?: boolean
          partner_price?: number | null
          price: number
          public_price?: number | null
          rating?: number | null
          reviews_count?: number
          stock?: number | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          gallery_images?: Json
          id?: string
          image_alt?: string | null
          image_url?: string | null
          is_active?: boolean
          name?: string
          organic?: boolean
          partner_price?: number | null
          price?: number
          public_price?: number | null
          rating?: number | null
          reviews_count?: number
          stock?: number | null
          tags?: string[] | null
          updated_at?: string | null
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
      referrals: {
        Row: {
          created_at: string
          id: string
          level: number
          referred_id: string
          referrer_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          level?: number
          referred_id: string
          referrer_id: string
        }
        Update: {
          created_at?: string
          id?: string
          level?: number
          referred_id?: string
          referrer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      user_addresses: {
        Row: {
          address: string
          city: string
          created_at: string
          dni: string | null
          id: string
          is_default: boolean | null
          phone: string | null
          reference: string | null
          user_id: string
        }
        Insert: {
          address: string
          city: string
          created_at?: string
          dni?: string | null
          id?: string
          is_default?: boolean | null
          phone?: string | null
          reference?: string | null
          user_id: string
        }
        Update: {
          address?: string
          city?: string
          created_at?: string
          dni?: string | null
          id?: string
          is_default?: boolean | null
          phone?: string | null
          reference?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          balance: number
          created_at: string
          email: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          email: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          email?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      approve_affiliate_payment: {
        Args: { p_admin_id: string; p_payment_id: string }
        Returns: Json
      }
      create_order_commissions: {
        Args: {
          p_affiliate_code: string
          p_order_amount: number
          p_order_id: string
        }
        Returns: undefined
      }
      decrease_product_stock: {
        Args: { p_product_id: string; p_quantity: number }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      register_affiliate: {
        Args: {
          p_affiliate_code: string
          p_dni: string
          p_email: string
          p_name: string
          p_package: string
          p_referred_by?: string
          p_user_id: string
          p_yape_number: string
        }
        Returns: {
          account_status: string
          activated_at: string | null
          active_directos: number
          affiliate_code: string
          created_at: string | null
          depth_unlocked: number
          dni: string
          email: string
          id: string
          last_reactivation_at: string | null
          name: string
          next_reactivation_due: string | null
          package: string | null
          phone: string | null
          referral_count: number | null
          referred_by: string | null
          shipping_address: string | null
          shipping_city: string | null
          suspended_at: string | null
          total_commissions: number | null
          total_sales: number | null
          updated_at: string | null
          user_id: string | null
          yape_number: string | null
        }
        SetofOptions: {
          from: "*"
          to: "affiliates"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      suspend_overdue_affiliates: { Args: never; Returns: number }
      use_credits_for_purchase: {
        Args: { p_amount: number; p_order_id?: string }
        Returns: Json
      }
    }
    Enums: {
      affiliate_level:
        | "Vendedor Directo"
        | "Mentor Directo"
        | "Líder de Equipo"
        | "Desarrollador"
        | "Expansor"
        | "Consolidador"
        | "Embajador"
      app_role: "admin" | "affiliate" | "user"
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
      affiliate_level: [
        "Vendedor Directo",
        "Mentor Directo",
        "Líder de Equipo",
        "Desarrollador",
        "Expansor",
        "Consolidador",
        "Embajador",
      ],
      app_role: ["admin", "affiliate", "user"],
    },
  },
} as const

// ── Convenience type aliases ─────────────────────────────────────────────────
// These re-export table row types so the rest of the codebase can do:
//   import type { Product, Affiliate, ... } from "@/lib/database.types"
export type Product          = Tables<"products">
export type Category         = Tables<"categories">
export type Affiliate        = Tables<"affiliates">
export type Order            = Tables<"orders">
export type OrderItem        = Tables<"order_items">
export type AffiliatePayment = Tables<"affiliate_payments">
export type Commission       = Tables<"commissions">
export type StoreConfig      = Tables<"affiliate_store_config">
export type BusinessSettings = Tables<"business_settings">
export type CreditTransaction = Tables<"credit_transactions">

/** Paquetes de afiliado disponibles */
export type PackageType = "Básico" | "Intermedio" | "VIP"
