import type { Metadata } from 'next'
import { getServerSession } from '@/actions/auth.actions'

export const metadata: Metadata = {
  title: 'Profile',
}

export default async function ProfilePage() {
  const session = await getServerSession()

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-zinc-500 text-sm mt-1">Manage your account details.</p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
        <div>
          <p className="text-xs text-zinc-400 uppercase tracking-wide font-medium">Email</p>
          <p className="mt-1 text-sm">{session?.email ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-400 uppercase tracking-wide font-medium">User ID</p>
          <p className="mt-1 text-sm font-mono text-zinc-500">{session?.uid ?? '—'}</p>
        </div>
      </div>
    </div>
  )
}
