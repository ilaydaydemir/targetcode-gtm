export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'user' | 'admin'
          onboarding_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'user' | 'admin'
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'user' | 'admin'
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          company_name: string | null
          company_website: string | null
          company_description: string | null
          company_size: string | null
          founding_year: number | null
          headquarters_location: string | null
          industry: string | null
          target_market: string | null
          product_service_description: string | null
          unique_value_proposition: string | null
          pricing_model: string | null
          icp_job_titles: string[]
          icp_industries: string[]
          icp_company_sizes: string[]
          icp_geographic_regions: string[]
          icp_pain_points: string | null
          icp_goals: string | null
          icp_budget_range: string | null
          sales_cycle_length: string | null
          main_competitors: string | null
          key_differentiators: string | null
          preferred_tone: string
          custom_instructions: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_name?: string | null
          company_website?: string | null
          company_description?: string | null
          company_size?: string | null
          founding_year?: number | null
          headquarters_location?: string | null
          industry?: string | null
          target_market?: string | null
          product_service_description?: string | null
          unique_value_proposition?: string | null
          pricing_model?: string | null
          icp_job_titles?: string[]
          icp_industries?: string[]
          icp_company_sizes?: string[]
          icp_geographic_regions?: string[]
          icp_pain_points?: string | null
          icp_goals?: string | null
          icp_budget_range?: string | null
          sales_cycle_length?: string | null
          main_competitors?: string | null
          key_differentiators?: string | null
          preferred_tone?: string
          custom_instructions?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_name?: string | null
          company_website?: string | null
          company_description?: string | null
          company_size?: string | null
          founding_year?: number | null
          headquarters_location?: string | null
          industry?: string | null
          target_market?: string | null
          product_service_description?: string | null
          unique_value_proposition?: string | null
          pricing_model?: string | null
          icp_job_titles?: string[]
          icp_industries?: string[]
          icp_company_sizes?: string[]
          icp_geographic_regions?: string[]
          icp_pain_points?: string | null
          icp_goals?: string | null
          icp_budget_range?: string | null
          sales_cycle_length?: string | null
          main_competitors?: string | null
          key_differentiators?: string | null
          preferred_tone?: string
          custom_instructions?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          id: string
          user_id: string
          first_name: string | null
          last_name: string | null
          email: string | null
          phone: string | null
          company: string | null
          job_title: string | null
          linkedin_url: string | null
          website: string | null
          location: string | null
          source: string | null
          tags: string[]
          notes: string | null
          status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'
          enrichment_data: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          phone?: string | null
          company?: string | null
          job_title?: string | null
          linkedin_url?: string | null
          website?: string | null
          location?: string | null
          source?: string | null
          tags?: string[]
          notes?: string | null
          status?: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'
          enrichment_data?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          phone?: string | null
          company?: string | null
          job_title?: string | null
          linkedin_url?: string | null
          website?: string | null
          location?: string | null
          source?: string | null
          tags?: string[]
          notes?: string | null
          status?: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'
          enrichment_data?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          id: string
          user_id: string
          title: string
          summary: string | null
          type: 'chat' | 'vibe'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string
          summary?: string | null
          type?: 'chat' | 'vibe'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          summary?: string | null
          type?: 'chat' | 'vibe'
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          id: string
          user_id: string
          conversation_id: string | null
          role: 'user' | 'assistant' | 'system'
          content: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          conversation_id?: string | null
          role: 'user' | 'assistant' | 'system'
          content: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          conversation_id?: string | null
          role?: 'user' | 'assistant' | 'system'
          content?: string
          metadata?: Json
          created_at?: string
        }
        Relationships: []
      }
      workflows: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          steps: Json
          schedule: string | null
          is_active: boolean
          last_run_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          steps?: Json
          schedule?: string | null
          is_active?: boolean
          last_run_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          steps?: Json
          schedule?: string | null
          is_active?: boolean
          last_run_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      workflow_runs: {
        Row: {
          id: string
          user_id: string
          workflow_id: string | null
          status: 'pending' | 'running' | 'completed' | 'failed'
          progress: number
          result: Json
          error_message: string | null
          started_at: string | null
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          workflow_id?: string | null
          status?: 'pending' | 'running' | 'completed' | 'failed'
          progress?: number
          result?: Json
          error_message?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          workflow_id?: string | null
          status?: 'pending' | 'running' | 'completed' | 'failed'
          progress?: number
          result?: Json
          error_message?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      custom_components: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          type: 'widget' | 'page' | 'workflow_step'
          code: string
          config: Json
          is_active: boolean
          version: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          type: 'widget' | 'page' | 'workflow_step'
          code: string
          config?: Json
          is_active?: boolean
          version?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          type?: 'widget' | 'page' | 'workflow_step'
          code?: string
          config?: Json
          is_active?: boolean
          version?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      data_sources: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'apify' | 'api' | 'webhook' | 'csv' | 'manual'
          config: Json
          is_active: boolean
          last_synced_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: 'apify' | 'api' | 'webhook' | 'csv' | 'manual'
          config?: Json
          is_active?: boolean
          last_synced_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: 'apify' | 'api' | 'webhook' | 'csv' | 'manual'
          config?: Json
          is_active?: boolean
          last_synced_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          type: 'email' | 'linkedin' | 'multi_channel' | null
          status: 'draft' | 'active' | 'paused' | 'completed'
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          type?: 'email' | 'linkedin' | 'multi_channel' | null
          status?: 'draft' | 'active' | 'paused' | 'completed'
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          type?: 'email' | 'linkedin' | 'multi_channel' | null
          status?: 'draft' | 'active' | 'paused' | 'completed'
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_navigation: {
        Row: {
          id: string
          user_id: string
          menu_items: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          menu_items?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          menu_items?: Json
          created_at?: string
          updated_at?: string
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience type helpers
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
