import { Sidebar } from '@/components/layout'
import { ToastProvider } from '@/components/ui'
import { AssistantWidget } from '@/components/assistant'
import { NorGuideBot } from '@/components/NorGuideBot'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ToastProvider>
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6 bg-navy-900">
          {children}
        </main>
      </div>
      <AssistantWidget />
      <NorGuideBot />
    </ToastProvider>
  )
}
