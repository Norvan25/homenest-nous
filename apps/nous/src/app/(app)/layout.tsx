import { Sidebar } from '@/components/layout'
import { ToastProvider } from '@/components/ui'
import { AssistantWidget } from '@/components/assistant'
import { NorGuideBot } from '@/components/NorGuideBot'
import { ThemeProvider } from '@/contexts/ThemeContext'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <div className="flex h-screen theme-bg">
          <Sidebar />
          <main className="flex-1 overflow-auto p-6 theme-bg">
            {children}
          </main>
        </div>
        <AssistantWidget />
        <NorGuideBot />
      </ToastProvider>
    </ThemeProvider>
  )
}
