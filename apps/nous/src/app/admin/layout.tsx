export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // In production, add auth check here to redirect non-admins
  return <>{children}</>
}
