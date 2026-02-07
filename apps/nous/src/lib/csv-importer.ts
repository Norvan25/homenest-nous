/**
 * CSV Importer
 * 
 * Handles batched inserts of parsed Vortex CSV data into Supabase.
 * Properties → Contacts → Phones + Emails (linked by returned IDs)
 */

import { supabase } from '@/lib/supabase'
import { parseVortexRow, type ParsedRow } from './vortex-parser'
import { v4 as uuidv4 } from 'uuid'

const BATCH_SIZE = 50

export interface ImportProgress {
  phase: 'checking' | 'clearing' | 'importing' | 'done' | 'error'
  current: number
  total: number
  propertiesImported: number
  contactsCreated: number
  phonesCreated: number
  emailsCreated: number
  duplicatesSkipped: number
  errors: number
  errorMessages: string[]
}

export interface ImportResult {
  success: boolean
  propertiesImported: number
  contactsCreated: number
  phonesCreated: number
  emailsCreated: number
  callablePhones: number
  dncPhones: number
  duplicatesSkipped: number
  errors: number
  errorMessages: string[]
  batchId: string
}

type ProgressCallback = (progress: ImportProgress) => void

/**
 * Import parsed CSV rows into Supabase
 */
export async function importCSVData(
  csvRows: Record<string, string>[],
  mode: 'append' | 'replace',
  onProgress: ProgressCallback
): Promise<ImportResult> {
  const batchId = uuidv4()
  const progress: ImportProgress = {
    phase: 'checking',
    current: 0,
    total: csvRows.length,
    propertiesImported: 0,
    contactsCreated: 0,
    phonesCreated: 0,
    emailsCreated: 0,
    duplicatesSkipped: 0,
    errors: 0,
    errorMessages: [],
  }

  onProgress({ ...progress })

  // Step 1: If replace mode, clear all data first
  if (mode === 'replace') {
    progress.phase = 'clearing'
    onProgress({ ...progress })

    try {
      // Delete all data in correct order (children first)
      await supabase.from('email_queue').delete().gte('id', '00000000-0000-0000-0000-000000000000')
      const { data: crmIds } = await supabase.from('crm_leads').select('id')
      if (crmIds && crmIds.length > 0) {
        await supabase.from('crm_activities').delete().in('crm_lead_id', crmIds.map(c => c.id))
      }
      await supabase.from('crm_leads').delete().gte('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('call_log').delete().gte('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('emails').delete().gte('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('phones').delete().gte('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('contacts').delete().gte('id', '00000000-0000-0000-0000-000000000000')
      const { error } = await supabase.from('properties').delete().gte('id', '00000000-0000-0000-0000-000000000000')
      if (error) throw error
    } catch (err: any) {
      progress.phase = 'error'
      progress.errorMessages.push(`Failed to clear data: ${err.message}`)
      onProgress({ ...progress })
      return buildResult(progress, batchId)
    }
  }

  // Step 2: Parse all rows
  progress.phase = 'importing'
  onProgress({ ...progress })

  const parsedRows: ParsedRow[] = []
  for (const row of csvRows) {
    const parsed = parseVortexRow(row, batchId)
    if (parsed) {
      parsedRows.push(parsed)
    }
  }

  // Step 3: If append mode, get existing vortex IDs for dedup
  let existingVortexIds = new Set<string>()
  if (mode === 'append') {
    progress.phase = 'checking'
    onProgress({ ...progress })

    const { data: existing } = await supabase
      .from('properties')
      .select('vortex_id')
      .not('vortex_id', 'is', null)

    if (existing) {
      existingVortexIds = new Set(existing.map(p => p.vortex_id).filter(Boolean))
    }
  }

  // Step 4: Filter out duplicates (append mode)
  const rowsToImport: ParsedRow[] = []
  for (const row of parsedRows) {
    if (mode === 'append' && existingVortexIds.has(row.property.vortex_id)) {
      progress.duplicatesSkipped++
    } else {
      rowsToImport.push(row)
    }
  }

  progress.total = rowsToImport.length
  progress.phase = 'importing'
  onProgress({ ...progress })

  // Step 5: Batch insert
  let callablePhones = 0
  let dncPhones = 0

  for (let i = 0; i < rowsToImport.length; i += BATCH_SIZE) {
    const batch = rowsToImport.slice(i, i + BATCH_SIZE)

    try {
      // Insert properties batch
      const propertyInserts = batch.map(r => ({
        vortex_id: r.property.vortex_id,
        lead_status: r.property.lead_status,
        listing_status: r.property.listing_status,
        street_address: r.property.street_address,
        city: r.property.city,
        state: r.property.state,
        zip: r.property.zip,
        price: r.property.price,
        dom: r.property.dom,
        beds: r.property.beds,
        baths: r.property.baths,
        property_type: r.property.property_type,
        sqft: r.property.sqft,
        year_built: r.property.year_built,
        lot_size: r.property.lot_size,
        list_date: r.property.list_date,
        expired_date: r.property.expired_date,
        withdrawn_date: r.property.withdrawn_date,
        auctioned_date: r.property.auctioned_date,
        lead_date: r.property.lead_date,
        status_date: r.property.status_date,
        listing_agent: r.property.listing_agent,
        listing_broker: r.property.listing_broker,
        mls_id: r.property.mls_id,
        listing_id: r.property.mls_id,
        remarks: r.property.remarks,
        agent_remarks: r.property.agent_remarks,
        area: r.property.area,
        house_number: r.property.house_number,
        subdivision: r.property.subdivision,
        zoning: r.property.zoning,
        tax_id: r.property.tax_id,
        agent_phone: r.property.agent_phone,
        last_sold_date: r.property.last_sold_date,
        address_normalized: r.property.address_normalized,
        insights: r.property.insights,
        import_source: r.property.import_source,
        import_date: r.property.import_date,
        import_batch_id: r.property.import_batch_id,
        status: r.property.status,
      }))

      let insertedProps: { id: string; vortex_id: string }[] | null = null

      // Try batch insert first
      const { data: batchResult, error: propError } = await supabase
        .from('properties')
        .insert(propertyInserts)
        .select('id, vortex_id')

      if (propError) {
        // Batch failed — retry each row individually to salvage what we can
        console.warn('Batch insert failed, retrying individually:', propError.message)
        insertedProps = []
        for (let j = 0; j < propertyInserts.length; j++) {
          const { data: singleResult, error: singleError } = await supabase
            .from('properties')
            .insert(propertyInserts[j])
            .select('id, vortex_id')
          if (singleError) {
            progress.errors++
            if (progress.errorMessages.length < 5) {
              progress.errorMessages.push(`Row "${propertyInserts[j].street_address}": ${singleError.message}`)
            }
          } else if (singleResult?.[0]) {
            insertedProps.push(singleResult[0])
          }
        }
        if (insertedProps.length === 0) {
          progress.current += batch.length
          onProgress({ ...progress })
          continue
        }
      } else {
        insertedProps = batchResult
      }

      if (!insertedProps || insertedProps.length === 0) {
        progress.errors += batch.length
        progress.current += batch.length
        onProgress({ ...progress })
        continue
      }

      progress.propertiesImported += insertedProps.length

      // Map vortex_id → property_id
      const propIdMap = new Map<string, string>()
      for (const p of insertedProps) {
        if (p.vortex_id) propIdMap.set(p.vortex_id, p.id)
      }

      // Collect contacts for this batch
      const contactInserts: any[] = []
      for (const row of batch) {
        const propertyId = propIdMap.get(row.property.vortex_id)
        if (!propertyId) continue

        for (const contact of row.contacts) {
          contactInserts.push({
            property_id: propertyId,
            name: contact.name,
            first_name: contact.first_name,
            last_name: contact.last_name,
            role: contact.role,
            is_decision_maker: contact.is_decision_maker,
            priority: contact.priority,
            mailing_street: contact.mailing_street,
            mailing_city: contact.mailing_city,
            mailing_state: contact.mailing_state,
            mailing_zip: contact.mailing_zip,
            is_absentee_owner: contact.is_absentee_owner,
            _vortex_id: contact._vortex_id,
          })
        }
      }

      // Insert contacts
      let contactIdMap = new Map<string, string>() // vortex_id → primary contact_id
      if (contactInserts.length > 0) {
        // Strip _vortex_id before insert (not a real column)
        const cleanedContacts = contactInserts.map(c => {
          const { _vortex_id, ...rest } = c
          return rest
        })

        const { data: insertedContacts, error: contactError } = await supabase
          .from('contacts')
          .insert(cleanedContacts)
          .select('id, property_id, is_decision_maker')

        if (!contactError && insertedContacts) {
          progress.contactsCreated += insertedContacts.length

          // Map property_id → primary contact_id (decision maker)
          for (const c of insertedContacts) {
            if (c.is_decision_maker && c.property_id) {
              // Reverse lookup: property_id → vortex_id → contactIdMap
              for (const [vid, pid] of propIdMap.entries()) {
                if (pid === c.property_id) {
                  contactIdMap.set(vid, c.id)
                  break
                }
              }
            }
          }
        }
      }

      // Collect phones for this batch
      const phoneInserts: any[] = []
      for (const row of batch) {
        const contactId = contactIdMap.get(row.property.vortex_id)
        if (!contactId) continue

        for (const phone of row.phones) {
          phoneInserts.push({
            contact_id: contactId,
            number: phone.number,
            number_normalized: phone.number_normalized,
            is_dnc: phone.is_dnc,
            type: phone.type,
          })
          if (phone.is_dnc) dncPhones++
          else callablePhones++
        }
      }

      if (phoneInserts.length > 0) {
        const { data: insertedPhones, error: phoneError } = await supabase
          .from('phones')
          .insert(phoneInserts)
          .select('id')

        if (!phoneError && insertedPhones) {
          progress.phonesCreated += insertedPhones.length
        }
      }

      // Collect emails for this batch
      const emailInserts: any[] = []
      for (const row of batch) {
        const contactId = contactIdMap.get(row.property.vortex_id)
        if (!contactId) continue

        for (const email of row.emails) {
          emailInserts.push({
            contact_id: contactId,
            email: email.email,
          })
        }
      }

      if (emailInserts.length > 0) {
        const { data: insertedEmails, error: emailError } = await supabase
          .from('emails')
          .insert(emailInserts)
          .select('id')

        if (!emailError && insertedEmails) {
          progress.emailsCreated += insertedEmails.length
        }
      }
    } catch (err: any) {
      progress.errors += batch.length
      progress.errorMessages.push(err.message || 'Unknown error')
    }

    progress.current += batch.length
    onProgress({ ...progress })
  }

  // Step 6: Log import
  await supabase.from('import_log').insert({
    source: 'csv_vortex',
    filename: `vortex_batch_${batchId}`,
    total_records: csvRows.length,
    imported: progress.propertiesImported,
    duplicates: progress.duplicatesSkipped,
    errors: progress.errors,
  })

  progress.phase = 'done'
  onProgress({ ...progress })

  return {
    success: progress.errors === 0,
    propertiesImported: progress.propertiesImported,
    contactsCreated: progress.contactsCreated,
    phonesCreated: progress.phonesCreated,
    emailsCreated: progress.emailsCreated,
    callablePhones,
    dncPhones,
    duplicatesSkipped: progress.duplicatesSkipped,
    errors: progress.errors,
    errorMessages: progress.errorMessages,
    batchId,
  }
}

function buildResult(progress: ImportProgress, batchId: string): ImportResult {
  return {
    success: false,
    propertiesImported: progress.propertiesImported,
    contactsCreated: progress.contactsCreated,
    phonesCreated: progress.phonesCreated,
    emailsCreated: progress.emailsCreated,
    callablePhones: 0,
    dncPhones: 0,
    duplicatesSkipped: progress.duplicatesSkipped,
    errors: progress.errors,
    errorMessages: progress.errorMessages,
    batchId,
  }
}
