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
      activity_events: {
        Row: {
          actor_id: string | null
          created_at: string
          entity_id: string
          entity_type: string
          event_type: string
          from_value: string | null
          id: string
          message: string | null
          metadata: Json
          to_value: string | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          event_type: string
          from_value?: string | null
          id?: string
          message?: string | null
          metadata?: Json
          to_value?: string | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          event_type?: string
          from_value?: string | null
          id?: string
          message?: string | null
          metadata?: Json
          to_value?: string | null
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_drafts: {
        Row: {
          applied_at: string | null
          created_at: string
          created_by: string | null
          id: string
          input: Json
          kind: string
          locale: string | null
          notes: string | null
          output: Json
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          target_entity: string | null
          target_id: string | null
          updated_at: string
        }
        Insert: {
          applied_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          input?: Json
          kind: string
          locale?: string | null
          notes?: string | null
          output?: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_entity?: string | null
          target_id?: string | null
          updated_at?: string
        }
        Update: {
          applied_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          input?: Json
          kind?: string
          locale?: string | null
          notes?: string | null
          output?: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_entity?: string | null
          target_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          content: Json
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: Json
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: Json
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      blog_categories: {
        Row: {
          created_at: string
          description_ar: string | null
          description_en: string | null
          id: string
          name_ar: string
          name_en: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          id?: string
          name_ar: string
          name_en: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          id?: string
          name_ar?: string
          name_en?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string | null
          canonical_url: string | null
          category_id: string | null
          content_ar: string | null
          content_en: string | null
          content_format: string
          cover_alt_ar: string | null
          cover_alt_en: string | null
          cover_caption: string | null
          cover_url: string | null
          created_at: string
          excerpt_ar: string | null
          excerpt_en: string | null
          featured: boolean
          id: string
          keywords: string[] | null
          meta_description: string | null
          meta_description_ar: string | null
          meta_title: string | null
          meta_title_ar: string | null
          og_image_url: string | null
          primary_keyword_ar: string | null
          primary_keyword_en: string | null
          published: boolean
          published_at: string | null
          reading_time_min: number | null
          scheduled_at: string | null
          seo_released: boolean
          slug: string
          status: Database["public"]["Enums"]["blog_status"]
          tags: string[] | null
          title_ar: string
          title_en: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          canonical_url?: string | null
          category_id?: string | null
          content_ar?: string | null
          content_en?: string | null
          content_format?: string
          cover_alt_ar?: string | null
          cover_alt_en?: string | null
          cover_caption?: string | null
          cover_url?: string | null
          created_at?: string
          excerpt_ar?: string | null
          excerpt_en?: string | null
          featured?: boolean
          id?: string
          keywords?: string[] | null
          meta_description?: string | null
          meta_description_ar?: string | null
          meta_title?: string | null
          meta_title_ar?: string | null
          og_image_url?: string | null
          primary_keyword_ar?: string | null
          primary_keyword_en?: string | null
          published?: boolean
          published_at?: string | null
          reading_time_min?: number | null
          scheduled_at?: string | null
          seo_released?: boolean
          slug: string
          status?: Database["public"]["Enums"]["blog_status"]
          tags?: string[] | null
          title_ar: string
          title_en: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          canonical_url?: string | null
          category_id?: string | null
          content_ar?: string | null
          content_en?: string | null
          content_format?: string
          cover_alt_ar?: string | null
          cover_alt_en?: string | null
          cover_caption?: string | null
          cover_url?: string | null
          created_at?: string
          excerpt_ar?: string | null
          excerpt_en?: string | null
          featured?: boolean
          id?: string
          keywords?: string[] | null
          meta_description?: string | null
          meta_description_ar?: string | null
          meta_title?: string | null
          meta_title_ar?: string | null
          og_image_url?: string | null
          primary_keyword_ar?: string | null
          primary_keyword_en?: string | null
          published?: boolean
          published_at?: string | null
          reading_time_min?: number | null
          scheduled_at?: string | null
          seo_released?: boolean
          slug?: string
          status?: Database["public"]["Enums"]["blog_status"]
          tags?: string[] | null
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_attachments: {
        Row: {
          booking_id: string
          created_at: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          mime_type: string | null
          uploaded_by: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          mime_type?: string | null
          uploaded_by?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          mime_type?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_attachments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_notes: {
        Row: {
          author_id: string | null
          body: string
          booking_id: string
          created_at: string
          id: string
          pinned: boolean
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          body: string
          booking_id: string
          created_at?: string
          id?: string
          pinned?: boolean
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          body?: string
          booking_id?: string
          created_at?: string
          id?: string
          pinned?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_notes_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_reminders: {
        Row: {
          booking_id: string
          channel: string
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          remind_at: string
          sent_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          booking_id: string
          channel?: string
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          remind_at: string
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          booking_id?: string
          channel?: string
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          remind_at?: string
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_reminders_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          airport_fee: number
          assigned_at: string | null
          base_fare: number
          cancellation_category: string | null
          cancellation_reason: string | null
          cancelled_by: string | null
          category_id: string | null
          code: string
          completed_at: string | null
          confirmed_at: string | null
          coupon_id: string | null
          created_at: string
          created_by: string | null
          customer_id: string
          discount: number
          distance_fare: number
          distance_km: number | null
          driver_id: string | null
          dropoff_location: string
          duration_min: number | null
          id: string
          is_priority: boolean
          night_surcharge: number
          notes: string | null
          pickup_at: string
          pickup_location: string
          priority_level: number
          reminder_at: string | null
          route_id: string | null
          source: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["booking_status"]
          tags: string[]
          time_fare: number
          total_fare: number
          updated_at: string
          vehicle_id: string | null
          waiting_fare: number
          waiting_min: number
        }
        Insert: {
          airport_fee?: number
          assigned_at?: string | null
          base_fare?: number
          cancellation_category?: string | null
          cancellation_reason?: string | null
          cancelled_by?: string | null
          category_id?: string | null
          code?: string
          completed_at?: string | null
          confirmed_at?: string | null
          coupon_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id: string
          discount?: number
          distance_fare?: number
          distance_km?: number | null
          driver_id?: string | null
          dropoff_location: string
          duration_min?: number | null
          id?: string
          is_priority?: boolean
          night_surcharge?: number
          notes?: string | null
          pickup_at?: string
          pickup_location: string
          priority_level?: number
          reminder_at?: string | null
          route_id?: string | null
          source?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          tags?: string[]
          time_fare?: number
          total_fare?: number
          updated_at?: string
          vehicle_id?: string | null
          waiting_fare?: number
          waiting_min?: number
        }
        Update: {
          airport_fee?: number
          assigned_at?: string | null
          base_fare?: number
          cancellation_category?: string | null
          cancellation_reason?: string | null
          cancelled_by?: string | null
          category_id?: string | null
          code?: string
          completed_at?: string | null
          confirmed_at?: string | null
          coupon_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string
          discount?: number
          distance_fare?: number
          distance_km?: number | null
          driver_id?: string | null
          dropoff_location?: string
          duration_min?: number | null
          id?: string
          is_priority?: boolean
          night_surcharge?: number
          notes?: string | null
          pickup_at?: string
          pickup_location?: string
          priority_level?: number
          reminder_at?: string | null
          route_id?: string | null
          source?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          tags?: string[]
          time_fare?: number
          total_fare?: number
          updated_at?: string
          vehicle_id?: string | null
          waiting_fare?: number
          waiting_min?: number
        }
        Relationships: [
          {
            foreignKeyName: "bookings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "vehicle_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_intelligence"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "bookings_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "v_driver_intelligence"
            referencedColumns: ["driver_id"]
          },
          {
            foreignKeyName: "bookings_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "v_fleet_intelligence"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "bookings_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_pages: {
        Row: {
          body_ar: string | null
          body_en: string | null
          canonical_url: string | null
          created_at: string
          custom_schema: Json | null
          deleted_at: string | null
          featured_image_url: string | null
          gallery: Json
          hero_image_url: string | null
          id: string
          keywords: string[] | null
          locale: string | null
          meta_description: string | null
          meta_title: string | null
          og_description: string | null
          og_image_url: string | null
          og_title: string | null
          page_type: Database["public"]["Enums"]["cms_page_type"]
          published: boolean
          related_ids: string[]
          robots: string | null
          schema_type: string | null
          seo_released: boolean
          slug: string
          sort_order: number
          status: Database["public"]["Enums"]["content_status"]
          subtitle_ar: string | null
          subtitle_en: string | null
          title_ar: string
          title_en: string
          twitter_card: string | null
          twitter_description: string | null
          twitter_image_url: string | null
          twitter_title: string | null
          updated_at: string
        }
        Insert: {
          body_ar?: string | null
          body_en?: string | null
          canonical_url?: string | null
          created_at?: string
          custom_schema?: Json | null
          deleted_at?: string | null
          featured_image_url?: string | null
          gallery?: Json
          hero_image_url?: string | null
          id?: string
          keywords?: string[] | null
          locale?: string | null
          meta_description?: string | null
          meta_title?: string | null
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          page_type?: Database["public"]["Enums"]["cms_page_type"]
          published?: boolean
          related_ids?: string[]
          robots?: string | null
          schema_type?: string | null
          seo_released?: boolean
          slug: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          subtitle_ar?: string | null
          subtitle_en?: string | null
          title_ar: string
          title_en: string
          twitter_card?: string | null
          twitter_description?: string | null
          twitter_image_url?: string | null
          twitter_title?: string | null
          updated_at?: string
        }
        Update: {
          body_ar?: string | null
          body_en?: string | null
          canonical_url?: string | null
          created_at?: string
          custom_schema?: Json | null
          deleted_at?: string | null
          featured_image_url?: string | null
          gallery?: Json
          hero_image_url?: string | null
          id?: string
          keywords?: string[] | null
          locale?: string | null
          meta_description?: string | null
          meta_title?: string | null
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          page_type?: Database["public"]["Enums"]["cms_page_type"]
          published?: boolean
          related_ids?: string[]
          robots?: string | null
          schema_type?: string | null
          seo_released?: boolean
          slug?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          subtitle_ar?: string | null
          subtitle_en?: string | null
          title_ar?: string
          title_en?: string
          twitter_card?: string | null
          twitter_description?: string | null
          twitter_image_url?: string | null
          twitter_title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          assigned_to: string | null
          created_at: string
          customer_id: string | null
          email: string | null
          handled_at: string | null
          handled_by: string | null
          id: string
          ip_hash: string | null
          message: string
          name: string
          notes: string | null
          page_url: string | null
          phone: string | null
          source: string | null
          source_channel: string | null
          status: Database["public"]["Enums"]["contact_status"]
          subject: string | null
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          customer_id?: string | null
          email?: string | null
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          ip_hash?: string | null
          message: string
          name: string
          notes?: string | null
          page_url?: string | null
          phone?: string | null
          source?: string | null
          source_channel?: string | null
          status?: Database["public"]["Enums"]["contact_status"]
          subject?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          customer_id?: string | null
          email?: string | null
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          ip_hash?: string | null
          message?: string
          name?: string
          notes?: string | null
          page_url?: string | null
          phone?: string | null
          source?: string | null
          source_channel?: string | null
          status?: Database["public"]["Enums"]["contact_status"]
          subject?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_submissions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_submissions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_intelligence"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      corporate_accounts: {
        Row: {
          billing_address: string | null
          billing_cycle: string
          code: string
          company_name: string
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          created_at: string
          credit_limit: number
          discount_percent: number
          id: string
          is_active: boolean
          notes: string | null
          outstanding_balance: number
          updated_at: string
          vat_number: string | null
        }
        Insert: {
          billing_address?: string | null
          billing_cycle?: string
          code?: string
          company_name: string
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          credit_limit?: number
          discount_percent?: number
          id?: string
          is_active?: boolean
          notes?: string | null
          outstanding_balance?: number
          updated_at?: string
          vat_number?: string | null
        }
        Update: {
          billing_address?: string | null
          billing_cycle?: string
          code?: string
          company_name?: string
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          credit_limit?: number
          discount_percent?: number
          id?: string
          is_active?: boolean
          notes?: string | null
          outstanding_balance?: number
          updated_at?: string
          vat_number?: string | null
        }
        Relationships: []
      }
      coupons: {
        Row: {
          bg_color: string | null
          code: string
          created_at: string
          cta_text_ar: string | null
          cta_text_en: string | null
          cta_url: string | null
          description_ar: string | null
          description_en: string | null
          discount_type: string
          discount_value: number
          dismissible: boolean
          icon: string | null
          id: string
          is_active: boolean
          is_announcement: boolean
          max_uses: number | null
          priority: number
          show_once: boolean
          target_pages: string[]
          text_color: string | null
          title_ar: string | null
          title_en: string | null
          used_count: number
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          bg_color?: string | null
          code: string
          created_at?: string
          cta_text_ar?: string | null
          cta_text_en?: string | null
          cta_url?: string | null
          description_ar?: string | null
          description_en?: string | null
          discount_type: string
          discount_value: number
          dismissible?: boolean
          icon?: string | null
          id?: string
          is_active?: boolean
          is_announcement?: boolean
          max_uses?: number | null
          priority?: number
          show_once?: boolean
          target_pages?: string[]
          text_color?: string | null
          title_ar?: string | null
          title_en?: string | null
          used_count?: number
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          bg_color?: string | null
          code?: string
          created_at?: string
          cta_text_ar?: string | null
          cta_text_en?: string | null
          cta_url?: string | null
          description_ar?: string | null
          description_en?: string | null
          discount_type?: string
          discount_value?: number
          dismissible?: boolean
          icon?: string | null
          id?: string
          is_active?: boolean
          is_announcement?: boolean
          max_uses?: number | null
          priority?: number
          show_once?: boolean
          target_pages?: string[]
          text_color?: string | null
          title_ar?: string | null
          title_en?: string | null
          used_count?: number
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      customer_documents: {
        Row: {
          created_at: string
          customer_id: string
          doc_type: string
          expires_at: string | null
          file_path: string
          file_size: number | null
          id: string
          label: string | null
          mime_type: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          doc_type: string
          expires_at?: string | null
          file_path: string
          file_size?: number | null
          id?: string
          label?: string | null
          mime_type?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          doc_type?: string
          expires_at?: string | null
          file_path?: string
          file_size?: number | null
          id?: string
          label?: string | null
          mime_type?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_documents_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_documents_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_intelligence"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      customer_notes: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          customer_id: string
          id: string
          kind: Database["public"]["Enums"]["customer_note_kind"]
          pinned: boolean
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          customer_id: string
          id?: string
          kind?: Database["public"]["Enums"]["customer_note_kind"]
          pinned?: boolean
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          customer_id?: string
          id?: string
          kind?: Database["public"]["Enums"]["customer_note_kind"]
          pinned?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "customer_notes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_notes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_intelligence"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          alt_phone: string | null
          avg_booking_value: number
          cancelled_trips: number
          city: string | null
          company: string | null
          completed_trips: number
          corporate_account_id: string | null
          country: string | null
          created_at: string
          default_delivery_price: number | null
          email: string | null
          favorite_category_id: string | null
          favorite_driver_id: string | null
          favorite_dropoff: string | null
          favorite_pickup: string | null
          first_booking_at: string | null
          full_name: string
          id: string
          is_blocked: boolean
          last_booking_at: string | null
          no_show_trips: number
          notes: string | null
          phone: string | null
          preferred_language: string | null
          preferred_payment_method: string | null
          preferred_pickup_hour: number | null
          tags: string[]
          tier: Database["public"]["Enums"]["customer_tier"]
          total_spent: number
          total_trips: number
          updated_at: string
          vat_number: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          alt_phone?: string | null
          avg_booking_value?: number
          cancelled_trips?: number
          city?: string | null
          company?: string | null
          completed_trips?: number
          corporate_account_id?: string | null
          country?: string | null
          created_at?: string
          default_delivery_price?: number | null
          email?: string | null
          favorite_category_id?: string | null
          favorite_driver_id?: string | null
          favorite_dropoff?: string | null
          favorite_pickup?: string | null
          first_booking_at?: string | null
          full_name: string
          id?: string
          is_blocked?: boolean
          last_booking_at?: string | null
          no_show_trips?: number
          notes?: string | null
          phone?: string | null
          preferred_language?: string | null
          preferred_payment_method?: string | null
          preferred_pickup_hour?: number | null
          tags?: string[]
          tier?: Database["public"]["Enums"]["customer_tier"]
          total_spent?: number
          total_trips?: number
          updated_at?: string
          vat_number?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          alt_phone?: string | null
          avg_booking_value?: number
          cancelled_trips?: number
          city?: string | null
          company?: string | null
          completed_trips?: number
          corporate_account_id?: string | null
          country?: string | null
          created_at?: string
          default_delivery_price?: number | null
          email?: string | null
          favorite_category_id?: string | null
          favorite_driver_id?: string | null
          favorite_dropoff?: string | null
          favorite_pickup?: string | null
          first_booking_at?: string | null
          full_name?: string
          id?: string
          is_blocked?: boolean
          last_booking_at?: string | null
          no_show_trips?: number
          notes?: string | null
          phone?: string | null
          preferred_language?: string | null
          preferred_payment_method?: string | null
          preferred_pickup_hour?: number | null
          tags?: string[]
          tier?: Database["public"]["Enums"]["customer_tier"]
          total_spent?: number
          total_trips?: number
          updated_at?: string
          vat_number?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_corporate_account_id_fkey"
            columns: ["corporate_account_id"]
            isOneToOne: false
            referencedRelation: "corporate_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_favorite_category_id_fkey"
            columns: ["favorite_category_id"]
            isOneToOne: false
            referencedRelation: "vehicle_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_favorite_driver_id_fkey"
            columns: ["favorite_driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_favorite_driver_id_fkey"
            columns: ["favorite_driver_id"]
            isOneToOne: false
            referencedRelation: "v_driver_intelligence"
            referencedColumns: ["driver_id"]
          },
        ]
      }
      driver_documents: {
        Row: {
          created_at: string
          created_by: string | null
          document_number: string | null
          driver_id: string
          expires_on: string | null
          file_path: string | null
          id: string
          issued_on: string | null
          kind: Database["public"]["Enums"]["driver_doc_kind"]
          notes: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          document_number?: string | null
          driver_id: string
          expires_on?: string | null
          file_path?: string | null
          id?: string
          issued_on?: string | null
          kind: Database["public"]["Enums"]["driver_doc_kind"]
          notes?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          document_number?: string | null
          driver_id?: string
          expires_on?: string | null
          file_path?: string | null
          id?: string
          issued_on?: string | null
          kind?: Database["public"]["Enums"]["driver_doc_kind"]
          notes?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_documents_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_documents_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "v_driver_intelligence"
            referencedColumns: ["driver_id"]
          },
        ]
      }
      driver_payroll: {
        Row: {
          bonuses: number
          commission_amount: number
          commission_rate: number
          created_at: string
          created_by: string | null
          deductions: number
          driver_id: string
          gross_revenue: number
          id: string
          net_salary: number
          notes: string | null
          paid_at: string | null
          period_end: string
          period_start: string
          status: Database["public"]["Enums"]["payroll_status"]
          trip_count: number
          updated_at: string
        }
        Insert: {
          bonuses?: number
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          created_by?: string | null
          deductions?: number
          driver_id: string
          gross_revenue?: number
          id?: string
          net_salary?: number
          notes?: string | null
          paid_at?: string | null
          period_end: string
          period_start: string
          status?: Database["public"]["Enums"]["payroll_status"]
          trip_count?: number
          updated_at?: string
        }
        Update: {
          bonuses?: number
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          created_by?: string | null
          deductions?: number
          driver_id?: string
          gross_revenue?: number
          id?: string
          net_salary?: number
          notes?: string | null
          paid_at?: string | null
          period_end?: string
          period_start?: string
          status?: Database["public"]["Enums"]["payroll_status"]
          trip_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_payroll_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_payroll_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "v_driver_intelligence"
            referencedColumns: ["driver_id"]
          },
        ]
      }
      driver_vehicle_assignments: {
        Row: {
          assigned_by: string | null
          created_at: string
          driver_id: string
          ended_at: string | null
          id: string
          notes: string | null
          started_at: string
          vehicle_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          driver_id: string
          ended_at?: string | null
          id?: string
          notes?: string | null
          started_at?: string
          vehicle_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          driver_id?: string
          ended_at?: string | null
          id?: string
          notes?: string | null
          started_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_vehicle_assignments_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_vehicle_assignments_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "v_driver_intelligence"
            referencedColumns: ["driver_id"]
          },
          {
            foreignKeyName: "driver_vehicle_assignments_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "v_fleet_intelligence"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "driver_vehicle_assignments_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          address: string | null
          avg_rating: number | null
          cancelled_trips: number
          completed_trips: number
          created_at: string
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          employment_status: Database["public"]["Enums"]["employment_status"]
          full_name: string
          hired_at: string | null
          id: string
          insurance_expiry: string | null
          is_active: boolean
          languages: string[]
          license_class: string | null
          license_expiry: string | null
          license_number: string | null
          medical_expiry: string | null
          national_id: string | null
          no_show_trips: number
          notes: string | null
          phone: string | null
          photo_url: string | null
          rating: number | null
          status: Database["public"]["Enums"]["driver_status"]
          total_earnings: number
          total_trips: number
          updated_at: string
          user_id: string | null
          vehicle_id: string | null
          whatsapp: string | null
          work_permit_expiry: string | null
        }
        Insert: {
          address?: string | null
          avg_rating?: number | null
          cancelled_trips?: number
          completed_trips?: number
          created_at?: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employment_status?: Database["public"]["Enums"]["employment_status"]
          full_name: string
          hired_at?: string | null
          id?: string
          insurance_expiry?: string | null
          is_active?: boolean
          languages?: string[]
          license_class?: string | null
          license_expiry?: string | null
          license_number?: string | null
          medical_expiry?: string | null
          national_id?: string | null
          no_show_trips?: number
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          rating?: number | null
          status?: Database["public"]["Enums"]["driver_status"]
          total_earnings?: number
          total_trips?: number
          updated_at?: string
          user_id?: string | null
          vehicle_id?: string | null
          whatsapp?: string | null
          work_permit_expiry?: string | null
        }
        Update: {
          address?: string | null
          avg_rating?: number | null
          cancelled_trips?: number
          completed_trips?: number
          created_at?: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employment_status?: Database["public"]["Enums"]["employment_status"]
          full_name?: string
          hired_at?: string | null
          id?: string
          insurance_expiry?: string | null
          is_active?: boolean
          languages?: string[]
          license_class?: string | null
          license_expiry?: string | null
          license_number?: string | null
          medical_expiry?: string | null
          national_id?: string | null
          no_show_trips?: number
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          rating?: number | null
          status?: Database["public"]["Enums"]["driver_status"]
          total_earnings?: number
          total_trips?: number
          updated_at?: string
          user_id?: string | null
          vehicle_id?: string | null
          whatsapp?: string | null
          work_permit_expiry?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drivers_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "v_fleet_intelligence"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "drivers_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      error_logs: {
        Row: {
          created_at: string
          id: string
          level: string
          message: string
          metadata: Json
          resolved: boolean
          source: string
          stack: string | null
          url: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          level?: string
          message: string
          metadata?: Json
          resolved?: boolean
          source?: string
          stack?: string | null
          url?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          level?: string
          message?: string
          metadata?: Json
          resolved?: boolean
          source?: string
          stack?: string | null
          url?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          approved_by: string | null
          category: Database["public"]["Enums"]["expense_category"]
          created_at: string
          created_by: string | null
          currency: string
          driver_id: string | null
          expense_date: string
          id: string
          notes: string | null
          receipt_url: string | null
          reference: string
          supplier: string | null
          updated_at: string
          vat_amount: number
          vehicle_id: string | null
        }
        Insert: {
          amount: number
          approved_by?: string | null
          category: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          created_by?: string | null
          currency?: string
          driver_id?: string | null
          expense_date?: string
          id?: string
          notes?: string | null
          receipt_url?: string | null
          reference?: string
          supplier?: string | null
          updated_at?: string
          vat_amount?: number
          vehicle_id?: string | null
        }
        Update: {
          amount?: number
          approved_by?: string | null
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          created_by?: string | null
          currency?: string
          driver_id?: string | null
          expense_date?: string
          id?: string
          notes?: string | null
          receipt_url?: string | null
          reference?: string
          supplier?: string | null
          updated_at?: string
          vat_amount?: number
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "v_driver_intelligence"
            referencedColumns: ["driver_id"]
          },
          {
            foreignKeyName: "expenses_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "v_fleet_intelligence"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "expenses_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      faqs: {
        Row: {
          answer_ar: string
          answer_en: string
          category: string | null
          created_at: string
          id: string
          published: boolean
          question_ar: string
          question_en: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          answer_ar: string
          answer_en: string
          category?: string | null
          created_at?: string
          id?: string
          published?: boolean
          question_ar: string
          question_en: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          answer_ar?: string
          answer_en?: string
          category?: string | null
          created_at?: string
          id?: string
          published?: boolean
          question_ar?: string
          question_en?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      finance_settings: {
        Row: {
          company_address: string | null
          company_email: string | null
          company_name: string
          company_phone: string | null
          currency: string
          default_commission_rate: number
          id: string
          invoice_footer: string | null
          updated_at: string
          vat_number: string | null
          vat_rate: number
        }
        Insert: {
          company_address?: string | null
          company_email?: string | null
          company_name?: string
          company_phone?: string | null
          currency?: string
          default_commission_rate?: number
          id?: string
          invoice_footer?: string | null
          updated_at?: string
          vat_number?: string | null
          vat_rate?: number
        }
        Update: {
          company_address?: string | null
          company_email?: string | null
          company_name?: string
          company_phone?: string | null
          currency?: string
          default_commission_rate?: number
          id?: string
          invoice_footer?: string | null
          updated_at?: string
          vat_number?: string | null
          vat_rate?: number
        }
        Relationships: []
      }
      hero_slides: {
        Row: {
          active: boolean
          created_at: string
          cta_href: string | null
          cta_label_ar: string | null
          cta_label_en: string | null
          id: string
          image_url: string | null
          sort_order: number
          subtitle_ar: string | null
          subtitle_en: string | null
          title_ar: string
          title_en: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          cta_href?: string | null
          cta_label_ar?: string | null
          cta_label_en?: string | null
          id?: string
          image_url?: string | null
          sort_order?: number
          subtitle_ar?: string | null
          subtitle_en?: string | null
          title_ar: string
          title_en: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          cta_href?: string | null
          cta_label_ar?: string | null
          cta_label_en?: string | null
          id?: string
          image_url?: string | null
          sort_order?: number
          subtitle_ar?: string | null
          subtitle_en?: string | null
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Relationships: []
      }
      homepage_sections: {
        Row: {
          config: Json
          created_at: string
          enabled: boolean
          id: string
          section_key: string
          sort_order: number
          subtitle_ar: string | null
          subtitle_en: string | null
          title_ar: string | null
          title_en: string | null
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          section_key: string
          sort_order?: number
          subtitle_ar?: string | null
          subtitle_en?: string | null
          title_ar?: string | null
          title_en?: string | null
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          section_key?: string
          sort_order?: number
          subtitle_ar?: string | null
          subtitle_en?: string | null
          title_ar?: string | null
          title_en?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          booking_id: string | null
          corporate_account_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          customer_id: string | null
          discount_amount: number
          due_date: string | null
          id: string
          invoice_number: string
          issue_date: string
          notes: string | null
          paid_amount: number
          pdf_url: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          total_amount: number
          updated_at: string
          vat_amount: number
        }
        Insert: {
          booking_id?: string | null
          corporate_account_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_id?: string | null
          discount_amount?: number
          due_date?: string | null
          id?: string
          invoice_number: string
          issue_date?: string
          notes?: string | null
          paid_amount?: number
          pdf_url?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          total_amount?: number
          updated_at?: string
          vat_amount?: number
        }
        Update: {
          booking_id?: string | null
          corporate_account_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_id?: string | null
          discount_amount?: number
          due_date?: string | null
          id?: string
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          paid_amount?: number
          pdf_url?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          total_amount?: number
          updated_at?: string
          vat_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_corporate_account_id_fkey"
            columns: ["corporate_account_id"]
            isOneToOne: false
            referencedRelation: "corporate_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_intelligence"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      marketing_campaigns: {
        Row: {
          audience_filter: Json
          campaign_type: string
          created_at: string
          cron_expression: string | null
          id: string
          is_active: boolean
          last_run_at: string | null
          name: string
          next_run_at: string | null
          schedule_type: string
          scheduled_at: string | null
          stats: Json
          template_code: string | null
          updated_at: string
        }
        Insert: {
          audience_filter?: Json
          campaign_type: string
          created_at?: string
          cron_expression?: string | null
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          name: string
          next_run_at?: string | null
          schedule_type?: string
          scheduled_at?: string | null
          stats?: Json
          template_code?: string | null
          updated_at?: string
        }
        Update: {
          audience_filter?: Json
          campaign_type?: string
          created_at?: string
          cron_expression?: string | null
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          name?: string
          next_run_at?: string | null
          schedule_type?: string
          scheduled_at?: string | null
          stats?: Json
          template_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_campaigns_template_code_fkey"
            columns: ["template_code"]
            isOneToOne: false
            referencedRelation: "whatsapp_templates"
            referencedColumns: ["code"]
          },
        ]
      }
      media_library: {
        Row: {
          alt_text: string | null
          alt_text_ar: string | null
          caption: string | null
          content_type: string | null
          created_at: string
          filename: string
          height: number | null
          id: string
          path: string
          size_bytes: number | null
          tags: string[] | null
          updated_at: string
          uploaded_by: string | null
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          alt_text_ar?: string | null
          caption?: string | null
          content_type?: string | null
          created_at?: string
          filename: string
          height?: number | null
          id?: string
          path: string
          size_bytes?: number | null
          tags?: string[] | null
          updated_at?: string
          uploaded_by?: string | null
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          alt_text_ar?: string | null
          caption?: string | null
          content_type?: string | null
          created_at?: string
          filename?: string
          height?: number | null
          id?: string
          path?: string
          size_bytes?: number | null
          tags?: string[] | null
          updated_at?: string
          uploaded_by?: string | null
          width?: number | null
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          is_active: boolean
          label_ar: string
          label_en: string
          menu_id: string
          parent_id: string | null
          sort_order: number
          target: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          label_ar: string
          label_en: string
          menu_id: string
          parent_id?: string | null
          sort_order?: number
          target?: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          label_ar?: string
          label_en?: string
          menu_id?: string
          parent_id?: string | null
          sort_order?: number
          target?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "menus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      menus: {
        Row: {
          created_at: string
          description: string | null
          id: string
          location: string
          name: string
          published: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          location: string
          name: string
          published?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          location?: string
          name?: string
          published?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      notification_queue: {
        Row: {
          attempts: number
          channel: string
          created_at: string
          created_by: string | null
          id: string
          last_error: string | null
          max_attempts: number
          payload: Json
          recipient: string
          related_entity: string | null
          related_id: string | null
          scheduled_for: string
          sent_at: string | null
          status: string
          subject: string | null
          template: string | null
          updated_at: string
        }
        Insert: {
          attempts?: number
          channel: string
          created_at?: string
          created_by?: string | null
          id?: string
          last_error?: string | null
          max_attempts?: number
          payload?: Json
          recipient: string
          related_entity?: string | null
          related_id?: string | null
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          subject?: string | null
          template?: string | null
          updated_at?: string
        }
        Update: {
          attempts?: number
          channel?: string
          created_at?: string
          created_by?: string | null
          id?: string
          last_error?: string | null
          max_attempts?: number
          payload?: Json
          recipient?: string
          related_entity?: string | null
          related_id?: string | null
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          subject?: string | null
          template?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          data: Json | null
          id: string
          is_read: boolean
          title: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          title: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          title?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ops_snapshots: {
        Row: {
          captured_at: string
          id: string
          metrics: Json
        }
        Insert: {
          captured_at?: string
          id?: string
          metrics?: Json
        }
        Update: {
          captured_at?: string
          id?: string
          metrics?: Json
        }
        Relationships: []
      }
      partners: {
        Row: {
          active: boolean
          created_at: string
          id: string
          logo_url: string | null
          name: string
          sort_order: number
          updated_at: string
          website: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          sort_order?: number
          updated_at?: string
          website?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          sort_order?: number
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          booking_id: string
          coupon_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          customer_id: string | null
          discount_amount: number
          driver_id: string | null
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          paid_amount: number
          paid_at: string | null
          payment_number: string | null
          receipt_url: string | null
          reference_number: string | null
          status: Database["public"]["Enums"]["payment_status"]
          transaction_ref: string | null
          updated_at: string
          vat_amount: number
        }
        Insert: {
          amount: number
          booking_id: string
          coupon_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_id?: string | null
          discount_amount?: number
          driver_id?: string | null
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          paid_amount?: number
          paid_at?: string | null
          payment_number?: string | null
          receipt_url?: string | null
          reference_number?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          transaction_ref?: string | null
          updated_at?: string
          vat_amount?: number
        }
        Update: {
          amount?: number
          booking_id?: string
          coupon_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_id?: string | null
          discount_amount?: number
          driver_id?: string | null
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          paid_amount?: number
          paid_at?: string | null
          payment_number?: string | null
          receipt_url?: string | null
          reference_number?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          transaction_ref?: string | null
          updated_at?: string
          vat_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_intelligence"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "payments_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "v_driver_intelligence"
            referencedColumns: ["driver_id"]
          },
        ]
      }
      permissions: {
        Row: {
          action: string | null
          code: string
          description: string | null
          id: string
          module: string | null
        }
        Insert: {
          action?: string | null
          code: string
          description?: string | null
          id?: string
          module?: string | null
        }
        Update: {
          action?: string | null
          code?: string
          description?: string | null
          id?: string
          module?: string | null
        }
        Relationships: []
      }
      pricing_rules: {
        Row: {
          airport_fee: number
          category_id: string | null
          created_at: string
          id: string
          is_active: boolean
          min_fare: number
          night_end_hour: number
          night_start_hour: number
          night_surcharge_pct: number
          waiting_per_min: number
        }
        Insert: {
          airport_fee?: number
          category_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          min_fare?: number
          night_end_hour?: number
          night_start_hour?: number
          night_surcharge_pct?: number
          waiting_per_min?: number
        }
        Update: {
          airport_fee?: number
          category_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          min_fare?: number
          night_end_hour?: number
          night_start_hour?: number
          night_surcharge_pct?: number
          waiting_per_min?: number
        }
        Relationships: [
          {
            foreignKeyName: "pricing_rules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "vehicle_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_suggestions: {
        Row: {
          conditions: Json
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          suggested_amount: number | null
          suggested_percent: number | null
          suggestion_type: string
          updated_at: string
        }
        Insert: {
          conditions?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          suggested_amount?: number | null
          suggested_percent?: number | null
          suggestion_type: string
          updated_at?: string
        }
        Update: {
          conditions?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          suggested_amount?: number | null
          suggested_percent?: number | null
          suggestion_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_active: boolean
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      promotions: {
        Row: {
          active: boolean
          badge: string | null
          body_ar: string | null
          body_en: string | null
          created_at: string
          cta_href: string | null
          cta_label_ar: string | null
          cta_label_en: string | null
          ends_at: string | null
          id: string
          image_url: string | null
          sort_order: number
          starts_at: string | null
          title_ar: string
          title_en: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          badge?: string | null
          body_ar?: string | null
          body_en?: string | null
          created_at?: string
          cta_href?: string | null
          cta_label_ar?: string | null
          cta_label_en?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          sort_order?: number
          starts_at?: string | null
          title_ar: string
          title_en: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          badge?: string | null
          body_ar?: string | null
          body_en?: string | null
          created_at?: string
          cta_href?: string | null
          cta_label_ar?: string | null
          cta_label_en?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          sort_order?: number
          starts_at?: string | null
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Relationships: []
      }
      rate_limit_events: {
        Row: {
          bucket: string
          count: number
          created_at: string
          id: string
          key: string
        }
        Insert: {
          bucket: string
          count?: number
          created_at?: string
          id?: string
          key: string
        }
        Update: {
          bucket?: string
          count?: number
          created_at?: string
          id?: string
          key?: string
        }
        Relationships: []
      }
      refunds: {
        Row: {
          amount: number
          approved_by: string | null
          created_at: string
          created_by: string | null
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          payment_id: string
          reason: string | null
          reference: string
          refund_date: string
          refund_type: Database["public"]["Enums"]["refund_type"]
        }
        Insert: {
          amount: number
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          payment_id: string
          reason?: string | null
          reference?: string
          refund_date?: string
          refund_type?: Database["public"]["Enums"]["refund_type"]
        }
        Update: {
          amount?: number
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          payment_id?: string
          reason?: string | null
          reference?: string
          refund_date?: string
          refund_type?: Database["public"]["Enums"]["refund_type"]
        }
        Relationships: [
          {
            foreignKeyName: "refunds_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      review_requests: {
        Row: {
          booking_id: string
          channel: string
          comment: string | null
          created_at: string
          customer_id: string | null
          external_url: string | null
          follow_up_notes: string | null
          id: string
          rating: number | null
          responded_at: string | null
          sent_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          booking_id: string
          channel?: string
          comment?: string | null
          created_at?: string
          customer_id?: string | null
          external_url?: string | null
          follow_up_notes?: string | null
          id?: string
          rating?: number | null
          responded_at?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          booking_id?: string
          channel?: string
          comment?: string | null
          created_at?: string
          customer_id?: string | null
          external_url?: string | null
          follow_up_notes?: string | null
          id?: string
          rating?: number | null
          responded_at?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_intelligence"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          permission_id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      routes: {
        Row: {
          canonical_url: string | null
          created_at: string
          deleted_at: string | null
          description_ar: string | null
          description_en: string | null
          destination: string
          distance_km: number | null
          duration_min: number | null
          featured_image_url: string | null
          fixed_price: number | null
          gallery: Json
          id: string
          is_active: boolean
          keywords: string[] | null
          meta_description: string | null
          meta_title: string | null
          name: string
          og_description: string | null
          og_image_url: string | null
          og_title: string | null
          origin: string
          robots: string | null
          schema_type: string | null
          slug: string | null
          sort_order: number
          status: Database["public"]["Enums"]["content_status"]
          title_ar: string | null
          title_en: string | null
          twitter_description: string | null
          twitter_image_url: string | null
          twitter_title: string | null
          updated_at: string
        }
        Insert: {
          canonical_url?: string | null
          created_at?: string
          deleted_at?: string | null
          description_ar?: string | null
          description_en?: string | null
          destination: string
          distance_km?: number | null
          duration_min?: number | null
          featured_image_url?: string | null
          fixed_price?: number | null
          gallery?: Json
          id?: string
          is_active?: boolean
          keywords?: string[] | null
          meta_description?: string | null
          meta_title?: string | null
          name: string
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          origin: string
          robots?: string | null
          schema_type?: string | null
          slug?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          title_ar?: string | null
          title_en?: string | null
          twitter_description?: string | null
          twitter_image_url?: string | null
          twitter_title?: string | null
          updated_at?: string
        }
        Update: {
          canonical_url?: string | null
          created_at?: string
          deleted_at?: string | null
          description_ar?: string | null
          description_en?: string | null
          destination?: string
          distance_km?: number | null
          duration_min?: number | null
          featured_image_url?: string | null
          fixed_price?: number | null
          gallery?: Json
          id?: string
          is_active?: boolean
          keywords?: string[] | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          origin?: string
          robots?: string | null
          schema_type?: string | null
          slug?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          title_ar?: string | null
          title_en?: string | null
          twitter_description?: string | null
          twitter_image_url?: string | null
          twitter_title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      seo_meta: {
        Row: {
          created_at: string
          id: string
          json_ld: Json | null
          meta_description: string | null
          meta_title: string | null
          og_image_url: string | null
          path: string
          robots: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          json_ld?: Json | null
          meta_description?: string | null
          meta_title?: string | null
          og_image_url?: string | null
          path: string
          robots?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          json_ld?: Json | null
          meta_description?: string | null
          meta_title?: string | null
          og_image_url?: string | null
          path?: string
          robots?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      seo_redirects: {
        Row: {
          active: boolean
          created_at: string
          destination_path: string
          id: string
          source_path: string
          status_code: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          destination_path: string
          id?: string
          source_path: string
          status_code?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          destination_path?: string
          id?: string
          source_path?: string
          status_code?: number
          updated_at?: string
        }
        Relationships: []
      }
      seo_release_queue: {
        Row: {
          advantage: string
          approved_at: string | null
          approved_by: string | null
          approved_revision: string | null
          checks: Json
          competitor_urls: string[]
          content_id: string
          created_at: string
          entity_type: string
          id: string
          notes: string
          path: string
          priority: number
          released_at: string | null
          slug: string
          status: string
          title_ar: string
          title_en: string
          updated_at: string
        }
        Insert: {
          advantage?: string
          approved_at?: string | null
          approved_by?: string | null
          approved_revision?: string | null
          checks?: Json
          competitor_urls?: string[]
          content_id: string
          created_at?: string
          entity_type: string
          id?: string
          notes?: string
          path: string
          priority?: number
          released_at?: string | null
          slug: string
          status?: string
          title_ar: string
          title_en: string
          updated_at?: string
        }
        Update: {
          advantage?: string
          approved_at?: string | null
          approved_by?: string | null
          approved_revision?: string | null
          checks?: Json
          competitor_urls?: string[]
          content_id?: string
          created_at?: string
          entity_type?: string
          id?: string
          notes?: string
          path?: string
          priority?: number
          released_at?: string | null
          slug?: string
          status?: string
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Relationships: []
      }
      seo_release_settings: {
        Row: {
          id: boolean
          last_released_at: string | null
          next_release_at: string
          paused: boolean
        }
        Insert: {
          id?: boolean
          last_released_at?: string | null
          next_release_at?: string
          paused?: boolean
        }
        Update: {
          id?: boolean
          last_released_at?: string | null
          next_release_at?: string
          paused?: boolean
        }
        Relationships: []
      }
      settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      system_health_checks: {
        Row: {
          component: string
          created_at: string
          id: string
          latency_ms: number | null
          message: string | null
          metadata: Json | null
          status: string
        }
        Insert: {
          component: string
          created_at?: string
          id?: string
          latency_ms?: number | null
          message?: string | null
          metadata?: Json | null
          status: string
        }
        Update: {
          component?: string
          created_at?: string
          id?: string
          latency_ms?: number | null
          message?: string | null
          metadata?: Json | null
          status?: string
        }
        Relationships: []
      }
      task_comments: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          id: string
          task_id: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          id?: string
          task_id: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee_id: string | null
          attachments: Json
          booking_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          description: string | null
          driver_id: string | null
          due_at: string | null
          id: string
          priority: Database["public"]["Enums"]["task_priority"]
          status: Database["public"]["Enums"]["task_status"]
          tags: string[]
          title: string
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          assignee_id?: string | null
          attachments?: Json
          booking_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          description?: string | null
          driver_id?: string | null
          due_at?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          tags?: string[]
          title: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          assignee_id?: string | null
          attachments?: Json
          booking_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          description?: string | null
          driver_id?: string | null
          due_at?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          tags?: string[]
          title?: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_intelligence"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "tasks_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "v_driver_intelligence"
            referencedColumns: ["driver_id"]
          },
          {
            foreignKeyName: "tasks_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "v_fleet_intelligence"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "tasks_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          bio_ar: string | null
          bio_en: string | null
          created_at: string
          deleted_at: string | null
          email: string | null
          id: string
          linkedin_url: string | null
          meta_description: string | null
          meta_title: string | null
          name_ar: string
          name_en: string
          phone: string | null
          photo_url: string | null
          role_ar: string | null
          role_en: string | null
          slug: string | null
          sort_order: number
          status: Database["public"]["Enums"]["content_status"]
          updated_at: string
        }
        Insert: {
          bio_ar?: string | null
          bio_en?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          linkedin_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          name_ar: string
          name_en: string
          phone?: string | null
          photo_url?: string | null
          role_ar?: string | null
          role_en?: string | null
          slug?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
        }
        Update: {
          bio_ar?: string | null
          bio_en?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          linkedin_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          name_ar?: string
          name_en?: string
          phone?: string | null
          photo_url?: string | null
          role_ar?: string | null
          role_en?: string | null
          slug?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          avatar_url: string | null
          created_at: string
          deleted_at: string | null
          id: string
          location_ar: string | null
          location_en: string | null
          name: string
          published: boolean
          quote_ar: string
          quote_en: string
          rating: number
          role_ar: string | null
          role_en: string | null
          sort_order: number
          status: Database["public"]["Enums"]["content_status"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          location_ar?: string | null
          location_en?: string | null
          name: string
          published?: boolean
          quote_ar: string
          quote_en: string
          rating?: number
          role_ar?: string | null
          role_en?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          location_ar?: string | null
          location_en?: string | null
          name?: string
          published?: boolean
          quote_ar?: string
          quote_en?: string
          rating?: number
          role_ar?: string | null
          role_en?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
        }
        Relationships: []
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
      vehicle_categories: {
        Row: {
          base_fare: number
          code: string
          created_at: string
          deleted_at: string | null
          featured_image_url: string | null
          gallery: Json
          id: string
          is_active: boolean
          meta_description: string | null
          meta_title: string | null
          og_image_url: string | null
          price_per_km: number
          price_per_min: number
          seats: number
          sort_order: number
          status: Database["public"]["Enums"]["content_status"]
        }
        Insert: {
          base_fare?: number
          code: string
          created_at?: string
          deleted_at?: string | null
          featured_image_url?: string | null
          gallery?: Json
          id?: string
          is_active?: boolean
          meta_description?: string | null
          meta_title?: string | null
          og_image_url?: string | null
          price_per_km?: number
          price_per_min?: number
          seats?: number
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
        }
        Update: {
          base_fare?: number
          code?: string
          created_at?: string
          deleted_at?: string | null
          featured_image_url?: string | null
          gallery?: Json
          id?: string
          is_active?: boolean
          meta_description?: string | null
          meta_title?: string | null
          og_image_url?: string | null
          price_per_km?: number
          price_per_min?: number
          seats?: number
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
        }
        Relationships: []
      }
      vehicle_category_translations: {
        Row: {
          category_id: string
          description: string | null
          id: string
          locale: string
          name: string
        }
        Insert: {
          category_id: string
          description?: string | null
          id?: string
          locale: string
          name: string
        }
        Update: {
          category_id?: string
          description?: string | null
          id?: string
          locale?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_category_translations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "vehicle_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_documents: {
        Row: {
          created_at: string
          created_by: string | null
          document_number: string | null
          expires_on: string | null
          file_path: string | null
          id: string
          issued_on: string | null
          kind: Database["public"]["Enums"]["vehicle_doc_kind"]
          notes: string | null
          title: string | null
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          document_number?: string | null
          expires_on?: string | null
          file_path?: string | null
          id?: string
          issued_on?: string | null
          kind: Database["public"]["Enums"]["vehicle_doc_kind"]
          notes?: string | null
          title?: string | null
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          document_number?: string | null
          expires_on?: string | null
          file_path?: string | null
          id?: string
          issued_on?: string | null
          kind?: Database["public"]["Enums"]["vehicle_doc_kind"]
          notes?: string | null
          title?: string | null
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_documents_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "v_fleet_intelligence"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "vehicle_documents_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_maintenance: {
        Row: {
          cost: number
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          kind: Database["public"]["Enums"]["maintenance_kind"]
          mileage: number | null
          next_due_date: string | null
          next_due_mileage: number | null
          notes: string | null
          service_date: string
          updated_at: string
          vehicle_id: string
          vendor: string | null
        }
        Insert: {
          cost?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          kind: Database["public"]["Enums"]["maintenance_kind"]
          mileage?: number | null
          next_due_date?: string | null
          next_due_mileage?: number | null
          notes?: string | null
          service_date?: string
          updated_at?: string
          vehicle_id: string
          vendor?: string | null
        }
        Update: {
          cost?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["maintenance_kind"]
          mileage?: number | null
          next_due_date?: string | null
          next_due_mileage?: number | null
          notes?: string | null
          service_date?: string
          updated_at?: string
          vehicle_id?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_maintenance_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "v_fleet_intelligence"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "vehicle_maintenance_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          category_id: string | null
          color: string | null
          created_at: string
          current_mileage: number
          fuel_type: string | null
          id: string
          inspection_expiry: string | null
          insurance_expiry: string | null
          internal_code: string | null
          last_maintenance_date: string | null
          luggage_capacity: number
          make: string | null
          model: string | null
          next_maintenance_date: string | null
          next_maintenance_mileage: number | null
          notes: string | null
          plate_number: string
          registration_expiry: string | null
          road_tax_expiry: string | null
          seats: number
          status: Database["public"]["Enums"]["vehicle_status"]
          taxi_permit_expiry: string | null
          transmission: string | null
          updated_at: string
          vin: string | null
          year: number | null
        }
        Insert: {
          category_id?: string | null
          color?: string | null
          created_at?: string
          current_mileage?: number
          fuel_type?: string | null
          id?: string
          inspection_expiry?: string | null
          insurance_expiry?: string | null
          internal_code?: string | null
          last_maintenance_date?: string | null
          luggage_capacity?: number
          make?: string | null
          model?: string | null
          next_maintenance_date?: string | null
          next_maintenance_mileage?: number | null
          notes?: string | null
          plate_number: string
          registration_expiry?: string | null
          road_tax_expiry?: string | null
          seats?: number
          status?: Database["public"]["Enums"]["vehicle_status"]
          taxi_permit_expiry?: string | null
          transmission?: string | null
          updated_at?: string
          vin?: string | null
          year?: number | null
        }
        Update: {
          category_id?: string | null
          color?: string | null
          created_at?: string
          current_mileage?: number
          fuel_type?: string | null
          id?: string
          inspection_expiry?: string | null
          insurance_expiry?: string | null
          internal_code?: string | null
          last_maintenance_date?: string | null
          luggage_capacity?: number
          make?: string | null
          model?: string | null
          next_maintenance_date?: string | null
          next_maintenance_mileage?: number | null
          notes?: string | null
          plate_number?: string
          registration_expiry?: string | null
          road_tax_expiry?: string | null
          seats?: number
          status?: Database["public"]["Enums"]["vehicle_status"]
          taxi_permit_expiry?: string | null
          transmission?: string | null
          updated_at?: string
          vin?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "vehicle_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          body: string
          booking_id: string | null
          contact_id: string | null
          created_at: string
          customer_id: string | null
          direction: string
          id: string
          locale: string
          phone: string
          sent_by: string | null
          template_code: string | null
        }
        Insert: {
          body: string
          booking_id?: string | null
          contact_id?: string | null
          created_at?: string
          customer_id?: string | null
          direction?: string
          id?: string
          locale?: string
          phone: string
          sent_by?: string | null
          template_code?: string | null
        }
        Update: {
          body?: string
          booking_id?: string | null
          contact_id?: string | null
          created_at?: string
          customer_id?: string | null
          direction?: string
          id?: string
          locale?: string
          phone?: string
          sent_by?: string | null
          template_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contact_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_intelligence"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      whatsapp_templates: {
        Row: {
          body_ar: string
          body_en: string
          category: string
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
          variables: string[]
        }
        Insert: {
          body_ar: string
          body_en: string
          category?: string
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
          variables?: string[]
        }
        Update: {
          body_ar?: string
          body_en?: string
          category?: string
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
          variables?: string[]
        }
        Relationships: []
      }
    }
    Views: {
      v_customer_intelligence: {
        Row: {
          average_spend: number | null
          cancellation_rate: number | null
          customer_id: string | null
          favorite_category_id: string | null
          favorite_dropoff: string | null
          favorite_pickup: string | null
          last_booking_at: string | null
          lifetime_value: number | null
          next_booking_at: string | null
          preferred_payment_method: string | null
          preferred_pickup_hour: number | null
          risk_score: number | null
          total_trips: number | null
          vip_score: number | null
        }
        Insert: {
          average_spend?: number | null
          cancellation_rate?: never
          customer_id?: string | null
          favorite_category_id?: string | null
          favorite_dropoff?: string | null
          favorite_pickup?: string | null
          last_booking_at?: string | null
          lifetime_value?: number | null
          next_booking_at?: never
          preferred_payment_method?: never
          preferred_pickup_hour?: never
          risk_score?: never
          total_trips?: number | null
          vip_score?: never
        }
        Update: {
          average_spend?: number | null
          cancellation_rate?: never
          customer_id?: string | null
          favorite_category_id?: string | null
          favorite_dropoff?: string | null
          favorite_pickup?: string | null
          last_booking_at?: string | null
          lifetime_value?: number | null
          next_booking_at?: never
          preferred_payment_method?: never
          preferred_pickup_hour?: never
          risk_score?: never
          total_trips?: number | null
          vip_score?: never
        }
        Relationships: [
          {
            foreignKeyName: "customers_favorite_category_id_fkey"
            columns: ["favorite_category_id"]
            isOneToOne: false
            referencedRelation: "vehicle_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      v_driver_intelligence: {
        Row: {
          average_rating: number | null
          cancellation_rate: number | null
          cancelled_trips: number | null
          completed_trips: number | null
          completion_rate: number | null
          driver_id: string | null
          performance_score: number | null
          revenue_generated: number | null
          total_trips: number | null
          trips_this_month: number | null
          trips_today: number | null
        }
        Insert: {
          average_rating?: number | null
          cancellation_rate?: never
          cancelled_trips?: number | null
          completed_trips?: number | null
          completion_rate?: never
          driver_id?: string | null
          performance_score?: never
          revenue_generated?: number | null
          total_trips?: number | null
          trips_this_month?: never
          trips_today?: never
        }
        Update: {
          average_rating?: number | null
          cancellation_rate?: never
          cancelled_trips?: number | null
          completed_trips?: number | null
          completion_rate?: never
          driver_id?: string | null
          performance_score?: never
          revenue_generated?: number | null
          total_trips?: number | null
          trips_this_month?: never
          trips_today?: never
        }
        Relationships: []
      }
      v_fleet_intelligence: {
        Row: {
          fuel_cost: number | null
          maintenance_cost: number | null
          next_maintenance: string | null
          revenue: number | null
          total_trips: number | null
          utilization_pct: number | null
          vehicle_id: string | null
        }
        Insert: {
          fuel_cost?: never
          maintenance_cost?: never
          next_maintenance?: never
          revenue?: never
          total_trips?: never
          utilization_pct?: never
          vehicle_id?: string | null
        }
        Update: {
          fuel_cost?: never
          maintenance_cost?: never
          next_maintenance?: never
          revenue?: never
          total_trips?: never
          utilization_pct?: never
          vehicle_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_permission: {
        Args: { _code: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_finance: { Args: { _user_id: string }; Returns: boolean }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      process_seo_release: { Args: never; Returns: string }
      recompute_customer_stats: {
        Args: { _customer_id: string }
        Returns: undefined
      }
      recompute_driver_stats: {
        Args: { _driver_id: string }
        Returns: undefined
      }
      seo_content_revision: {
        Args: { _id: string; _type: string }
        Returns: string
      }
      user_permissions: {
        Args: { _user_id: string }
        Returns: {
          action: string
          code: string
          module: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "dispatcher" | "accountant" | "driver"
      blog_status: "draft" | "scheduled" | "published" | "archived"
      booking_status:
        | "pending"
        | "confirmed"
        | "assigned"
        | "en_route"
        | "on_trip"
        | "picked_up"
        | "completed"
        | "cancelled"
        | "no_show"
      cms_page_type:
        | "generic"
        | "service"
        | "airport"
        | "city"
        | "route_page"
        | "category"
      contact_status: "new" | "in_progress" | "converted" | "closed" | "spam"
      content_status: "draft" | "published" | "archived"
      customer_note_kind:
        | "note"
        | "call"
        | "whatsapp"
        | "complaint"
        | "compliment"
        | "follow_up"
      customer_tier: "regular" | "vip" | "corporate" | "blacklisted"
      driver_doc_kind:
        | "license"
        | "national_id"
        | "medical"
        | "work_permit"
        | "insurance"
        | "other"
      driver_status:
        | "offline"
        | "available"
        | "on_trip"
        | "on_break"
        | "suspended"
        | "assigned"
        | "en_route"
        | "waiting"
        | "vacation"
      employment_status:
        | "active"
        | "probation"
        | "suspended"
        | "terminated"
        | "vacation"
      expense_category:
        | "fuel"
        | "maintenance"
        | "insurance"
        | "vehicle_repair"
        | "driver_salary"
        | "marketing"
        | "office"
        | "software"
        | "taxes"
        | "other"
      invoice_status:
        | "draft"
        | "issued"
        | "paid"
        | "partially_paid"
        | "overdue"
        | "cancelled"
      maintenance_kind:
        | "oil_change"
        | "tire"
        | "brake"
        | "battery"
        | "inspection"
        | "general"
        | "repair"
        | "other"
      payment_method:
        | "cash"
        | "card"
        | "wallet"
        | "bank_transfer"
        | "online"
        | "corporate_account"
        | "invoice_later"
      payment_status:
        | "pending"
        | "paid"
        | "failed"
        | "refunded"
        | "partially_paid"
        | "cancelled"
      payroll_status: "draft" | "approved" | "paid"
      refund_type: "full" | "partial"
      task_priority: "low" | "normal" | "high" | "urgent"
      task_status: "open" | "in_progress" | "blocked" | "done" | "cancelled"
      vehicle_doc_kind:
        | "registration"
        | "insurance"
        | "inspection"
        | "taxi_permit"
        | "road_tax"
        | "other"
      vehicle_status:
        | "active"
        | "maintenance"
        | "retired"
        | "available"
        | "assigned"
        | "on_trip"
        | "out_of_service"
        | "reserved"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "manager", "dispatcher", "accountant", "driver"],
      blog_status: ["draft", "scheduled", "published", "archived"],
      booking_status: [
        "pending",
        "confirmed",
        "assigned",
        "en_route",
        "on_trip",
        "picked_up",
        "completed",
        "cancelled",
        "no_show",
      ],
      cms_page_type: [
        "generic",
        "service",
        "airport",
        "city",
        "route_page",
        "category",
      ],
      contact_status: ["new", "in_progress", "converted", "closed", "spam"],
      content_status: ["draft", "published", "archived"],
      customer_note_kind: [
        "note",
        "call",
        "whatsapp",
        "complaint",
        "compliment",
        "follow_up",
      ],
      customer_tier: ["regular", "vip", "corporate", "blacklisted"],
      driver_doc_kind: [
        "license",
        "national_id",
        "medical",
        "work_permit",
        "insurance",
        "other",
      ],
      driver_status: [
        "offline",
        "available",
        "on_trip",
        "on_break",
        "suspended",
        "assigned",
        "en_route",
        "waiting",
        "vacation",
      ],
      employment_status: [
        "active",
        "probation",
        "suspended",
        "terminated",
        "vacation",
      ],
      expense_category: [
        "fuel",
        "maintenance",
        "insurance",
        "vehicle_repair",
        "driver_salary",
        "marketing",
        "office",
        "software",
        "taxes",
        "other",
      ],
      invoice_status: [
        "draft",
        "issued",
        "paid",
        "partially_paid",
        "overdue",
        "cancelled",
      ],
      maintenance_kind: [
        "oil_change",
        "tire",
        "brake",
        "battery",
        "inspection",
        "general",
        "repair",
        "other",
      ],
      payment_method: [
        "cash",
        "card",
        "wallet",
        "bank_transfer",
        "online",
        "corporate_account",
        "invoice_later",
      ],
      payment_status: [
        "pending",
        "paid",
        "failed",
        "refunded",
        "partially_paid",
        "cancelled",
      ],
      payroll_status: ["draft", "approved", "paid"],
      refund_type: ["full", "partial"],
      task_priority: ["low", "normal", "high", "urgent"],
      task_status: ["open", "in_progress", "blocked", "done", "cancelled"],
      vehicle_doc_kind: [
        "registration",
        "insurance",
        "inspection",
        "taxi_permit",
        "road_tax",
        "other",
      ],
      vehicle_status: [
        "active",
        "maintenance",
        "retired",
        "available",
        "assigned",
        "on_trip",
        "out_of_service",
        "reserved",
      ],
    },
  },
} as const
