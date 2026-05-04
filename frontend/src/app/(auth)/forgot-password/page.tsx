import Link from 'next/link'

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6 rounded-2xl border bg-surface p-8 shadow-[var(--shadow-soft)]">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Password reset disabled</h1>
        <p className="text-sm text-zinc-500">This demo no longer requires accounts or password management.</p>
      </div>
      <p className="text-center text-sm text-zinc-500">
        Continue directly to the workspace:{' '}
        <Link href="/demo" className="font-medium text-brand-500 hover:text-brand-600 hover:underline">
          Launch demo
        </Link>
      </p>
    </div>
  )
}
