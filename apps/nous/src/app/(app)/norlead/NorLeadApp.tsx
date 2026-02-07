'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  Users, 
  ShoppingCart,
  Home,
  FileX,
  AlertTriangle,
  Building2,
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  MapPin,
  DollarSign,
  Clock,
  User,
  Star,
  Send,
  Filter,
  CheckSquare,
  Square,
  Loader2,
  Trash2,
  Ban,
  Upload
} from 'lucide-react'
import { PropertyCard } from './PropertyCard'
import { FilterDropdown } from './FilterDropdown'
import { Modal, ConfirmDialog } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { CSVUploadModal } from '@/components/csv-upload'

// Types
interface Phone {
  id: string
  number: string
  type: string | null
  is_dnc: boolean | null
  is_verified: boolean | null
}

interface Email {
  id: string
  email: string
  is_verified: boolean | null
}

interface Contact {
  id: string
  name: string
  role: string | null
  is_decision_maker: boolean | null
  phones?: Phone[]
  emails?: Email[]
}

interface Property {
  id: string
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
  status: string | null
  source: string | null
  contacts?: Contact[]
}

interface FilterOption {
  value: string
  label: string
  count: number
}

interface FilterOptions {
  cities: FilterOption[]
  zips: FilterOption[]
  statuses: FilterOption[]
  priceRange: { min: number; max: number }
  bedsCounts: Record<number, number>
}

interface Stats {
  totalLeads: number
  callablePhones: number
  totalEmails: number
  totalContacts: number
}

interface Props {
  initialLeads: Property[]
  filterOptions: FilterOptions
  stats: Stats
}

// Seller categories
const sellerCategories = [
  { id: 'expired', label: 'Expired Listings', icon: FileX, active: true },
  { id: 'preforeclosure', label: 'Pre-Foreclosure', icon: AlertTriangle, active: false },
  { id: 'fsbo', label: 'FSBO', icon: Home, active: false },
  { id: 'absentee', label: 'Absentee Owner', icon: Building2, active: false },
]

// Price range presets
const priceRanges = [
  { label: 'Any', min: 0, max: Infinity },
  { label: 'Under $500K', min: 0, max: 500000 },
  { label: '$500K - $1M', min: 500000, max: 1000000 },
  { label: '$1M - $2M', min: 1000000, max: 2000000 },
  { label: '$2M - $5M', min: 2000000, max: 5000000 },
  { label: '$5M+', min: 5000000, max: Infinity },
]

// Beds presets
const bedsOptions = [
  { label: 'Any', value: 0 },
  { label: '1+', value: 1 },
  { label: '2+', value: 2 },
  { label: '3+', value: 3 },
  { label: '4+', value: 4 },
  { label: '5+', value: 5 },
]

// Expired date presets (days since expired)
const expiredDateOptions = [
  { label: 'Any Time', minDays: -Infinity, maxDays: Infinity },
  { label: 'Today', minDays: 0, maxDays: 0 },
  { label: 'Last 7 Days', minDays: 0, maxDays: 7 },
  { label: 'Last 14 Days', minDays: 0, maxDays: 14 },
  { label: 'Last 30 Days', minDays: 0, maxDays: 30 },
  { label: '30-60 Days', minDays: 30, maxDays: 60 },
  { label: '60-90 Days', minDays: 60, maxDays: 90 },
  { label: '90+ Days', minDays: 90, maxDays: Infinity },
]

// Status options for property
const propertyStatusOptions = ['Expired', 'Pre-Foreclosure', 'FSBO', 'Absentee']

// Role options for contacts
const roleOptions = ['owner', 'co-owner', 'family', 'tenant', 'other']

// Phone type options
const phoneTypeOptions = ['cell', 'landline', 'voip', 'unknown']

export default function NorLeadApp({ initialLeads, filterOptions, stats }: Props) {
  const router = useRouter()
  const { showToast } = useToast()
  
  // Leads state (mutable for CRUD operations)
  const [leads, setLeads] = useState<Property[]>(initialLeads)
  
  // Main section state
  const [activeSection, setActiveSection] = useState<'sellers' | 'buyers'>('sellers')
  const [activeCategory, setActiveCategory] = useState('expired')
  
  // Transfer state
  const [isTransferring, setIsTransferring] = useState(false)
  const [transferResult, setTransferResult] = useState<{ success: number; existing: number } | null>(null)

  // Filter state
  const [selectedCities, setSelectedCities] = useState<string[]>([])
  const [selectedZips, setSelectedZips] = useState<string[]>([])
  const [selectedPriceRange, setSelectedPriceRange] = useState(priceRanges[0])
  const [selectedBeds, setSelectedBeds] = useState(bedsOptions[0])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [selectedExpiredDate, setSelectedExpiredDate] = useState(expiredDateOptions[0])
  const [contactFilter, setContactFilter] = useState<'all' | 'hasPhone' | 'hasEmail' | 'hasBoth'>('all')

  // Selection state
  const [selectedPhones, setSelectedPhones] = useState<Set<string>>(new Set())
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set())
  const [expandedLeads, setExpandedLeads] = useState<Set<string>>(new Set())

  // Modal states
  const [editPropertyModal, setEditPropertyModal] = useState<Property | null>(null)
  const [deletePropertyConfirm, setDeletePropertyConfirm] = useState<Property | null>(null)
  const [addContactModal, setAddContactModal] = useState<Property | null>(null)
  const [editContactModal, setEditContactModal] = useState<{ contact: Contact; propertyId: string } | null>(null)
  const [deleteContactConfirm, setDeleteContactConfirm] = useState<{ contact: Contact; propertyId: string } | null>(null)
  const [addPhoneModal, setAddPhoneModal] = useState<string | null>(null) // contactId
  const [addEmailModal, setAddEmailModal] = useState<string | null>(null) // contactId
  const [editPhoneModal, setEditPhoneModal] = useState<Phone | null>(null)
  const [deletePhoneConfirm, setDeletePhoneConfirm] = useState<Phone | null>(null)
  const [markDNCConfirm, setMarkDNCConfirm] = useState<Phone | null>(null)
  const [editEmailModal, setEditEmailModal] = useState<Email | null>(null)
  const [deleteEmailConfirm, setDeleteEmailConfirm] = useState<Email | null>(null)
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false)
  const [bulkDNCConfirm, setBulkDNCConfirm] = useState(false)

  // CSV Upload + Delete All
  const [showCSVUpload, setShowCSVUpload] = useState(false)
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false)
  const [deleteAllText, setDeleteAllText] = useState('')
  const [isDeletingAll, setIsDeletingAll] = useState(false)

  // Form states
  const [propertyForm, setPropertyForm] = useState({
    street_address: '',
    city: '',
    state: '',
    zip: '',
    price: '',
    beds: '',
    baths: '',
    sqft: '',
    year_built: '',
    status: ''
  })
  const [contactForm, setContactForm] = useState({
    name: '',
    role: '',
    is_decision_maker: false
  })
  const [phoneForm, setPhoneForm] = useState({
    number: '',
    type: 'cell',
    is_dnc: false
  })
  const [emailForm, setEmailForm] = useState({
    email: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filter leads
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // City filter
      if (selectedCities.length > 0 && !selectedCities.includes(lead.city)) {
        return false
      }

      // Zip filter
      if (selectedZips.length > 0 && (!lead.zip || !selectedZips.includes(lead.zip))) {
        return false
      }

      // Price filter
      if (lead.price) {
        if (lead.price < selectedPriceRange.min) return false
        if (selectedPriceRange.max !== Infinity && lead.price > selectedPriceRange.max) return false
      }

      // Beds filter
      if (selectedBeds.value > 0 && (!lead.beds || lead.beds < selectedBeds.value)) {
        return false
      }

      // Status filter
      if (selectedStatuses.length > 0 && (!lead.status || !selectedStatuses.includes(lead.status))) {
        return false
      }

      // Expired date filter
      if (selectedExpiredDate !== expiredDateOptions[0] && lead.list_date) {
        const listDate = new Date(lead.list_date)
        const dom = lead.dom || 0
        const expiredDate = new Date(listDate)
        expiredDate.setDate(expiredDate.getDate() + dom)
        
        const today = new Date()
        const daysSinceExpired = Math.floor((today.getTime() - expiredDate.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysSinceExpired < selectedExpiredDate.minDays || daysSinceExpired > selectedExpiredDate.maxDays) {
          return false
        }
      }

      // Contact filter
      if (contactFilter !== 'all') {
        const hasPhone = lead.contacts?.some(c => c.phones?.some(p => !p.is_dnc))
        const hasEmail = lead.contacts?.some(c => c.emails && c.emails.length > 0)
        
        if (contactFilter === 'hasPhone' && !hasPhone) return false
        if (contactFilter === 'hasEmail' && !hasEmail) return false
        if (contactFilter === 'hasBoth' && (!hasPhone || !hasEmail)) return false
      }

      return true
    })
  }, [leads, selectedCities, selectedZips, selectedPriceRange, selectedBeds, selectedStatuses, contactFilter, selectedExpiredDate])

  // Count callable phones and emails in filtered leads
  const filteredStats = useMemo(() => {
    let phones = 0
    let callablePhones = 0
    let emails = 0
    let contacts = 0

    filteredLeads.forEach(lead => {
      lead.contacts?.forEach(contact => {
        contacts++
        contact.phones?.forEach(phone => {
          phones++
          if (!phone.is_dnc) callablePhones++
        })
        emails += contact.emails?.length || 0
      })
    })

    return { phones, callablePhones, emails, contacts }
  }, [filteredLeads])

  // Get selected property IDs (properties that have selected phones or emails)
  const selectedPropertyIds = useMemo(() => {
    const ids = new Set<string>()
    leads.forEach(lead => {
      lead.contacts?.forEach(contact => {
        const hasSelectedPhone = contact.phones?.some(p => selectedPhones.has(p.id))
        const hasSelectedEmail = contact.emails?.some(e => selectedEmails.has(e.id))
        if (hasSelectedPhone || hasSelectedEmail) {
          ids.add(lead.id)
        }
      })
    })
    return ids
  }, [leads, selectedPhones, selectedEmails])

  // Toggle functions
  const toggleCity = (city: string) => {
    setSelectedCities(prev => 
      prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]
    )
  }

  const toggleZip = (zip: string) => {
    setSelectedZips(prev => 
      prev.includes(zip) ? prev.filter(z => z !== zip) : [...prev, zip]
    )
  }

  const toggleStatus = (status: string) => {
    setSelectedStatuses(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    )
  }

  const toggleLead = (leadId: string) => {
    setExpandedLeads(prev => {
      const newSet = new Set(prev)
      if (newSet.has(leadId)) {
        newSet.delete(leadId)
      } else {
        newSet.add(leadId)
      }
      return newSet
    })
  }

  const togglePhone = (phoneId: string) => {
    setSelectedPhones(prev => {
      const newSet = new Set(prev)
      if (newSet.has(phoneId)) {
        newSet.delete(phoneId)
      } else {
        newSet.add(phoneId)
      }
      return newSet
    })
  }

  const toggleEmail = (emailId: string) => {
    setSelectedEmails(prev => {
      const newSet = new Set(prev)
      if (newSet.has(emailId)) {
        newSet.delete(emailId)
      } else {
        newSet.add(emailId)
      }
      return newSet
    })
  }

  const selectAllPhonesInLead = (lead: Property) => {
    const phoneIds = lead.contacts?.flatMap(c => 
      c.phones?.filter(p => !p.is_dnc).map(p => p.id) || []
    ) || []
    setSelectedPhones(prev => {
      const newSet = new Set(prev)
      phoneIds.forEach(id => newSet.add(id))
      return newSet
    })
  }

  const selectAllEmailsInLead = (lead: Property) => {
    const emailIds = lead.contacts?.flatMap(c => 
      c.emails?.map(e => e.id) || []
    ) || []
    setSelectedEmails(prev => {
      const newSet = new Set(prev)
      emailIds.forEach(id => newSet.add(id))
      return newSet
    })
  }

  const selectAllVisible = () => {
    const allPhoneIds: string[] = []
    const allEmailIds: string[] = []
    
    filteredLeads.forEach(lead => {
      lead.contacts?.forEach(contact => {
        contact.phones?.filter(p => !p.is_dnc).forEach(p => allPhoneIds.push(p.id))
        contact.emails?.forEach(e => allEmailIds.push(e.id))
      })
    })

    setSelectedPhones(new Set(allPhoneIds))
    setSelectedEmails(new Set(allEmailIds))
  }

  const clearSelection = () => {
    setSelectedPhones(new Set())
    setSelectedEmails(new Set())
  }

  const clearFilters = () => {
    setSelectedCities([])
    setSelectedZips([])
    setSelectedPriceRange(priceRanges[0])
    setSelectedBeds(bedsOptions[0])
    setSelectedStatuses([])
    setSelectedExpiredDate(expiredDateOptions[0])
    setContactFilter('all')
  }

  const goToCRM = () => {
    router.push('/norcrm')
  }

  const activeFiltersCount = [
    selectedCities.length > 0,
    selectedZips.length > 0,
    selectedPriceRange !== priceRanges[0],
    selectedBeds !== bedsOptions[0],
    selectedStatuses.length > 0,
    selectedExpiredDate !== expiredDateOptions[0],
    contactFilter !== 'all'
  ].filter(Boolean).length

  // Transfer to CRM
  const handleTransferToCRM = async () => {
    setIsTransferring(true)
    setTransferResult(null)

    try {
      const propertyIds = new Set<string>()
      
      console.log('=== TRANSFER TO CRM DEBUG ===')
      console.log('Selected phones:', Array.from(selectedPhones))
      console.log('Selected emails:', Array.from(selectedEmails))
      
      leads.forEach(lead => {
        lead.contacts?.forEach(contact => {
          const hasSelectedPhone = contact.phones?.some(p => selectedPhones.has(p.id))
          const hasSelectedEmail = contact.emails?.some(e => selectedEmails.has(e.id))
          
          if (hasSelectedPhone || hasSelectedEmail) {
            console.log('Adding property:', lead.id, lead.street_address)
            propertyIds.add(lead.id)
          }
        })
      })

      console.log('Property IDs to transfer:', Array.from(propertyIds))

      if (propertyIds.size === 0) {
        showToast('No properties selected. Please select some phones or emails first.', 'warning')
        setIsTransferring(false)
        return
      }

      // Check which property IDs already exist in crm_leads
      const { data: existingLeads, error: checkError } = await supabase
        .from('crm_leads')
        .select('property_id')
        .in('property_id', Array.from(propertyIds))

      if (checkError) {
        console.error('Error checking existing leads:', checkError)
        showToast('Error checking existing leads', 'error')
        setIsTransferring(false)
        return
      }

      console.log('Existing leads in CRM:', existingLeads)

      const existingPropertyIds = new Set(existingLeads?.map(l => l.property_id) || [])
      
      // Filter to only new property IDs
      const newPropertyIds = Array.from(propertyIds).filter(id => !existingPropertyIds.has(id))

      console.log('New property IDs to insert:', newPropertyIds)

      let successCount = 0

      // Insert new leads into crm_leads
      if (newPropertyIds.length > 0) {
        const leadsToInsert = newPropertyIds.map(property_id => ({
          property_id,
          status: 'new' as const,
          priority: 'normal' as const,
        }))

        console.log('Inserting leads:', leadsToInsert)

        const { data, error } = await supabase
          .from('crm_leads')
          .insert(leadsToInsert)
          .select()

        if (error) {
          console.error('Error inserting leads:', error)
          showToast('Error transferring leads: ' + error.message, 'error')
          setIsTransferring(false)
          return
        }

        console.log('Insert result:', data)
        successCount = data?.length || 0
      }

      console.log('Transfer complete - Success:', successCount, 'Existing:', existingPropertyIds.size)

      setTransferResult({
        success: successCount,
        existing: existingPropertyIds.size
      })

      clearSelection()
      showToast(successCount > 0 ? `${successCount} leads transferred to CRM` : 'All selected leads already in CRM', 'success')

    } catch (error) {
      console.error('Transfer error:', error)
      showToast('Error transferring leads. Please try again.', 'error')
    }

    setIsTransferring(false)
  }

  // ============ PROPERTY CRUD ============
  
  const openEditPropertyModal = (property: Property) => {
    setPropertyForm({
      street_address: property.street_address || '',
      city: property.city || '',
      state: property.state || '',
      zip: property.zip || '',
      price: property.price?.toString() || '',
      beds: property.beds?.toString() || '',
      baths: property.baths?.toString() || '',
      sqft: property.sqft?.toString() || '',
      year_built: property.year_built?.toString() || '',
      status: property.status || ''
    })
    setEditPropertyModal(property)
  }

  const handleUpdateProperty = async () => {
    if (!editPropertyModal) return
    setIsSubmitting(true)

    const { error } = await supabase
      .from('properties')
      .update({
        street_address: propertyForm.street_address,
        city: propertyForm.city,
        state: propertyForm.state || null,
        zip: propertyForm.zip || null,
        price: propertyForm.price ? parseFloat(propertyForm.price) : null,
        beds: propertyForm.beds ? parseInt(propertyForm.beds) : null,
        baths: propertyForm.baths ? parseFloat(propertyForm.baths) : null,
        sqft: propertyForm.sqft ? parseInt(propertyForm.sqft) : null,
        year_built: propertyForm.year_built ? parseInt(propertyForm.year_built) : null,
        status: propertyForm.status || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', editPropertyModal.id)

    setIsSubmitting(false)

    if (error) {
      showToast('Failed to update property: ' + error.message, 'error')
      return
    }

    // Update local state
    setLeads(prev => prev.map(l => 
      l.id === editPropertyModal.id 
        ? { 
            ...l, 
            street_address: propertyForm.street_address,
            city: propertyForm.city,
            state: propertyForm.state || null,
            zip: propertyForm.zip || null,
            price: propertyForm.price ? parseFloat(propertyForm.price) : null,
            beds: propertyForm.beds ? parseInt(propertyForm.beds) : null,
            baths: propertyForm.baths ? parseFloat(propertyForm.baths) : null,
            sqft: propertyForm.sqft ? parseInt(propertyForm.sqft) : null,
            year_built: propertyForm.year_built ? parseInt(propertyForm.year_built) : null,
            status: propertyForm.status || null
          }
        : l
    ))

    showToast('Property updated', 'success')
    setEditPropertyModal(null)
  }

  const handleDeleteProperty = async () => {
    if (!deletePropertyConfirm) return
    setIsSubmitting(true)

    const propId = deletePropertyConfirm.id

    try {
      // Get contact IDs for this property
      const { data: contacts } = await supabase
        .from('contacts')
        .select('id')
        .eq('property_id', propId)
      const contactIds = contacts?.map(c => c.id) || []

      // Delete children first
      if (contactIds.length > 0) {
        await supabase.from('emails').delete().in('contact_id', contactIds)
        await supabase.from('phones').delete().in('contact_id', contactIds)
      }
      await supabase.from('email_queue').delete().eq('property_id', propId)
      
      // CRM
      const { data: crmLead } = await supabase.from('crm_leads').select('id').eq('property_id', propId).single()
      if (crmLead) {
        await supabase.from('crm_activities').delete().eq('crm_lead_id', crmLead.id)
        await supabase.from('crm_leads').delete().eq('property_id', propId)
      }
      
      await supabase.from('call_log').delete().eq('property_id', propId)
      await supabase.from('contacts').delete().eq('property_id', propId)

      // Finally delete the property
      const { error } = await supabase.from('properties').delete().eq('id', propId)
      if (error) throw error

      // Update local state
      setLeads(prev => prev.filter(l => l.id !== propId))
      showToast('Property deleted', 'success')
    } catch (err: any) {
      console.error('Delete property error:', err)
      showToast('Failed to delete property: ' + err.message, 'error')
    }

    setIsSubmitting(false)
    setDeletePropertyConfirm(null)
  }

  // ============ CONTACT CRUD ============

  const openAddContactModal = (property: Property) => {
    setContactForm({ name: '', role: '', is_decision_maker: false })
    setAddContactModal(property)
  }

  const handleAddContact = async () => {
    if (!addContactModal || !contactForm.name.trim()) return
    setIsSubmitting(true)

    const { data, error } = await supabase
      .from('contacts')
      .insert({
        property_id: addContactModal.id,
        name: contactForm.name,
        role: contactForm.role || null,
        is_decision_maker: contactForm.is_decision_maker
      })
      .select()
      .single()

    setIsSubmitting(false)

    if (error) {
      showToast('Failed to add contact: ' + error.message, 'error')
      return
    }

    // Update local state
    setLeads(prev => prev.map(l => 
      l.id === addContactModal.id 
        ? { ...l, contacts: [...(l.contacts || []), { ...data, phones: [], emails: [] }] }
        : l
    ))

    showToast('Contact added', 'success')
    setAddContactModal(null)
  }

  const openEditContactModal = (contact: Contact, propertyId: string) => {
    setContactForm({
      name: contact.name,
      role: contact.role || '',
      is_decision_maker: contact.is_decision_maker || false
    })
    setEditContactModal({ contact, propertyId })
  }

  const handleUpdateContact = async () => {
    if (!editContactModal) return
    setIsSubmitting(true)

    const { error } = await supabase
      .from('contacts')
      .update({
        name: contactForm.name,
        role: contactForm.role || null,
        is_decision_maker: contactForm.is_decision_maker
      })
      .eq('id', editContactModal.contact.id)

    setIsSubmitting(false)

    if (error) {
      showToast('Failed to update contact: ' + error.message, 'error')
      return
    }

    // Update local state
    setLeads(prev => prev.map(l => 
      l.id === editContactModal.propertyId 
        ? { 
            ...l, 
            contacts: l.contacts?.map(c => 
              c.id === editContactModal.contact.id 
                ? { ...c, name: contactForm.name, role: contactForm.role || null, is_decision_maker: contactForm.is_decision_maker }
                : c
            )
          }
        : l
    ))

    showToast('Contact updated', 'success')
    setEditContactModal(null)
  }

  const handleDeleteContact = async () => {
    if (!deleteContactConfirm) return
    setIsSubmitting(true)

    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', deleteContactConfirm.contact.id)

    setIsSubmitting(false)

    if (error) {
      showToast('Failed to delete contact: ' + error.message, 'error')
      return
    }

    // Update local state
    setLeads(prev => prev.map(l => 
      l.id === deleteContactConfirm.propertyId 
        ? { ...l, contacts: l.contacts?.filter(c => c.id !== deleteContactConfirm.contact.id) }
        : l
    ))

    showToast('Contact deleted', 'success')
    setDeleteContactConfirm(null)
  }

  // ============ PHONE CRUD ============

  const openAddPhoneModal = (contactId: string) => {
    setPhoneForm({ number: '', type: 'cell', is_dnc: false })
    setAddPhoneModal(contactId)
  }

  const handleAddPhone = async () => {
    if (!addPhoneModal || !phoneForm.number.trim()) return
    setIsSubmitting(true)

    const { data, error } = await supabase
      .from('phones')
      .insert({
        contact_id: addPhoneModal,
        number: phoneForm.number,
        type: phoneForm.type,
        is_dnc: phoneForm.is_dnc
      })
      .select()
      .single()

    setIsSubmitting(false)

    if (error) {
      showToast('Failed to add phone: ' + error.message, 'error')
      return
    }

    // Update local state
    setLeads(prev => prev.map(l => ({
      ...l,
      contacts: l.contacts?.map(c => 
        c.id === addPhoneModal 
          ? { ...c, phones: [...(c.phones || []), data] }
          : c
      )
    })))

    showToast('Phone added', 'success')
    setAddPhoneModal(null)
  }

  const openEditPhoneModal = (phone: Phone) => {
    setPhoneForm({
      number: phone.number,
      type: phone.type || 'cell',
      is_dnc: phone.is_dnc || false
    })
    setEditPhoneModal(phone)
  }

  const handleUpdatePhone = async () => {
    if (!editPhoneModal) return
    setIsSubmitting(true)

    const { error } = await supabase
      .from('phones')
      .update({
        number: phoneForm.number,
        type: phoneForm.type,
        is_dnc: phoneForm.is_dnc
      })
      .eq('id', editPhoneModal.id)

    setIsSubmitting(false)

    if (error) {
      showToast('Failed to update phone: ' + error.message, 'error')
      return
    }

    // Update local state
    setLeads(prev => prev.map(l => ({
      ...l,
      contacts: l.contacts?.map(c => ({
        ...c,
        phones: c.phones?.map(p => 
          p.id === editPhoneModal.id 
            ? { ...p, number: phoneForm.number, type: phoneForm.type, is_dnc: phoneForm.is_dnc }
            : p
        )
      }))
    })))

    showToast('Phone updated', 'success')
    setEditPhoneModal(null)
  }

  const handleDeletePhone = async () => {
    if (!deletePhoneConfirm) return
    setIsSubmitting(true)

    const { error } = await supabase
      .from('phones')
      .delete()
      .eq('id', deletePhoneConfirm.id)

    setIsSubmitting(false)

    if (error) {
      showToast('Failed to delete phone: ' + error.message, 'error')
      return
    }

    // Update local state and remove from selection
    setLeads(prev => prev.map(l => ({
      ...l,
      contacts: l.contacts?.map(c => ({
        ...c,
        phones: c.phones?.filter(p => p.id !== deletePhoneConfirm.id)
      }))
    })))
    setSelectedPhones(prev => {
      const newSet = new Set(prev)
      newSet.delete(deletePhoneConfirm.id)
      return newSet
    })

    showToast('Phone deleted', 'success')
    setDeletePhoneConfirm(null)
  }

  const handleMarkDNC = async () => {
    if (!markDNCConfirm) return
    setIsSubmitting(true)

    const { error } = await supabase
      .from('phones')
      .update({ is_dnc: true })
      .eq('id', markDNCConfirm.id)

    setIsSubmitting(false)

    if (error) {
      showToast('Failed to mark as DNC: ' + error.message, 'error')
      return
    }

    // Update local state and remove from selection
    setLeads(prev => prev.map(l => ({
      ...l,
      contacts: l.contacts?.map(c => ({
        ...c,
        phones: c.phones?.map(p => 
          p.id === markDNCConfirm.id ? { ...p, is_dnc: true } : p
        )
      }))
    })))
    setSelectedPhones(prev => {
      const newSet = new Set(prev)
      newSet.delete(markDNCConfirm.id)
      return newSet
    })

    showToast('Phone marked as DNC', 'success')
    setMarkDNCConfirm(null)
  }

  // ============ EMAIL CRUD ============

  const openAddEmailModal = (contactId: string) => {
    setEmailForm({ email: '' })
    setAddEmailModal(contactId)
  }

  const handleAddEmail = async () => {
    if (!addEmailModal || !emailForm.email.trim()) return
    setIsSubmitting(true)

    const { data, error } = await supabase
      .from('emails')
      .insert({
        contact_id: addEmailModal,
        email: emailForm.email
      })
      .select()
      .single()

    setIsSubmitting(false)

    if (error) {
      showToast('Failed to add email: ' + error.message, 'error')
      return
    }

    // Update local state
    setLeads(prev => prev.map(l => ({
      ...l,
      contacts: l.contacts?.map(c => 
        c.id === addEmailModal 
          ? { ...c, emails: [...(c.emails || []), data] }
          : c
      )
    })))

    showToast('Email added', 'success')
    setAddEmailModal(null)
  }

  const openEditEmailModal = (email: Email) => {
    setEmailForm({ email: email.email })
    setEditEmailModal(email)
  }

  const handleUpdateEmail = async () => {
    if (!editEmailModal) return
    setIsSubmitting(true)

    const { error } = await supabase
      .from('emails')
      .update({ email: emailForm.email })
      .eq('id', editEmailModal.id)

    setIsSubmitting(false)

    if (error) {
      showToast('Failed to update email: ' + error.message, 'error')
      return
    }

    // Update local state
    setLeads(prev => prev.map(l => ({
      ...l,
      contacts: l.contacts?.map(c => ({
        ...c,
        emails: c.emails?.map(e => 
          e.id === editEmailModal.id ? { ...e, email: emailForm.email } : e
        )
      }))
    })))

    showToast('Email updated', 'success')
    setEditEmailModal(null)
  }

  const handleDeleteEmail = async () => {
    if (!deleteEmailConfirm) return
    setIsSubmitting(true)

    const { error } = await supabase
      .from('emails')
      .delete()
      .eq('id', deleteEmailConfirm.id)

    setIsSubmitting(false)

    if (error) {
      showToast('Failed to delete email: ' + error.message, 'error')
      return
    }

    // Update local state and remove from selection
    setLeads(prev => prev.map(l => ({
      ...l,
      contacts: l.contacts?.map(c => ({
        ...c,
        emails: c.emails?.filter(e => e.id !== deleteEmailConfirm.id)
      }))
    })))
    setSelectedEmails(prev => {
      const newSet = new Set(prev)
      newSet.delete(deleteEmailConfirm.id)
      return newSet
    })

    showToast('Email deleted', 'success')
    setDeleteEmailConfirm(null)
  }

  // ============ BULK ACTIONS ============

  const handleBulkDelete = async () => {
    if (selectedPropertyIds.size === 0) return
    setIsSubmitting(true)

    const ids = Array.from(selectedPropertyIds)

    try {
      // Get contact IDs for these properties
      const { data: contacts } = await supabase
        .from('contacts')
        .select('id')
        .in('property_id', ids)
      const contactIds = contacts?.map(c => c.id) || []

      // Delete in correct order: children first
      if (contactIds.length > 0) {
        await supabase.from('emails').delete().in('contact_id', contactIds)
        await supabase.from('phones').delete().in('contact_id', contactIds)
      }
      await supabase.from('email_queue').delete().in('property_id', ids)
      await supabase.from('crm_activities').delete().in('crm_lead_id', 
        (await supabase.from('crm_leads').select('id').in('property_id', ids)).data?.map(l => l.id) || []
      )
      await supabase.from('crm_leads').delete().in('property_id', ids)
      await supabase.from('call_log').delete().in('property_id', ids)
      await supabase.from('contacts').delete().in('property_id', ids)

      // Finally delete properties
      const { error } = await supabase.from('properties').delete().in('id', ids)
      if (error) throw error

      // Update local state
      setLeads(prev => prev.filter(l => !selectedPropertyIds.has(l.id)))
      clearSelection()
      showToast(`${ids.length} properties deleted`, 'success')
    } catch (err: any) {
      console.error('Bulk delete error:', err)
      showToast('Failed to delete properties: ' + err.message, 'error')
    }

    setIsSubmitting(false)
    setBulkDeleteConfirm(false)
  }

  const handleBulkMarkDNC = async () => {
    if (selectedPhones.size === 0) return
    setIsSubmitting(true)

    const phoneIds = Array.from(selectedPhones)

    const { error } = await supabase
      .from('phones')
      .update({ is_dnc: true })
      .in('id', phoneIds)

    setIsSubmitting(false)

    if (error) {
      showToast('Failed to mark as DNC: ' + error.message, 'error')
      return
    }

    // Update local state
    setLeads(prev => prev.map(l => ({
      ...l,
      contacts: l.contacts?.map(c => ({
        ...c,
        phones: c.phones?.map(p => 
          selectedPhones.has(p.id) ? { ...p, is_dnc: true } : p
        )
      }))
    })))
    setSelectedPhones(new Set())

    showToast(`${phoneIds.length} phones marked as DNC`, 'success')
    setBulkDNCConfirm(false)
  }

  // Delete ALL leads (properties + contacts + phones + emails)
  async function handleDeleteAll() {
    if (deleteAllText !== 'DELETE') return
    setIsDeletingAll(true)

    try {
      // Delete in correct order: dependent tables first, then parent tables
      const errors: string[] = []

      // 1. Email queue items
      const { error: e1 } = await supabase.from('email_queue').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      if (e1) errors.push(`email_queue: ${e1.message}`)

      // 2. CRM activities (depends on crm_leads)
      const { data: crmIds } = await supabase.from('crm_leads').select('id')
      if (crmIds && crmIds.length > 0) {
        const { error: e2 } = await supabase.from('crm_activities').delete().in('crm_lead_id', crmIds.map(c => c.id))
        if (e2) errors.push(`crm_activities: ${e2.message}`)
      }

      // 3. CRM leads
      const { error: e3 } = await supabase.from('crm_leads').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      if (e3) errors.push(`crm_leads: ${e3.message}`)

      // 4. Call log
      const { error: e4 } = await supabase.from('call_log').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      if (e4) errors.push(`call_log: ${e4.message}`)

      // 5. Emails
      const { error: e5 } = await supabase.from('emails').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      if (e5) errors.push(`emails: ${e5.message}`)

      // 6. Phones
      const { error: e6 } = await supabase.from('phones').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      if (e6) errors.push(`phones: ${e6.message}`)

      // 7. Contacts
      const { error: e7 } = await supabase.from('contacts').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      if (e7) errors.push(`contacts: ${e7.message}`)

      // 8. Properties (root table)
      const { error: e8 } = await supabase.from('properties').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      if (e8) errors.push(`properties: ${e8.message}`)

      if (errors.length > 0) {
        console.error('Delete all errors:', errors)
        showToast(`Partial delete - errors: ${errors.join('; ')}`, 'warning')
      } else {
        showToast('All lead data deleted', 'success')
      }

      setLeads([])
      setSelectedPhones(new Set())
      setSelectedEmails(new Set())
    } catch (err: any) {
      console.error('Delete all error:', err)
      showToast('Failed to delete: ' + (err.message || 'Unknown error'), 'error')
    } finally {
      setIsDeletingAll(false)
      setShowDeleteAllConfirm(false)
      setDeleteAllText('')
    }
  }

  // Refresh leads after CSV import
  async function handleImportComplete() {
    try {
      const { data } = await supabase
        .from('properties')
        .select(`
          *,
          contacts (
            *,
            phones (*),
            emails (*)
          )
        `)
        .order('created_at', { ascending: false })

      if (data) {
        setLeads(data)
        showToast('Leads refreshed', 'success')
      }
    } catch (err) {
      // Reload page as fallback
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-3 h-3 rounded-full bg-norx" />
              <h1 className="text-2xl font-bold text-white">NorLead</h1>
            </div>
            <p className="text-white/50">
              Find motivated sellers ready to make a move
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCSVUpload(true)}
              className="flex items-center gap-2 px-4 py-2 bg-norv/20 hover:bg-norv/30 text-norv rounded-lg transition"
            >
              <Upload size={18} />
              <span>Upload CSV</span>
            </button>
            <button
              onClick={() => setShowDeleteAllConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition"
            >
              <Trash2 size={18} />
              <span>Delete All</span>
            </button>
          </div>
        </div>
      </div>

      {/* Section Tabs: Sellers / Buyers */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveSection('sellers')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
            activeSection === 'sellers'
              ? 'bg-norx text-white shadow-lg shadow-norx/25'
              : 'bg-navy-800 text-white/60 hover:text-white border border-white/10'
          }`}
        >
          <Users size={18} />
          Sellers
        </button>
        <button
          onClick={() => setActiveSection('buyers')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
            activeSection === 'buyers'
              ? 'bg-norx text-white shadow-lg shadow-norx/25'
              : 'bg-navy-800 text-white/60 hover:text-white border border-white/10'
          }`}
        >
          <ShoppingCart size={18} />
          Buyers
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Soon</span>
        </button>
      </div>

      {/* Sellers Section */}
      {activeSection === 'sellers' && (
        <>
          {/* Category Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {sellerCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => cat.active && setActiveCategory(cat.id)}
                disabled={!cat.active}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                  activeCategory === cat.id
                    ? 'bg-norv/20 text-norv border border-norv/30'
                    : cat.active
                    ? 'bg-navy-800 text-white/60 hover:text-white border border-white/10'
                    : 'bg-navy-800/50 text-white/30 border border-white/5 cursor-not-allowed'
                }`}
              >
                <cat.icon size={16} />
                {cat.label}
                {!cat.active && <span className="text-xs">Soon</span>}
              </button>
            ))}
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-navy-800 border border-white/10 rounded-xl p-4">
              <div className="text-2xl font-bold text-white">{filteredLeads.length}</div>
              <div className="text-sm text-white/50">Properties</div>
            </div>
            <div className="bg-navy-800 border border-white/10 rounded-xl p-4">
              <div className="text-2xl font-bold text-emerald-400">{filteredStats.callablePhones}</div>
              <div className="text-sm text-white/50">Callable Phones</div>
            </div>
            <div className="bg-navy-800 border border-white/10 rounded-xl p-4">
              <div className="text-2xl font-bold text-amber-400">{filteredStats.emails}</div>
              <div className="text-sm text-white/50">Emails</div>
            </div>
            <div className="bg-navy-800 border border-white/10 rounded-xl p-4">
              <div className="text-2xl font-bold text-white">{filteredStats.contacts}</div>
              <div className="text-sm text-white/50">Contacts</div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-navy-800 border border-white/10 rounded-xl mb-6 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-white/50" />
                <span className="font-medium text-white">Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="bg-norx/20 text-norx text-xs px-2 py-0.5 rounded-full">
                    {activeFiltersCount} active
                  </span>
                )}
              </div>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-white/50 hover:text-white flex items-center gap-1"
                >
                  <X size={14} />
                  Clear all
                </button>
              )}
            </div>

            <div className="p-4 space-y-4">
              {/* City Filter */}
              <div>
                <label className="block text-xs text-white/40 uppercase tracking-wide mb-2">
                  City
                </label>
                <FilterDropdown
                  options={filterOptions.cities}
                  selected={selectedCities}
                  onToggle={toggleCity}
                  placeholder="Select cities..."
                />
              </div>

              {/* Zip Code Filter */}
              <div>
                <label className="block text-xs text-white/40 uppercase tracking-wide mb-2">
                  Zip Code
                </label>
                <FilterDropdown
                  options={filterOptions.zips}
                  selected={selectedZips}
                  onToggle={toggleZip}
                  placeholder="Select zip codes..."
                />
              </div>

              {/* Expired Date - IMPORTANT FILTER */}
              <div>
                <label className="block text-xs text-white/40 uppercase tracking-wide mb-2">
                  <span className="text-red-400">★</span> Expired Date
                </label>
                <div className="flex flex-wrap gap-2">
                  {expiredDateOptions.map(option => (
                    <button
                      key={option.label}
                      onClick={() => setSelectedExpiredDate(option)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        selectedExpiredDate === option
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-white/5 text-white/60 border border-white/10 hover:border-white/20'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-xs text-white/40 uppercase tracking-wide mb-2">
                  Price Range
                </label>
                <div className="flex flex-wrap gap-2">
                  {priceRanges.map(range => (
                    <button
                      key={range.label}
                      onClick={() => setSelectedPriceRange(range)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        selectedPriceRange === range
                          ? 'bg-norx/20 text-norx border border-norx/30'
                          : 'bg-white/5 text-white/60 border border-white/10 hover:border-white/20'
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Beds */}
              <div>
                <label className="block text-xs text-white/40 uppercase tracking-wide mb-2">
                  Bedrooms
                </label>
                <div className="flex flex-wrap gap-2">
                  {bedsOptions.map(option => (
                    <button
                      key={option.label}
                      onClick={() => setSelectedBeds(option)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        selectedBeds === option
                          ? 'bg-norx/20 text-norx border border-norx/30'
                          : 'bg-white/5 text-white/60 border border-white/10 hover:border-white/20'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status */}
              {filterOptions.statuses.length > 0 && (
                <div>
                  <label className="block text-xs text-white/40 uppercase tracking-wide mb-2">
                    Status
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {filterOptions.statuses.map(status => (
                      <button
                        key={status.value}
                        onClick={() => toggleStatus(status.value)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                          selectedStatuses.includes(status.value)
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-white/5 text-white/60 border border-white/10 hover:border-white/20'
                        }`}
                      >
                        {status.label}
                        <span className="text-xs opacity-60">({status.count})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Filter */}
              <div>
                <label className="block text-xs text-white/40 uppercase tracking-wide mb-2">
                  Contact Info
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'hasPhone', label: 'Has Phone' },
                    { value: 'hasEmail', label: 'Has Email' },
                    { value: 'hasBoth', label: 'Has Both' },
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setContactFilter(option.value as any)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        contactFilter === option.value
                          ? 'bg-norx/20 text-norx border border-norx/30'
                          : 'bg-white/5 text-white/60 border border-white/10 hover:border-white/20'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Selection Action Bar */}
          {(selectedPhones.size > 0 || selectedEmails.size > 0 || transferResult) && (
            <div className="sticky top-0 z-20 bg-navy-900/95 backdrop-blur border border-norx/30 rounded-xl p-4 mb-6 shadow-lg shadow-norx/10">
              {transferResult ? (
                // Transfer Result
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Check size={20} className="text-green-400" />
                    </div>
                    <div>
                      <div className="text-white font-medium">
                        {transferResult.success > 0 
                          ? `${transferResult.success} lead${transferResult.success > 1 ? 's' : ''} transferred to CRM`
                          : 'All selected leads already in CRM'
                        }
                      </div>
                      {transferResult.existing > 0 && transferResult.success > 0 && (
                        <div className="text-white/50 text-sm">
                          {transferResult.existing} already existed
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setTransferResult(null)}
                      className="px-4 py-2 rounded-lg bg-white/5 text-white/70 hover:text-white transition-colors"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={goToCRM}
                      className="px-4 py-2 rounded-lg bg-norv text-white font-medium flex items-center gap-2 hover:bg-norv/80 transition-colors"
                    >
                      Go to NorCRM
                    </button>
                  </div>
                </div>
              ) : (
                // Selection Bar
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Phone size={18} className="text-emerald-400" />
                      <span className="text-white font-medium">{selectedPhones.size}</span>
                      <span className="text-white/50">phones</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={18} className="text-amber-400" />
                      <span className="text-white font-medium">{selectedEmails.size}</span>
                      <span className="text-white/50">emails</span>
                    </div>
                    <div className="text-white/30">|</div>
                    <div className="text-white/50">
                      <span className="text-white font-medium">{selectedPropertyIds.size}</span> properties
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedPhones.size > 0 && (
                      <button
                        onClick={() => setBulkDNCConfirm(true)}
                        className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors flex items-center gap-2"
                      >
                        <Ban size={16} />
                        Mark DNC
                      </button>
                    )}
                    <button
                      onClick={() => setBulkDeleteConfirm(true)}
                      className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors flex items-center gap-2"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                    <button
                      onClick={clearSelection}
                      className="px-4 py-2 rounded-lg bg-white/5 text-white/70 hover:text-white transition-colors"
                    >
                      Clear
                    </button>
                    <button
                      onClick={handleTransferToCRM}
                      disabled={isTransferring}
                      className="px-4 py-2 rounded-lg bg-norv text-white font-medium flex items-center gap-2 hover:bg-norv/80 disabled:opacity-50 transition-colors"
                    >
                      {isTransferring ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Transferring...
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          Transfer to NorCRM
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bulk Actions */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-white/50">
              Showing <span className="text-white font-medium">{filteredLeads.length}</span> properties
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={selectAllVisible}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-white/60 hover:text-white border border-white/10 text-sm"
              >
                <CheckSquare size={14} />
                Select All Visible
              </button>
            </div>
          </div>

          {/* Property Cards */}
          <div className="space-y-4">
            {filteredLeads.length === 0 ? (
              <div className="bg-navy-800 border border-white/10 rounded-xl p-12 text-center">
                <div className="text-white/50">No properties match your filters</div>
                <button
                  onClick={clearFilters}
                  className="mt-4 text-norx hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              filteredLeads.map(lead => (
                <PropertyCard
                  key={lead.id}
                  property={lead}
                  isExpanded={expandedLeads.has(lead.id)}
                  onToggle={() => toggleLead(lead.id)}
                  selectedPhones={selectedPhones}
                  selectedEmails={selectedEmails}
                  onTogglePhone={togglePhone}
                  onToggleEmail={toggleEmail}
                  onSelectAllPhones={() => selectAllPhonesInLead(lead)}
                  onSelectAllEmails={() => selectAllEmailsInLead(lead)}
                  onEditProperty={openEditPropertyModal}
                  onDeleteProperty={setDeletePropertyConfirm}
                  onAddContact={openAddContactModal}
                  onEditContact={openEditContactModal}
                  onDeleteContact={(contact, propertyId) => setDeleteContactConfirm({ contact, propertyId })}
                  onAddPhone={openAddPhoneModal}
                  onAddEmail={openAddEmailModal}
                  onEditPhone={openEditPhoneModal}
                  onDeletePhone={setDeletePhoneConfirm}
                  onMarkDNC={setMarkDNCConfirm}
                  onEditEmail={openEditEmailModal}
                  onDeleteEmail={setDeleteEmailConfirm}
                />
              ))
            )}
          </div>
        </>
      )}

      {/* Buyers Section (Coming Soon) */}
      {activeSection === 'buyers' && (
        <div className="bg-navy-800 border border-white/10 rounded-xl p-12 text-center">
          <ShoppingCart size={48} className="mx-auto text-white/20 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Buyer Leads Coming Soon</h3>
          <p className="text-white/50">
            Active buyer leads and categories will be available in a future update.
          </p>
        </div>
      )}

      {/* ============ MODALS ============ */}

      {/* Edit Property Modal */}
      <Modal
        isOpen={!!editPropertyModal}
        onClose={() => setEditPropertyModal(null)}
        title="Edit Property"
        size="lg"
      >
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm text-white/60 mb-1">Street Address</label>
              <input
                type="text"
                value={propertyForm.street_address}
                onChange={(e) => setPropertyForm(prev => ({ ...prev, street_address: e.target.value }))}
                className="w-full bg-navy-900 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-norv/50"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">City</label>
              <input
                type="text"
                value={propertyForm.city}
                onChange={(e) => setPropertyForm(prev => ({ ...prev, city: e.target.value }))}
                className="w-full bg-navy-900 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-norv/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/60 mb-1">State</label>
                <input
                  type="text"
                  value={propertyForm.state}
                  onChange={(e) => setPropertyForm(prev => ({ ...prev, state: e.target.value }))}
                  className="w-full bg-navy-900 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-norv/50"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Zip</label>
                <input
                  type="text"
                  value={propertyForm.zip}
                  onChange={(e) => setPropertyForm(prev => ({ ...prev, zip: e.target.value }))}
                  className="w-full bg-navy-900 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-norv/50"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Price</label>
              <input
                type="number"
                value={propertyForm.price}
                onChange={(e) => setPropertyForm(prev => ({ ...prev, price: e.target.value }))}
                className="w-full bg-navy-900 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-norv/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/60 mb-1">Beds</label>
                <input
                  type="number"
                  value={propertyForm.beds}
                  onChange={(e) => setPropertyForm(prev => ({ ...prev, beds: e.target.value }))}
                  className="w-full bg-navy-900 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-norv/50"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Baths</label>
                <input
                  type="number"
                  step="0.5"
                  value={propertyForm.baths}
                  onChange={(e) => setPropertyForm(prev => ({ ...prev, baths: e.target.value }))}
                  className="w-full bg-navy-900 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-norv/50"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Sqft</label>
              <input
                type="number"
                value={propertyForm.sqft}
                onChange={(e) => setPropertyForm(prev => ({ ...prev, sqft: e.target.value }))}
                className="w-full bg-navy-900 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-norv/50"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Year Built</label>
              <input
                type="number"
                value={propertyForm.year_built}
                onChange={(e) => setPropertyForm(prev => ({ ...prev, year_built: e.target.value }))}
                className="w-full bg-navy-900 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-norv/50"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Status</label>
              <select
                value={propertyForm.status}
                onChange={(e) => setPropertyForm(prev => ({ ...prev, status: e.target.value }))}
                className="w-full bg-navy-900 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-norv/50"
              >
                <option value="">Select status...</option>
                {propertyStatusOptions.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button
              onClick={() => setEditPropertyModal(null)}
              className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateProperty}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-norv text-white font-medium hover:bg-norv/80 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              Save Changes
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Contact Modal */}
      <Modal
        isOpen={!!addContactModal}
        onClose={() => setAddContactModal(null)}
        title="Add Contact"
        size="sm"
      >
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-1">Name *</label>
            <input
              type="text"
              value={contactForm.name}
              onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Contact name"
              className="w-full bg-navy-900 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-norv/50"
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">Role</label>
            <select
              value={contactForm.role}
              onChange={(e) => setContactForm(prev => ({ ...prev, role: e.target.value }))}
              className="w-full bg-navy-900 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-norv/50"
            >
              <option value="">Select role...</option>
              {roleOptions.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={contactForm.is_decision_maker}
              onChange={(e) => setContactForm(prev => ({ ...prev, is_decision_maker: e.target.checked }))}
              className="w-4 h-4 rounded border-white/20 bg-navy-900 text-norv focus:ring-norv/50"
            />
            <span className="text-sm text-white/70">Decision Maker</span>
          </label>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button
              onClick={() => setAddContactModal(null)}
              className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddContact}
              disabled={isSubmitting || !contactForm.name.trim()}
              className="px-4 py-2 rounded-lg bg-norv text-white font-medium hover:bg-norv/80 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              Add Contact
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Contact Modal */}
      <Modal
        isOpen={!!editContactModal}
        onClose={() => setEditContactModal(null)}
        title="Edit Contact"
        size="sm"
      >
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-1">Name</label>
            <input
              type="text"
              value={contactForm.name}
              onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full bg-navy-900 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-norv/50"
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">Role</label>
            <select
              value={contactForm.role}
              onChange={(e) => setContactForm(prev => ({ ...prev, role: e.target.value }))}
              className="w-full bg-navy-900 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-norv/50"
            >
              <option value="">Select role...</option>
              {roleOptions.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={contactForm.is_decision_maker}
              onChange={(e) => setContactForm(prev => ({ ...prev, is_decision_maker: e.target.checked }))}
              className="w-4 h-4 rounded border-white/20 bg-navy-900 text-norv focus:ring-norv/50"
            />
            <span className="text-sm text-white/70">Decision Maker</span>
          </label>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button
              onClick={() => setEditContactModal(null)}
              className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateContact}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-norv text-white font-medium hover:bg-norv/80 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              Save Changes
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Phone Modal */}
      <Modal
        isOpen={!!addPhoneModal}
        onClose={() => setAddPhoneModal(null)}
        title="Add Phone"
        size="sm"
      >
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-1">Phone Number *</label>
            <input
              type="tel"
              value={phoneForm.number}
              onChange={(e) => setPhoneForm(prev => ({ ...prev, number: e.target.value }))}
              placeholder="(555) 123-4567"
              className="w-full bg-navy-900 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-norv/50"
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">Type</label>
            <select
              value={phoneForm.type}
              onChange={(e) => setPhoneForm(prev => ({ ...prev, type: e.target.value }))}
              className="w-full bg-navy-900 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-norv/50"
            >
              {phoneTypeOptions.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={phoneForm.is_dnc}
              onChange={(e) => setPhoneForm(prev => ({ ...prev, is_dnc: e.target.checked }))}
              className="w-4 h-4 rounded border-white/20 bg-navy-900 text-red-500 focus:ring-red-500/50"
            />
            <span className="text-sm text-white/70">Do Not Call (DNC)</span>
          </label>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button
              onClick={() => setAddPhoneModal(null)}
              className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddPhone}
              disabled={isSubmitting || !phoneForm.number.trim()}
              className="px-4 py-2 rounded-lg bg-norv text-white font-medium hover:bg-norv/80 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              Add Phone
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Phone Modal */}
      <Modal
        isOpen={!!editPhoneModal}
        onClose={() => setEditPhoneModal(null)}
        title="Edit Phone"
        size="sm"
      >
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-1">Phone Number</label>
            <input
              type="tel"
              value={phoneForm.number}
              onChange={(e) => setPhoneForm(prev => ({ ...prev, number: e.target.value }))}
              className="w-full bg-navy-900 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-norv/50"
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">Type</label>
            <select
              value={phoneForm.type}
              onChange={(e) => setPhoneForm(prev => ({ ...prev, type: e.target.value }))}
              className="w-full bg-navy-900 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-norv/50"
            >
              {phoneTypeOptions.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={phoneForm.is_dnc}
              onChange={(e) => setPhoneForm(prev => ({ ...prev, is_dnc: e.target.checked }))}
              className="w-4 h-4 rounded border-white/20 bg-navy-900 text-red-500 focus:ring-red-500/50"
            />
            <span className="text-sm text-white/70">Do Not Call (DNC)</span>
          </label>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button
              onClick={() => setEditPhoneModal(null)}
              className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdatePhone}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-norv text-white font-medium hover:bg-norv/80 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              Save Changes
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Email Modal */}
      <Modal
        isOpen={!!addEmailModal}
        onClose={() => setAddEmailModal(null)}
        title="Add Email"
        size="sm"
      >
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-1">Email Address *</label>
            <input
              type="email"
              value={emailForm.email}
              onChange={(e) => setEmailForm(prev => ({ ...prev, email: e.target.value }))}
              placeholder="email@example.com"
              className="w-full bg-navy-900 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-norv/50"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button
              onClick={() => setAddEmailModal(null)}
              className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddEmail}
              disabled={isSubmitting || !emailForm.email.trim()}
              className="px-4 py-2 rounded-lg bg-norv text-white font-medium hover:bg-norv/80 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              Add Email
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Email Modal */}
      <Modal
        isOpen={!!editEmailModal}
        onClose={() => setEditEmailModal(null)}
        title="Edit Email"
        size="sm"
      >
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-1">Email Address</label>
            <input
              type="email"
              value={emailForm.email}
              onChange={(e) => setEmailForm(prev => ({ ...prev, email: e.target.value }))}
              className="w-full bg-navy-900 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-norv/50"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button
              onClick={() => setEditEmailModal(null)}
              className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateEmail}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-norv text-white font-medium hover:bg-norv/80 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              Save Changes
            </button>
          </div>
        </div>
      </Modal>

      {/* ============ CONFIRM DIALOGS ============ */}

      {/* Delete Property Confirm */}
      <ConfirmDialog
        isOpen={!!deletePropertyConfirm}
        onClose={() => setDeletePropertyConfirm(null)}
        onConfirm={handleDeleteProperty}
        title="Delete Property"
        message={
          <div>
            <p>Delete <strong>{deletePropertyConfirm?.street_address}</strong> and all its contacts?</p>
            <p className="mt-2 text-red-400">This cannot be undone.</p>
          </div>
        }
        confirmLabel="Delete Property"
        variant="danger"
        isLoading={isSubmitting}
      />

      {/* Delete Contact Confirm */}
      <ConfirmDialog
        isOpen={!!deleteContactConfirm}
        onClose={() => setDeleteContactConfirm(null)}
        onConfirm={handleDeleteContact}
        title="Delete Contact"
        message={`Delete ${deleteContactConfirm?.contact.name} and all their phone numbers/emails?`}
        confirmLabel="Delete Contact"
        variant="danger"
        isLoading={isSubmitting}
      />

      {/* Delete Phone Confirm */}
      <ConfirmDialog
        isOpen={!!deletePhoneConfirm}
        onClose={() => setDeletePhoneConfirm(null)}
        onConfirm={handleDeletePhone}
        title="Delete Phone"
        message={`Delete phone number ${deletePhoneConfirm?.number}?`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={isSubmitting}
      />

      {/* Mark DNC Confirm */}
      <ConfirmDialog
        isOpen={!!markDNCConfirm}
        onClose={() => setMarkDNCConfirm(null)}
        onConfirm={handleMarkDNC}
        title="Mark as Do Not Call"
        message={`Mark ${markDNCConfirm?.number} as DNC? This phone will no longer be selectable for campaigns.`}
        confirmLabel="Mark as DNC"
        variant="warning"
        isLoading={isSubmitting}
      />

      {/* Delete Email Confirm */}
      <ConfirmDialog
        isOpen={!!deleteEmailConfirm}
        onClose={() => setDeleteEmailConfirm(null)}
        onConfirm={handleDeleteEmail}
        title="Delete Email"
        message={`Delete email ${deleteEmailConfirm?.email}?`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={isSubmitting}
      />

      {/* Bulk Delete Confirm */}
      <ConfirmDialog
        isOpen={bulkDeleteConfirm}
        onClose={() => setBulkDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title="Delete Properties"
        message={
          <div>
            <p>Delete <strong>{selectedPropertyIds.size}</strong> properties and all their contacts?</p>
            <p className="mt-2 text-red-400">This cannot be undone.</p>
          </div>
        }
        confirmLabel={`Delete ${selectedPropertyIds.size} Properties`}
        variant="danger"
        isLoading={isSubmitting}
      />

      {/* Bulk DNC Confirm */}
      <ConfirmDialog
        isOpen={bulkDNCConfirm}
        onClose={() => setBulkDNCConfirm(false)}
        onConfirm={handleBulkMarkDNC}
        title="Mark All as DNC"
        message={`Mark ${selectedPhones.size} phone numbers as Do Not Call?`}
        confirmLabel={`Mark ${selectedPhones.size} as DNC`}
        variant="warning"
        isLoading={isSubmitting}
      />

      {/* CSV Upload Modal */}
      <CSVUploadModal
        isOpen={showCSVUpload}
        onClose={() => setShowCSVUpload(false)}
        onImportComplete={handleImportComplete}
        existingCount={leads.length}
      />

      {/* Delete All Confirmation */}
      {showDeleteAllConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => { setShowDeleteAllConfirm(false); setDeleteAllText('') }} />
          <div className="relative bg-navy-800 border border-white/20 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle size={28} className="text-red-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-white text-center mb-2">Delete All Lead Data?</h3>
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
              <p className="text-white/70 text-sm mb-2">This will permanently delete:</p>
              <ul className="space-y-1 text-sm text-white/80">
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-400" />{leads.length} properties</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-400" />All contacts, phones, and emails</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-400" />All CRM leads and activities</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-400" />All queued calls and emails</li>
              </ul>
              <p className="text-red-400 text-xs mt-3 font-medium">This cannot be undone.</p>
            </div>
            <div className="mb-4">
              <p className="text-white/50 text-xs mb-2">Type <strong className="text-red-400">DELETE</strong> to confirm:</p>
              <input
                type="text"
                value={deleteAllText}
                onChange={(e) => setDeleteAllText(e.target.value)}
                placeholder="Type DELETE"
                className="w-full bg-navy-900 border border-red-500/30 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-red-500"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setShowDeleteAllConfirm(false); setDeleteAllText('') }}
                disabled={isDeletingAll}
                className="flex-1 px-4 py-2.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={isDeletingAll || deleteAllText !== 'DELETE'}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white transition text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {isDeletingAll ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                Delete Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
