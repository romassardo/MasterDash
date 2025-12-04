import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Si el usuario ya está logueado, redirigir al dashboard
  const session = await auth()
  
  if (session?.user) {
    redirect('/')
  }

  return children
}
