/**
 * Vortex CSV Parser
 * 
 * Transforms Vortex/REDX CSV export data into normalized database records
 * for properties, contacts, phones, and emails.
 */

// ─── Column Mappings ──────────────────────────────────────────────

const phoneColumns = [
  { phone: 'Phone', status: 'Phone Status' },
  { phone: 'Phone 2', status: 'Phone 2 Status' },
  { phone: 'Phone 3', status: 'Phone 3 Status' },
  { phone: 'Phone 4', status: 'Phone 4 Status' },
  { phone: 'Phone 5', status: 'Phone 5 Status' },
  { phone: 'Phone 6', status: 'Phone 6 Status' },
  { phone: 'Phone 7', status: 'Phone 7 Status' },
  { phone: 'Phone 8', status: 'Phone 8 Status' },
  { phone: 'Phone 9', status: 'Phone 9 Status' },
  { phone: 'Phone 10', status: null },
  { phone: 'Phone 11', status: 'Phone 11 Status' },
  { phone: 'Phone 12', status: null },
  { phone: 'Phone 13', status: 'Phone 13 Status' },
  { phone: 'Phone 14', status: null },
  { phone: 'Phone 15', status: null },
]

const nameColumns = [
  'Name', 'Name 2', 'Name 3', 'Name 4', 'Name 5',
  'Name 6', 'Name 7', 'Name 8', 'Name 9', 'Name 10', 'Name 11',
]

const mlsNameColumns = [
  'MLS Name', 'MLS Name 2', 'MLS Name 3', 'MLS Name 4',
]

const emailColumns = [
  'Email', 'Email 2', 'Email 3', 'Email 4', 'Email 5', 'Email 6',
  'Email 7', 'Email 8', 'Email 9', 'Email 10', 'Email 11', 'Email 12',
]

// ─── Types ──────────────────────────────────────────────────────

export interface ParsedProperty {
  vortex_id: string
  lead_status: string | null
  listing_status: string | null
  street_address: string
  city: string
  state: string
  zip: string | null
  price: number | null
  dom: number | null
  beds: number | null
  baths: number | null
  property_type: string | null
  sqft: number | null
  year_built: number | null
  lot_size: number | null
  list_date: string | null
  expired_date: string | null
  withdrawn_date: string | null
  auctioned_date: string | null
  lead_date: string | null
  status_date: string | null
  listing_agent: string | null
  listing_broker: string | null
  mls_id: string | null
  remarks: string | null
  agent_remarks: string | null
  area: string | null
  house_number: string | null
  subdivision: string | null
  zoning: string | null
  tax_id: string | null
  agent_phone: string | null
  last_sold_date: string | null
  address_normalized: string
  insights: Record<string, string>
  import_source: string
  import_date: string
  import_batch_id: string
  status: string
}

export interface ParsedContact {
  name: string
  first_name: string | null
  last_name: string | null
  role: string
  is_decision_maker: boolean
  priority: number
  mailing_street: string | null
  mailing_city: string | null
  mailing_state: string | null
  mailing_zip: string | null
  is_absentee_owner: boolean
  _vortex_id: string // for linking
}

export interface ParsedPhone {
  number: string
  number_normalized: string
  is_dnc: boolean
  type: string
  _vortex_id: string // for linking
}

export interface ParsedEmail {
  email: string
  _vortex_id: string // for linking
}

export interface ParsedRow {
  property: ParsedProperty
  contacts: ParsedContact[]
  phones: ParsedPhone[]
  emails: ParsedEmail[]
}

export interface ParsePreview {
  totalRows: number
  cities: Record<string, number>
  totalPhones: number
  callablePhones: number
  dncPhones: number
  totalEmails: number
  totalContacts: number
  priceRange: { min: number; max: number }
  sampleAddresses: string[]
}

// ─── Helpers ──────────────────────────────────────────────────────

function parseVortexDate(dateStr: string | undefined): string | null {
  if (!dateStr?.trim()) return null
  const parts = dateStr.trim().split('-')
  if (parts.length !== 3) return null
  const [month, day, year] = parts
  if (!month || !day || !year || year.length !== 4) return null
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

function parseInteger(val: string | undefined): number | null {
  if (!val?.trim()) return null
  const num = parseInt(val.replace(/[^0-9-]/g, ''), 10)
  return isNaN(num) ? null : num
}

function parseDecimal(val: string | undefined): number | null {
  if (!val?.trim()) return null
  const num = parseFloat(val.replace(/[^0-9.-]/g, ''))
  return isNaN(num) ? null : num
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, '')
}

function trimOrNull(val: string | undefined): string | null {
  const trimmed = val?.trim()
  if (!trimmed) return null
  return sanitizeText(trimmed)
}

/**
 * Sanitize text to prevent PostgreSQL "unsupported Unicode escape sequence" errors.
 * 
 * Handles three sources of the problem:
 * 1. Literal backslash-u sequences in CSV text (e.g. \u0026)
 * 2. Actual control characters (null bytes etc.) that JSON.stringify encodes as \u0000
 * 3. Any remaining backslashes that could form escape sequences
 */
function sanitizeText(text: string): string {
  return text
    // 1. Remove all control characters (U+0000 to U+001F) — these cause \u0000 etc. in JSON
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x1F\x7F]/g, '')
    // 2. Replace literal \uXXXX escape sequences with actual characters
    .replace(/\\u([0-9a-fA-F]{4})/g, (match, hex) => {
      const code = parseInt(hex, 16)
      if (code === 0) return '' // Don't allow null byte
      try { return String.fromCharCode(code) } catch { return '' }
    })
    // 3. Replace literal \UXXXXXXXX sequences
    .replace(/\\U([0-9a-fA-F]{8})/g, '')
    // 4. Replace all remaining backslashes to prevent any escape interpretation
    .replace(/\\/g, '/')
}

// ─── Main Parser ──────────────────────────────────────────────────

export function parseVortexRow(
  row: Record<string, string>,
  batchId: string
): ParsedRow | null {
  // Require at minimum a property address
  const streetAddress = trimOrNull(row['Property Address'])
  const city = trimOrNull(row['Property City'])
  if (!streetAddress || !city) return null

  const state = trimOrNull(row['Property State']) || 'CA'
  const zip = trimOrNull(row['Property Zip'])
  const vortexId = trimOrNull(row['Vortex ID']) || `gen_${streetAddress}_${city}`.replace(/\s+/g, '_')

  // Normalize address
  const addressNormalized = `${streetAddress}, ${city}, ${state} ${zip || ''}`.toLowerCase().trim()

  // Parse insights (columns starting with "Insights - ")
  const insights: Record<string, string> = {}
  for (const [key, value] of Object.entries(row)) {
    if (key.startsWith('Insights - ') && value?.trim()) {
      insights[key.replace('Insights - ', '')] = sanitizeText(value.trim())
    }
  }

  // Build property
  const property: ParsedProperty = {
    vortex_id: vortexId,
    lead_status: trimOrNull(row['Lead Status']),
    listing_status: trimOrNull(row['Listing Status']),
    street_address: streetAddress,
    city,
    state,
    zip,
    price: parseInteger(row['List Price']),
    dom: parseInteger(row['Days On Market']),
    beds: parseInteger(row['Bedrooms']),
    baths: parseDecimal(row['Bathrooms']),
    property_type: trimOrNull(row['Type']),
    sqft: parseInteger(row['Square Footage']),
    year_built: parseInteger(row['Year Built']),
    lot_size: parseDecimal(row['Lot Size']),
    list_date: parseVortexDate(row['List Date']),
    expired_date: parseVortexDate(row['Expired Date']),
    withdrawn_date: parseVortexDate(row['Withdrawn Date']),
    auctioned_date: parseVortexDate(row['Auctioned Date']),
    lead_date: parseVortexDate(row['Lead Date']),
    status_date: parseVortexDate(row['Status Date']),
    listing_agent: trimOrNull(row['Listing Agent']),
    listing_broker: trimOrNull(row['Listing Broker']),
    mls_id: trimOrNull(row['MLS/FSBO ID']),
    remarks: trimOrNull(row['Remarks']),
    agent_remarks: trimOrNull(row['Agent Remarks']),
    area: trimOrNull(row['Area']),
    house_number: trimOrNull(row['House Number']),
    subdivision: trimOrNull(row['Subdivision']),
    zoning: trimOrNull(row['Zoning']),
    tax_id: trimOrNull(row['Tax ID']),
    agent_phone: trimOrNull(row['Agent Phone']),
    last_sold_date: parseVortexDate(row['Last Sold Date']),
    address_normalized: addressNormalized,
    insights,
    import_source: 'csv_vortex',
    import_date: new Date().toISOString(),
    import_batch_id: batchId,
    status: trimOrNull(row['Listing Status']) || 'Expired',
  }

  // Parse contacts
  const contacts: ParsedContact[] = []
  let contactPriority = 1

  // Owner names (Name, Name 2 ... Name 11)
  for (const col of nameColumns) {
    const name = trimOrNull(row[col])
    if (name) {
      const isFirst = col === 'Name'
      const mailingStreet = isFirst ? trimOrNull(row['Mailing Street']) : null
      const isAbsentee = isFirst && mailingStreet
        ? mailingStreet.toLowerCase() !== streetAddress.toLowerCase()
        : false

      contacts.push({
        name,
        first_name: isFirst ? trimOrNull(row['First Name']) : null,
        last_name: isFirst ? trimOrNull(row['Last Name']) : null,
        role: 'owner',
        is_decision_maker: isFirst,
        priority: contactPriority++,
        mailing_street: isFirst ? mailingStreet : null,
        mailing_city: isFirst ? trimOrNull(row['Mailing City']) : null,
        mailing_state: isFirst ? trimOrNull(row['Mailing State']) : null,
        mailing_zip: isFirst ? trimOrNull(row['Mailing Zip']) : null,
        is_absentee_owner: isAbsentee,
        _vortex_id: vortexId,
      })
    }
  }

  // MLS contacts (MLS Name ... MLS Name 4)
  for (const col of mlsNameColumns) {
    const name = trimOrNull(row[col])
    if (name) {
      contacts.push({
        name,
        first_name: null,
        last_name: null,
        role: 'mls_contact',
        is_decision_maker: false,
        priority: contactPriority++,
        mailing_street: null,
        mailing_city: null,
        mailing_state: null,
        mailing_zip: null,
        is_absentee_owner: false,
        _vortex_id: vortexId,
      })
    }
  }

  // Parse phones
  const phones: ParsedPhone[] = []
  for (const pc of phoneColumns) {
    const phoneVal = trimOrNull(row[pc.phone])
    if (phoneVal) {
      const normalized = normalizePhone(phoneVal)
      if (normalized.length >= 7) {
        const statusVal = pc.status ? trimOrNull(row[pc.status]) : null
        phones.push({
          number: phoneVal,
          number_normalized: normalized,
          is_dnc: statusVal?.toUpperCase() === 'DNC',
          type: 'unknown',
          _vortex_id: vortexId,
        })
      }
    }
  }

  // Parse emails
  const emails: ParsedEmail[] = []
  for (const col of emailColumns) {
    const emailVal = trimOrNull(row[col])
    if (emailVal && emailVal.includes('@')) {
      emails.push({
        email: emailVal.toLowerCase().trim(),
        _vortex_id: vortexId,
      })
    }
  }

  return { property, contacts, phones, emails }
}

// ─── Preview Generator ──────────────────────────────────────────

export function generatePreview(rows: Record<string, string>[]): ParsePreview {
  const cities: Record<string, number> = {}
  let totalPhones = 0
  let callablePhones = 0
  let dncPhones = 0
  let totalEmails = 0
  let totalContacts = 0
  let minPrice = Infinity
  let maxPrice = -Infinity
  const sampleAddresses: string[] = []

  for (const row of rows) {
    // Cities
    const city = row['Property City']?.trim()
    if (city) {
      cities[city] = (cities[city] || 0) + 1
    }

    // Sample addresses
    if (sampleAddresses.length < 5) {
      const addr = row['Property Address']?.trim()
      if (addr) sampleAddresses.push(`${addr}, ${city || ''}`)
    }

    // Price range
    const price = parseInteger(row['List Price'])
    if (price !== null && price > 0) {
      if (price < minPrice) minPrice = price
      if (price > maxPrice) maxPrice = price
    }

    // Phones
    for (const pc of phoneColumns) {
      const phoneVal = row[pc.phone]?.trim()
      if (phoneVal && normalizePhone(phoneVal).length >= 7) {
        totalPhones++
        const statusVal = pc.status ? row[pc.status]?.trim() : null
        if (statusVal?.toUpperCase() === 'DNC') {
          dncPhones++
        } else {
          callablePhones++
        }
      }
    }

    // Emails
    for (const col of emailColumns) {
      const emailVal = row[col]?.trim()
      if (emailVal && emailVal.includes('@')) {
        totalEmails++
      }
    }

    // Contacts
    for (const col of nameColumns) {
      if (row[col]?.trim()) totalContacts++
    }
    for (const col of mlsNameColumns) {
      if (row[col]?.trim()) totalContacts++
    }
  }

  return {
    totalRows: rows.length,
    cities,
    totalPhones,
    callablePhones,
    dncPhones,
    totalEmails,
    totalContacts,
    priceRange: {
      min: minPrice === Infinity ? 0 : minPrice,
      max: maxPrice === -Infinity ? 0 : maxPrice,
    },
    sampleAddresses,
  }
}
