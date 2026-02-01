import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'HomeNest Nous',
  description: 'Real Estate Intelligence Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans bg-navy-900">
        {children}
      </body>
    </html>
  )
}
