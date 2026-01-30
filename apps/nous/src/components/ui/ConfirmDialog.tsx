'use client'

import { ReactNode } from 'react'
import { AlertTriangle, X, Loader2 } from 'lucide-react'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string | ReactNode
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'default'
  isLoading?: boolean
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false
}: ConfirmDialogProps) {
  if (!isOpen) return null

  const variantColors = {
    danger: {
      icon: 'text-red-400',
      iconBg: 'bg-red-500/20',
      button: 'bg-red-500 hover:bg-red-600 text-white'
    },
    warning: {
      icon: 'text-amber-400',
      iconBg: 'bg-amber-500/20',
      button: 'bg-amber-500 hover:bg-amber-600 text-black'
    },
    default: {
      icon: 'text-norv',
      iconBg: 'bg-norv/20',
      button: 'bg-norv hover:bg-norv/80 text-white'
    }
  }

  const colors = variantColors[variant]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-navy-800 border border-white/20 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl ${colors.iconBg}`}>
              <AlertTriangle size={24} className={colors.icon} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
              <div className="text-white/60 text-sm">{message}</div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-navy-900/50 border-t border-white/10 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 ${colors.button}`}
          >
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
