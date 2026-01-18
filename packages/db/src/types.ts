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
      properties: {
        Row: {
          id: string
          address_normalized: string
          street_address: string
          city: string
          state: string | null
          zip: string | null
          price: number | null
          sqft: number | null
          beds: number | null
          baths: number | null
          year_built: number | null
          lot_size: number | null
          listing_id: string | null
          list_date: string | null
          dom: number | null
          status: string | null
          distress_code: string | null
          source: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          address_normalized: string
          street_address: string
          city: string
          state?: string | null
          zip?: string | null
          price?: number | null
          sqft?: number | null
          beds?: number | null
          baths?: number | null
          year_built?: number | null
          lot_size?: number | null
          listing_id?: string | null
          list_date?: string | null
          dom?: number | null
          status?: string | null
          distress_code?: string | null
          source?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          address_normalized?: string
          street_address?: string
          city?: string
          state?: string | null
          zip?: string | null
          price?: number | null
          sqft?: number | null
          beds?: number | null
          baths?: number | null
          year_built?: number | null
          lot_size?: number | null
          listing_id?: string | null
          list_date?: string | null
          dom?: number | null
          status?: string | null
          distress_code?: string | null
          source?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      contacts: {
        Row: {
          id: string
          property_id: string | null
          name: string
          role: string | null
          is_decision_maker: boolean | null
          priority: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          property_id?: string | null
          name: string
          role?: string | null
          is_decision_maker?: boolean | null
          priority?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          property_id?: string | null
          name?: string
          role?: string | null
          is_decision_maker?: boolean | null
          priority?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      phones: {
        Row: {
          id: string
          contact_id: string | null
          number: string
          number_normalized: string | null
          type: string | null
          is_dnc: boolean | null
          is_verified: boolean | null
          last_attempt: string | null
          attempt_count: number | null
          last_result: string | null
          created_at: string
        }
        Insert: {
          id?: string
          contact_id?: string | null
          number: string
          number_normalized?: string | null
          type?: string | null
          is_dnc?: boolean | null
          is_verified?: boolean | null
          last_attempt?: string | null
          attempt_count?: number | null
          last_result?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          contact_id?: string | null
          number?: string
          number_normalized?: string | null
          type?: string | null
          is_dnc?: boolean | null
          is_verified?: boolean | null
          last_attempt?: string | null
          attempt_count?: number | null
          last_result?: string | null
          created_at?: string
        }
      }
      emails: {
        Row: {
          id: string
          contact_id: string | null
          email: string
          is_verified: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          contact_id?: string | null
          email: string
          is_verified?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          contact_id?: string | null
          email?: string
          is_verified?: boolean | null
          created_at?: string
        }
      }
      call_log: {
        Row: {
          id: string
          phone_id: string | null
          contact_id: string | null
          property_id: string | null
          called_at: string
          duration: number | null
          outcome: string | null
          is_decision_maker: boolean | null
          interested: boolean | null
          appointment_set: boolean | null
          appointment_date: string | null
          notes: string | null
          recording_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          phone_id?: string | null
          contact_id?: string | null
          property_id?: string | null
          called_at?: string
          duration?: number | null
          outcome?: string | null
          is_decision_maker?: boolean | null
          interested?: boolean | null
          appointment_set?: boolean | null
          appointment_date?: string | null
          notes?: string | null
          recording_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          phone_id?: string | null
          contact_id?: string | null
          property_id?: string | null
          called_at?: string
          duration?: number | null
          outcome?: string | null
          is_decision_maker?: boolean | null
          interested?: boolean | null
          appointment_set?: boolean | null
          appointment_date?: string | null
          notes?: string | null
          recording_url?: string | null
          created_at?: string
        }
      }
      lead_actions: {
        Row: {
          id: string
          property_id: string | null
          user_id: string | null
          action_type: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          property_id?: string | null
          user_id?: string | null
          action_type: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          property_id?: string | null
          user_id?: string | null
          action_type?: string
          notes?: string | null
          created_at?: string
        }
      }
      import_log: {
        Row: {
          id: string
          source: string
          filename: string | null
          total_records: number | null
          imported: number | null
          duplicates: number | null
          errors: number | null
          imported_by: string | null
          imported_at: string
        }
        Insert: {
          id?: string
          source: string
          filename?: string | null
          total_records?: number | null
          imported?: number | null
          duplicates?: number | null
          errors?: number | null
          imported_by?: string | null
          imported_at?: string
        }
        Update: {
          id?: string
          source?: string
          filename?: string | null
          total_records?: number | null
          imported?: number | null
          duplicates?: number | null
          errors?: number | null
          imported_by?: string | null
          imported_at?: string
        }
      }
      crm_leads: {
        Row: {
          id: string
          property_id: string
          status: 'new' | 'contacted' | 'interested' | 'appointment' | 'closed' | 'dead'
          priority: 'hot' | 'normal' | 'low'
          next_action: string | null
          next_action_date: string | null
          last_activity_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          property_id: string
          status?: 'new' | 'contacted' | 'interested' | 'appointment' | 'closed' | 'dead'
          priority?: 'hot' | 'normal' | 'low'
          next_action?: string | null
          next_action_date?: string | null
          last_activity_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          status?: 'new' | 'contacted' | 'interested' | 'appointment' | 'closed' | 'dead'
          priority?: 'hot' | 'normal' | 'low'
          next_action?: string | null
          next_action_date?: string | null
          last_activity_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      crm_activities: {
        Row: {
          id: string
          crm_lead_id: string
          activity_type: 'call' | 'email' | 'note' | 'status_change'
          outcome: string | null
          notes: string | null
          contact_id: string | null
          phone_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          crm_lead_id: string
          activity_type: 'call' | 'email' | 'note' | 'status_change'
          outcome?: string | null
          notes?: string | null
          contact_id?: string | null
          phone_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          crm_lead_id?: string
          activity_type?: 'call' | 'email' | 'note' | 'status_change'
          outcome?: string | null
          notes?: string | null
          contact_id?: string | null
          phone_id?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      callable_leads: {
        Row: {
          property_id: string | null
          address_normalized: string | null
          street_address: string | null
          city: string | null
          state: string | null
          zip: string | null
          price: number | null
          sqft: number | null
          beds: number | null
          baths: number | null
          year_built: number | null
          dom: number | null
          status: string | null
          distress_code: string | null
          contact_id: string | null
          contact_name: string | null
          role: string | null
          is_decision_maker: boolean | null
          phone_id: string | null
          phone_number: string | null
          phone_type: string | null
          is_dnc: boolean | null
          is_verified: boolean | null
          last_result: string | null
        }
      }
      crm_leads_full: {
        Row: {
          id: string
          property_id: string
          status: string
          priority: string
          next_action: string | null
          next_action_date: string | null
          last_activity_date: string | null
          crm_created_at: string
          crm_updated_at: string
          street_address: string
          city: string
          state: string | null
          zip: string | null
          price: number | null
          sqft: number | null
          beds: number | null
          baths: number | null
          year_built: number | null
          list_date: string | null
          dom: number | null
          property_status: string | null
          callable_phones: number
          total_emails: number
          total_contacts: number
        }
      }
    }
    Functions: {}
    Enums: {}
  }
}

// Convenience types
export type Property = Database['public']['Tables']['properties']['Row']
export type Contact = Database['public']['Tables']['contacts']['Row']
export type Phone = Database['public']['Tables']['phones']['Row']
export type Email = Database['public']['Tables']['emails']['Row']
export type CallLog = Database['public']['Tables']['call_log']['Row']
export type CallableLead = Database['public']['Views']['callable_leads']['Row']
export type CrmLead = Database['public']['Tables']['crm_leads']['Row']
export type CrmActivity = Database['public']['Tables']['crm_activities']['Row']
export type CrmLeadFull = Database['public']['Views']['crm_leads_full']['Row']

// CRM Status and Priority types
export type CrmStatus = 'new' | 'contacted' | 'interested' | 'appointment' | 'closed' | 'dead'
export type CrmPriority = 'hot' | 'normal' | 'low'
export type ActivityType = 'call' | 'email' | 'note' | 'status_change'