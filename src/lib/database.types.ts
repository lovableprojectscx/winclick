export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type AccountStatus = "pending" | "active" | "suspended";
export type PackageType   = "Básico" | "Intermedio" | "VIP";
export type PaymentType   = "activacion" | "reactivacion" | "upgrade" | "recarga_billetera" | "retiro";
export type PaymentStatus = "pendiente" | "aprobado" | "rechazado";
export type OrderStatus   = "pendiente" | "procesando" | "enviado" | "entregado" | "cancelado";
export type CommissionStatus = "pending" | "paid" | "rejected";

export interface Database {
  public: {
    Tables: {
      affiliates: {
        Row: {
          id:                   string;
          user_id:              string | null;
          name:                 string;
          email:                string;
          dni:                  string;
          affiliate_code:       string;
          yape_number:          string | null;
          package:              PackageType | null;
          depth_unlocked:       number;
          account_status:       AccountStatus;
          rank:                 string;
          uv_amount_month:      number;
          uv_month_year:        string;
          active_directos:      number;
          total_sales:          number;
          total_commissions:    number;
          referral_count:       number;
          referred_by:          string | null;
          activated_at:         string | null;
          suspended_at:         string | null;
          last_reactivation_at: string | null;
          next_reactivation_due:string | null;
          created_at:           string;
          updated_at:           string;
        };
        Insert: Omit<Database["public"]["Tables"]["affiliates"]["Row"], "id" | "created_at" | "updated_at" | "rank" | "uv_amount_month" | "active_directos" | "total_sales" | "total_commissions" | "referral_count">;
        Update: Partial<Database["public"]["Tables"]["affiliates"]["Row"]>;
      };

      products: {
        Row: {
          id:             string;
          name:           string;
          description:    string | null;
          price:          number;
          partner_price:  number | null;
          public_price:   number | null;
          stock:          number;
          category_id:    string | null;
          tags:           string[] | null;
          rating:         number | null;
          reviews_count:  number;
          image_url:      string | null;
          organic:        boolean;
          is_active:      boolean;
          created_at:     string;
          updated_at:     string;
        };
        Insert: Omit<Database["public"]["Tables"]["products"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["products"]["Row"]>;
      };

      categories: {
        Row: {
          id:         string;
          name:       string;
          icon:       string | null;
          color:      string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["categories"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["categories"]["Row"]>;
      };

      orders: {
        Row: {
          id:               string;
          order_number:     string;
          customer_name:    string;
          customer_email:   string | null;
          customer_dni:     string | null;
          customer_phone:   string | null;
          total:            number;
          status:           OrderStatus;
          payment_method:   "wallet" | "cash";
          shipping_address: string | null;
          shipping_city:    string | null;
          shipping_company: string | null;
          tracking_code:    string | null;
          shipping_voucher_url: string | null;
          shipped_at:       string | null;
          is_dropshipping:  boolean | null;
          affiliate_id:     string | null;
          created_at:       string;
          updated_at:       string;
        };
        Insert: Omit<Database["public"]["Tables"]["orders"]["Row"], "id" | "order_number" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["orders"]["Row"]>;
      };

      order_items: {
        Row: {
          id:         string;
          order_id:   string;
          product_id: string | null;
          name:       string;
          price:      number;
          quantity:   number;
          subtotal:   number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["order_items"]["Row"], "id" | "subtotal" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["order_items"]["Row"]>;
      };

      commissions: {
        Row: {
          id:            string;
          affiliate_id:  string;
          originator_id: string | null;
          order_id:      string | null;
          amount:        number;
          level:         number;
          percentage:    number | null;
          base_amount:   number | null;
          status:        CommissionStatus;
          is_breakage:   boolean;
          wp_credited:   boolean | null;
          wp_amount:     number | null;
          created_at:    string;
        };
        Insert: Omit<Database["public"]["Tables"]["commissions"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["commissions"]["Row"]>;
      };

      affiliate_payments: {
        Row: {
          id:                   string;
          affiliate_id:         string;
          type:                 PaymentType;
          status:               PaymentStatus;
          amount:               number;
          receipt_url:          string | null;
          package_from:         PackageType | null;
          package_to:           PackageType | null;
          reactivation_month:   string | null;
          wallet_credit_amount: number | null;
          withdrawal_method:    string | null;
          withdrawal_account:   string | null;
          reviewed_by:          string | null;
          reviewed_at:          string | null;
          review_notes:         string | null;
          created_at:           string;
          updated_at:           string;
        };
        Insert: Omit<Database["public"]["Tables"]["affiliate_payments"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["affiliate_payments"]["Row"]>;
      };

      affiliate_store_config: {
        Row: {
          id:                  string;
          affiliate_id:        string;
          store_name:          string | null;
          tagline:             string | null;
          accent_color:        string | null;
          banner_type:         string | null;
          banner_emoji:        string | null;
          banner_image_url:    string | null;
          banner_icon:         string | null;
          logo_url:            string | null;
          store_style:         string | null;
          whatsapp:            string | null;
          featured_product_ids:string[] | null;
          show_all_products:   boolean | null;
          custom_prices:       Json | null;
          header_preset:       string | null;
          is_public:           boolean | null;
          created_at:          string | null;
          updated_at:          string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["affiliate_store_config"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["affiliate_store_config"]["Row"]>;
      };

      user_credits: {
        Row: {
          id:         string;
          user_id:    string;
          email:      string;
          balance:    number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["user_credits"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["user_credits"]["Row"]>;
      };

      credit_transactions: {
        Row: {
          id:                  string;
          user_credit_id:      string;
          amount:              number;
          type:                string;
          description:         string | null;
          order_id:            string | null;
          admin_id:            string | null;
          point_value_at_time: number | null;
          created_at:          string;
        };
        Insert: Omit<Database["public"]["Tables"]["credit_transactions"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["credit_transactions"]["Row"]>;
      };

      referrals: {
        Row: {
          id:          string;
          referrer_id: string;
          referred_id: string;
          level:       number;
          created_at:  string;
        };
        Insert: Omit<Database["public"]["Tables"]["referrals"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["referrals"]["Row"]>;
      };

      volume_units: {
        Row: {
          id:           string;
          affiliate_id: string;
          order_id:     string | null;
          month_year:   string;
          source:       string;
          amount:       number;
          created_at:   string;
        };
        Insert: Omit<Database["public"]["Tables"]["volume_units"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["volume_units"]["Row"]>;
      };

      payment_proofs: {
        Row: {
          id:             string;
          order_id:       string;
          proof_url:      string;
          payment_method: string;
          amount:         number;
          status:         string | null;
          admin_notes:    string | null;
          verified_by:    string | null;
          verified_at:    string | null;
          created_at:     string | null;
          updated_at:     string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["payment_proofs"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["payment_proofs"]["Row"]>;
      };

      business_settings: {
        Row: {
          id:                       string;
          business_name:            string;
          logo_url:                 string | null;
          contact_email:            string | null;
          contact_phone:            string | null;
          whatsapp_number:          string | null;
          address:                  string | null;
          bank_name:                string | null;
          bank_account:             string | null;
          yape_number:              string | null;
          plin_number:              string | null;
          commission_level_1:       number;
          commission_level_2:       number;
          commission_level_3:       number;
          commission_level_4:       number;
          commission_level_5:       number;
          commission_level_6:       number;
          commission_level_7:       number;
          commission_level_8:       number;
          commission_level_9:       number;
          commission_level_10:      number;
          company_profit_percentage:number;
          partner_price_base:       number;
          public_price_base:        number;
          wp_conversion_rate:       number;
          package_basico_price:     number;
          package_intermedio_price: number;
          package_vip_price:        number;
          reactivation_fee:         number;
          min_withdrawal:           number;
          notify_new_orders:        boolean;
          notify_new_affiliates:    boolean;
          created_at:               string;
          updated_at:               string;
        };
        Insert: Omit<Database["public"]["Tables"]["business_settings"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["business_settings"]["Row"]>;
      };

      user_roles: {
        Row: { id: string; user_id: string; role: string; created_at: string | null };
        Insert: Omit<Database["public"]["Tables"]["user_roles"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["user_roles"]["Row"]>;
      };

      favorites: {
        Row: { id: string; user_id: string; product_id: string; created_at: string };
        Insert: Omit<Database["public"]["Tables"]["favorites"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["favorites"]["Row"]>;
      };

      contact_messages: {
        Row: { id: string; nombre: string; email: string; whatsapp: string | null; mensaje: string; status: string | null; created_at: string };
        Insert: Omit<Database["public"]["Tables"]["contact_messages"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["contact_messages"]["Row"]>;
      };

      payment_methods: {
        Row: { id: string; name: string; account_number: string | null; account_holder: string | null; qr_code_url: string | null; is_active: boolean | null; created_at: string };
        Insert: Omit<Database["public"]["Tables"]["payment_methods"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["payment_methods"]["Row"]>;
      };

      user_addresses: {
        Row: { id: string; user_id: string; address: string; city: string; reference: string | null; dni: string | null; phone: string | null; is_default: boolean | null; created_at: string };
        Insert: Omit<Database["public"]["Tables"]["user_addresses"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["user_addresses"]["Row"]>;
      };
    };

    Functions: {
      register_affiliate: {
        Args: { p_user_id: string; p_name: string; p_dni: string; p_email: string; p_affiliate_code: string; p_yape_number: string; p_package?: PackageType; p_referred_by?: string };
        Returns: Database["public"]["Tables"]["affiliates"]["Row"];
      };
      calculate_affiliate_rank: {
        Args: { p_affiliate_id: string };
        Returns: string;
      };
      create_order_commissions: {
        Args: { p_order_id: string; p_order_amount: number; p_affiliate_code: string };
        Returns: void;
      };
      approve_affiliate_payment: {
        Args: { p_payment_id: string; p_admin_id: string };
        Returns: Json;
      };
      suspend_overdue_affiliates: {
        Args: Record<string, never>;
        Returns: number;
      };
      use_credits_for_purchase: {
        Args: { p_user_id: string; p_amount: number };
        Returns: Json;
      };
      has_role: {
        Args: { p_user_id: string; p_role: string };
        Returns: boolean;
      };
    };
  };
}

// Tipos de conveniencia para usar en el frontend
export type Affiliate        = Database["public"]["Tables"]["affiliates"]["Row"];
export type Product          = Database["public"]["Tables"]["products"]["Row"];
export type Category         = Database["public"]["Tables"]["categories"]["Row"];
export type Order            = Database["public"]["Tables"]["orders"]["Row"];
export type OrderItem        = Database["public"]["Tables"]["order_items"]["Row"];
export type Commission       = Database["public"]["Tables"]["commissions"]["Row"];
export type AffiliatePayment = Database["public"]["Tables"]["affiliate_payments"]["Row"];
export type StoreConfig      = Database["public"]["Tables"]["affiliate_store_config"]["Row"];
export type UserCredit       = Database["public"]["Tables"]["user_credits"]["Row"];
export type CreditTransaction= Database["public"]["Tables"]["credit_transactions"]["Row"];
export type BusinessSettings = Database["public"]["Tables"]["business_settings"]["Row"];
