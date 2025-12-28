import { getSession } from '@/lib/auth'
import { AdminNav } from '@/components/admin/AdminNav'
import { AdminContent } from '@/components/admin/AdminContent'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  // Allow login page without auth
  // The actual auth check happens in individual pages
  // This layout provides the navigation wrapper

  return (
    <div className="min-h-screen bg-gray-100">
      {session && <AdminNav email={session.email} />}
      {session ? (
        <AdminContent>{children}</AdminContent>
      ) : (
        <main>{children}</main>
      )}
    </div>
  )
}
