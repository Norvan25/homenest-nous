'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export type ViewMode = 'admin' | 'agent'
export type UserRole = 'super_admin' | 'admin' | 'agent'

interface ViewState {
  currentView: ViewMode
  userRole: UserRole
  isAdmin: boolean
  isSuperAdmin: boolean
  loading: boolean
}

export function useCurrentView(): ViewState {
  const [state, setState] = useState<ViewState>({
    currentView: 'agent',
    userRole: 'agent',
    isAdmin: false,
    isSuperAdmin: false,
    loading: true
  })

  useEffect(() => {
    async function load() {
      try {
        // For now, default to admin view for development
        // In production, this would check user_roles and user_preferences tables
        
        // Try to get user role from localStorage for persistence
        const savedView = localStorage.getItem('homenest_current_view') as ViewMode | null
        const savedRole = localStorage.getItem('homenest_user_role') as UserRole | null

        // Default to super_admin for development
        const role = savedRole || 'super_admin'
        const canAccessAdmin = role === 'super_admin' || role === 'admin'
        const view = canAccessAdmin ? (savedView || 'admin') : 'agent'

        setState({
          currentView: view,
          userRole: role,
          isAdmin: canAccessAdmin,
          isSuperAdmin: role === 'super_admin',
          loading: false
        })
      } catch (error) {
        console.error('Error loading view state:', error)
        setState(prev => ({ ...prev, loading: false }))
      }
    }
    
    load()
  }, [])

  return state
}

export function setCurrentView(view: ViewMode) {
  localStorage.setItem('homenest_current_view', view)
  window.location.reload()
}

export function setUserRole(role: UserRole) {
  localStorage.setItem('homenest_user_role', role)
}
