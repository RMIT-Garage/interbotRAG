'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export function Navbar() {
  const router = useRouter()
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="lg:hidden font-semibold text-sm">
        {process.env.NEXT_PUBLIC_APP_NAME ?? 'App'}
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-3">
        {user && (
          <span className="text-sm text-zinc-500 hidden sm:block">{user.email}</span>
        )}
        <button
          type="button"
          onClick={handleSignOut}
          className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  )
}
