'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Theme = 'dark' | 'light'
type AccentColor = 'cyan' | 'purple' | 'green' | 'amber' | 'pink'
type SidebarStyle = 'expanded' | 'collapsed'

interface ThemeContextType {
  theme: Theme
  accentColor: AccentColor
  sidebarStyle: SidebarStyle
  setTheme: (theme: Theme) => void
  setAccentColor: (color: AccentColor) => void
  setSidebarStyle: (style: SidebarStyle) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const ACCENT_COLORS = {
  cyan: '#00A6FB',
  purple: '#8B5CF6',
  green: '#10B981',
  amber: '#F59E0B',
  pink: '#EC4899',
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark')
  const [accentColor, setAccentColorState] = useState<AccentColor>('cyan')
  const [sidebarStyle, setSidebarStyleState] = useState<SidebarStyle>('expanded')
  const [mounted, setMounted] = useState(false)

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('hn-theme') as Theme | null
    const savedAccent = localStorage.getItem('hn-accent') as AccentColor | null
    const savedSidebar = localStorage.getItem('hn-sidebar') as SidebarStyle | null

    if (savedTheme) setThemeState(savedTheme)
    if (savedAccent) setAccentColorState(savedAccent)
    if (savedSidebar) setSidebarStyleState(savedSidebar)

    setMounted(true)
  }, [])

  // Apply theme to document
  useEffect(() => {
    if (!mounted) return

    const root = document.documentElement

    // Apply theme class
    if (theme === 'light') {
      root.classList.add('light-theme')
      root.classList.remove('dark-theme')
    } else {
      root.classList.add('dark-theme')
      root.classList.remove('light-theme')
    }

    // Apply accent color as CSS variable
    root.style.setProperty('--accent-color', ACCENT_COLORS[accentColor])
    root.style.setProperty('--accent-color-name', accentColor)

    // Apply sidebar style
    root.setAttribute('data-sidebar', sidebarStyle)
  }, [theme, accentColor, sidebarStyle, mounted])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('hn-theme', newTheme)
  }

  const setAccentColor = (color: AccentColor) => {
    setAccentColorState(color)
    localStorage.setItem('hn-accent', color)
  }

  const setSidebarStyle = (style: SidebarStyle) => {
    setSidebarStyleState(style)
    localStorage.setItem('hn-sidebar', style)
  }

  // Prevent flash of wrong theme
  if (!mounted) {
    return null
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        accentColor,
        sidebarStyle,
        setTheme,
        setAccentColor,
        setSidebarStyle,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export { ACCENT_COLORS }
