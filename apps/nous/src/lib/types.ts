// Extended types for leads dashboard with nested relations

export interface Phone {
  id: string
  contact_id: string | null
  number: string
  number_normalized: string | null
  type: 'cell' | 'landline' | 'voip' | 'unknown' | string | null
  is_dnc: boolean | null
  is_verified: boolean | null
  attempt_count: number | null
  last_result: string | null
}

export interface Email {
  id: string
  contact_id: string | null
  email: string
  is_verified: boolean | null
}

export interface Contact {
  id: string
  property_id: string | null
  name: string
  role: 'owner' | 'co-owner' | 'entity' | string | null
  is_decision_maker: boolean | null
  priority: number | null
  phones?: Phone[]
  emails?: Email[]
}

export interface Property {
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
  list_date: string | null
  dom: number | null
  status: string | null
  source: string | null
  created_at: string
  updated_at: string
}

export interface LeadWithContacts extends Property {
  contacts: Contact[]
}

export interface LeadsStats {
  totalLeads: number
  callablePhones: number
  totalEmails: number
  newLeads: number
}

export type SortField = 'price' | 'dom' | 'city' | 'created_at' | 'beds'
export type SortDirection = 'asc' | 'desc'

export interface LeadsFilters {
  cities: string[]
  minPrice: number | null
  maxPrice: number | null
  minBeds: number | null
  maxBeds: number | null
  minBaths: number | null
  hasCallable: boolean
  hasEmail: boolean
  search: string
}
