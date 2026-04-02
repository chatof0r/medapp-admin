import { redirect } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const authenticated = await isAuthenticated()
  if (!authenticated) redirect('/login')

  return (
    <div style={{display:'flex', minHeight:'100vh', background:'#f4f3ef'}}>
      <Sidebar />
      <main style={{flex:1, padding:'2rem', background:'#ffffff', color:'#1a1a18', overflowY:'auto'}}>
        {children}
      </main>
    </div>
  )
}
