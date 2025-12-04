import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  // Verificar que el usuario tiene rol de admin
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/')
  }

  return <>{children}</>
}

