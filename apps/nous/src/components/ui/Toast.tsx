'use client'

import { useEffect, useState, createContext, useContext, ReactNode, useCallback } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { id, message, type, duration }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[], onRemove: (id: string) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onRemove }: { toast: Toast, onRemove: (id: string) => void }) {
  useEffect(() => {
    if (toast.duration) {
      const timer = setTimeout(() => {
        onRemove(toast.id)
      }, toast.duration)
      return () => clearTimeout(timer)
    }
  }, [toast, onRemove])

  const icons = {
    success: <CheckCircle size={18} className="text-emerald-400" />,
    error: <XCircle size={18} className="text-red-400" />,
    warning: <AlertCircle size={18} className="text-amber-400" />,
    info: <Info size={18} className="text-blue-400" />
  }

  const bgColors = {
    success: 'bg-emerald-500/20 border-emerald-500/30',
    error: 'bg-red-500/20 border-red-500/30',
    warning: 'bg-amber-500/20 border-amber-500/30',
    info: 'bg-blue-500/20 border-blue-500/30'
  }

  return (
    <div 
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm shadow-lg ${bgColors[toast.type]} animate-slide-in`}
    >
      {icons[toast.type]}
      <span className="text-white text-sm">{toast.message}</span>
      <button
        onClick={() => onRemove(toast.id)}
        className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  )
}
