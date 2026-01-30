'use client'

import { Phone, Trash2, GripVertical, MapPin, Loader2, CheckCircle, XCircle } from 'lucide-react'

interface Props {
  item: {
    id: string
    phone_number: string
    contact_name: string | null
    property_address: string
    position: number
    status: string
    call_outcome?: string
  }
  index: number
  onRemove: () => void
  isCurrentCall?: boolean
}

export default function CallQueueItem({ item, index, onRemove, isCurrentCall }: Props) {
  const isCalling = item.status === 'calling'
  const isCompleted = item.status === 'completed'
  const isFailed = item.status === 'failed'

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg group transition ${
      isCurrentCall || isCalling
        ? 'bg-green-500/20 border border-green-500/30'
        : isCompleted
        ? 'bg-white/5 border border-white/5 opacity-60'
        : isFailed
        ? 'bg-red-500/10 border border-red-500/20'
        : 'bg-white/5 hover:bg-white/10'
    }`}>
      {/* Drag handle or status icon */}
      <div className="text-white/20">
        {isCalling ? (
          <Loader2 className="w-4 h-4 text-green-400 animate-spin" />
        ) : isCompleted ? (
          <CheckCircle className="w-4 h-4 text-green-400" />
        ) : isFailed ? (
          <XCircle className="w-4 h-4 text-red-400" />
        ) : (
          <GripVertical className="w-4 h-4 cursor-grab" />
        )}
      </div>

      {/* Position */}
      <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-medium ${
        isCalling
          ? 'bg-green-500/30 text-green-300'
          : isCompleted
          ? 'bg-white/10 text-white/40'
          : 'bg-cyan-500/20 text-cyan-400'
      }`}>
        {index + 1}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Phone size={14} className={isCalling ? 'text-green-400' : 'text-green-400/70'} />
          <span className={`font-mono text-sm ${isCompleted ? 'text-white/50' : 'text-white'}`}>
            {item.phone_number}
          </span>
          {isCalling && (
            <span className="text-xs text-green-400 animate-pulse">Calling...</span>
          )}
          {isCompleted && item.call_outcome && (
            <span className="text-xs text-white/40">{item.call_outcome}</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-sm truncate ${isCompleted ? 'text-white/40' : 'text-white/60'}`}>
            {item.contact_name || 'Unknown'}
          </span>
          <span className="text-white/30">•</span>
          <span className={`text-xs truncate flex items-center gap-1 ${isCompleted ? 'text-white/30' : 'text-white/40'}`}>
            <MapPin className="w-3 h-3" />
            {item.property_address}
          </span>
        </div>
      </div>

      {/* Remove button - only show for queued items */}
      {item.status === 'queued' && (
        <button
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 p-2 text-white/40 hover:text-red-400 transition"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
