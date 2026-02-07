'use client'

import { useState } from 'react'
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Props {
  isOpen: boolean
  onClose: () => void
  selectedPropertyIds: string[]
  onDeleteComplete: (deletedIds: string[]) => void
}

export default function BulkDeleteDialog({ isOpen, onClose, selectedPropertyIds, onDeleteComplete }: Props) {
  const [isDeleting, setIsDeleting] = useState(false)

  const count = selectedPropertyIds.length

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      // Delete properties (cascading will handle contacts, phones, emails)
      // First delete CRM leads referencing these properties
      await supabase
        .from('crm_leads')
        .delete()
        .in('property_id', selectedPropertyIds)

      // Delete email queue items referencing these properties
      await supabase
        .from('email_queue')
        .delete()
        .in('property_id', selectedPropertyIds)

      // Delete the properties (contacts, phones, emails cascade)
      const { error } = await supabase
        .from('properties')
        .delete()
        .in('id', selectedPropertyIds)

      if (error) throw error

      onDeleteComplete(selectedPropertyIds)
    } catch (err: any) {
      console.error('Bulk delete error:', err)
    } finally {
      setIsDeleting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-navy-800 border border-white/20 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertTriangle size={28} className="text-red-400" />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-white text-center mb-4">
          Delete {count} {count === 1 ? 'Property' : 'Properties'}?
        </h3>

        {/* Warning */}
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
          <p className="text-white/70 text-sm mb-3">This will permanently delete:</p>
          <ul className="space-y-1.5 text-sm">
            <li className="flex items-center gap-2 text-white/80">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              {count} {count === 1 ? 'property' : 'properties'}
            </li>
            <li className="flex items-center gap-2 text-white/80">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              All associated contacts
            </li>
            <li className="flex items-center gap-2 text-white/80">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              All associated phone numbers
            </li>
            <li className="flex items-center gap-2 text-white/80">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              All associated emails
            </li>
            <li className="flex items-center gap-2 text-white/80">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              Any queued calls or emails
            </li>
          </ul>
          <p className="text-red-400 text-xs mt-3 font-medium">This cannot be undone.</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white transition text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isDeleting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Trash2 size={16} />
            )}
            Delete {count}
          </button>
        </div>
      </div>
    </div>
  )
}
