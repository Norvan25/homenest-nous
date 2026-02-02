'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export type ViewMode = 'admin' | 'agent'
export type UserRole = 'super_admin' | 'admin' | 'agent'

interface ViewState {
  currentView: ViewMode
  userRole: UserRole
  isAdmin: boolean
  isSuperAdmin: boolean
  loading: boolean
  userName: string | null
  userEmail: string | null
}

export function useCurrentView(): ViewState {
  const [state, setState] = useState<ViewState>({
    currentView: 'agent',
    userRole: 'agent',
    isAdmin: false,
    isSuperAdmin: false,
    loading: true,
    userName: null,
    userEmail: null
  })

  useEffect(() => {
    async function load() {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // Get authenticated user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          console.error('No authenticated user:', userError)
          setState(prev => ({ ...prev, loading: false }))
          return
        }

        // Fetch user's role from user_roles table
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single()

        let role: UserRole = 'agent' // Default to agent
        
        if (roleError) {
          console.log('No role found in user_roles, checking metadata or defaulting to agent')
          // Fallback: check user metadata if no role in table
          const metaRole = user.user_metadata?.role as UserRole
          if (metaRole && ['super_admin', 'admin', 'agent'].includes(metaRole)) {
            role = metaRole
          }
        } else if (roleData?.role) {
          role = roleData.role as UserRole
        }

        const canAccessAdmin = role === 'super_admin' || role === 'admin'
        
        // Get saved view preference, but only use it if user has admin access
        const savedView = localStorage.getItem('homenest_current_view') as ViewMode | null
        const view = canAccessAdmin ? (savedView || 'admin') : 'agent'

        // Get user display name
        const userName = user.user_metadata?.full_name || 
                        user.user_metadata?.name || 
                        user.email?.split('@')[0] || 
                        'User'

        setState({
          currentView: view,
          userRole: role,
          isAdmin: canAccessAdmin,
          isSuperAdmin: role === 'super_admin',
          loading: false,
          userName,
          userEmail: user.email || null
        })

        // Store for persistence
        localStorage.setItem('homenest_user_role', role)
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
