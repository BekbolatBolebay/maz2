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
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          avatar_url: string | null
          preferred_language: string
          theme: string
          role: 'user' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          preferred_language?: string
          theme?: string
          role?: 'user' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          preferred_language?: string
          theme?: string
          role?: 'user' | 'admin'
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          avatar_url: string | null
          push_token: string | null
          is_anonymous: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          push_token?: string | null
          is_anonymous?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          push_token?: string | null
          is_anonymous?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          cafe_id: string | null
          name_kk: string
          name_ru: string
          name_en: string | null
          icon_url: string | null
          sort_order: number | null
          is_active: boolean | null
          is_combo: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          cafe_id?: string | null
          name_kk: string
          name_ru: string
          name_en?: string | null
          icon_url?: string | null
          sort_order?: number | null
          is_active?: boolean | null
          is_combo?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          cafe_id?: string | null
          name_kk?: string
          name_ru?: string
          name_en?: string | null
          icon_url?: string | null
          sort_order?: number | null
          is_active?: boolean | null
          is_combo?: boolean | null
          created_at?: string | null
        }
      }
      restaurants: {
        Row: {
          id: string
          name_kk: string
          name_ru: string
          name_en: string
          description_kk: string | null
          description_ru: string | null
          description_en: string | null
          image_url: string | null
          banner_url: string | null
          address: string
          phone: string | null
          rating: number
          delivery_time_min: number
          delivery_time_max: number
          delivery_fee: number
          minimum_order: number
          is_open: boolean
          cuisine_types: string[]
          opening_hours: Json | null
          is_new: boolean
          accept_cash: boolean
          accept_kaspi: boolean
          accept_freedom: boolean
          is_delivery_enabled: boolean
          is_pickup_enabled: boolean
          is_booking_enabled: boolean
          base_delivery_fee: number
          delivery_fee_per_km: number
          courier_fee: number
          delivery_surge_multiplier: number
          delivery_extra_charge: number
          latitude: number | null
          longitude: number | null
          telegram_bot_token: string | null
          telegram_chat_id: string | null
          booking_fee: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name_kk: string
          name_ru: string
          name_en: string
          description_kk?: string | null
          description_ru?: string | null
          description_en?: string | null
          image_url?: string | null
          banner_url?: string | null
          address: string
          phone?: string | null
          rating?: number
          delivery_time_min?: number
          delivery_time_max?: number
          delivery_fee?: number
          minimum_order?: number
          is_open?: boolean
          cuisine_types?: string[]
          opening_hours?: Json | null
          is_new?: boolean
          booking_fee?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name_kk?: string
          name_ru?: string
          name_en?: string
          description_kk?: string | null
          description_ru?: string | null
          description_en?: string | null
          image_url?: string | null
          banner_url?: string | null
          address?: string
          phone?: string | null
          rating?: number
          delivery_time_min?: number
          delivery_time_max?: number
          delivery_fee?: number
          minimum_order?: number
          is_open?: boolean
          cuisine_types?: string[]
          opening_hours?: Json | null
          is_new?: boolean
          booking_fee?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      menu_items: {
        Row: {
          id: string
          cafe_id: string
          category_id: string | null
          name_kk: string
          name_ru: string
          name_en: string
          description_kk: string | null
          description_ru: string | null
          description_en: string | null
          image_url: string | null
          price: number
          original_price: number | null
          is_available: boolean
          is_popular: boolean
          is_stop_list: boolean
          preparation_time: number
          combo_items: Json | null
          type: string | null
          rental_deposit: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          cafe_id: string
          category_id?: string | null
          name_kk: string
          name_ru: string
          name_en: string
          description_kk?: string | null
          description_ru?: string | null
          description_en?: string | null
          image_url?: string | null
          price: number
          is_available?: boolean
          is_popular?: boolean
          is_stop_list?: boolean
          preparation_time?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          cafe_id?: string
          category_id?: string | null
          name_kk?: string
          name_ru?: string
          name_en?: string
          description_kk?: string | null
          description_ru?: string | null
          description_en?: string | null
          image_url?: string | null
          price?: number
          is_available?: boolean
          is_popular?: boolean
          is_stop_list?: boolean
          preparation_time?: number
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          order_number: string
          user_id: string
          cafe_id: string
          status: string
          total_amount: number
          delivery_fee: number
          delivery_address: string
          delivery_notes: string | null
          payment_method: string
          payment_status: string
          payment_url: string | null
          courier_id: string | null
          one_time_courier_name: string | null
          one_time_courier_phone: string | null
          courier_tracking_token: string | null
          phone: string
          courier_fee: number
          address: string | null
          latitude: number | null
          longitude: number | null
          estimated_delivery_time: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_number: string
          user_id: string
          cafe_id: string
          status?: string
          total_amount: number
          delivery_fee?: number
          courier_fee?: number
          delivery_address: string
          delivery_notes?: string | null
          payment_method?: string
          phone: string
          address?: string | null
          latitude?: number | null
          longitude?: number | null
          estimated_delivery_time?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_number?: string
          user_id?: string
          cafe_id?: string
          status?: string
          total_amount?: number
          delivery_fee?: number
          delivery_address?: string
          delivery_notes?: string | null
          payment_method?: string
          phone?: string
          address?: string | null
          latitude?: number | null
          longitude?: number | null
          estimated_delivery_time?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          menu_item_id: string
          quantity: number
          price: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          menu_item_id: string
          quantity: number
          price: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          menu_item_id?: string
          quantity?: number
          price?: number
          notes?: string | null
          created_at?: string
        }
      }
      cart_items: {
        Row: {
          id: string
          user_id: string
          menu_item_id: string
          cafe_id: string
          quantity: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          menu_item_id: string
          cafe_id: string
          quantity?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          menu_item_id?: string
          cafe_id?: string
          quantity?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      favorites: {
        Row: {
          id: string
          user_id: string
          cafe_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          cafe_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          cafe_id?: string
          created_at?: string
        }
      }
      promotions: {
        Row: {
          id: string
          title: string
          title_ru: string | null
          description: string | null
          description_ru: string | null
          image_url: string | null
          discount_percent: number | null
          discount_amount: number | null
          code: string | null
          start_date: string
          end_date: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          title_ru?: string | null
          description?: string | null
          description_ru?: string | null
          image_url?: string | null
          discount_percent?: number | null
          discount_amount?: number | null
          code?: string | null
          start_date: string
          end_date: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          title_ru?: string | null
          description?: string | null
          description_ru?: string | null
          image_url?: string | null
          discount_percent?: number | null
          discount_amount?: number | null
          code?: string | null
          start_date?: string
          end_date?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
