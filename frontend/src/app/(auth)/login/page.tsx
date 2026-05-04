import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="space-y-6 rounded-2xl border bg-surface p-8 shadow-[var(--shadow-soft)]">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Authentication removed</h1>
        <p className="text-sm text-zinc-500">This demo is now open-access. You can launch the workspace directly.</p>
      </div>
      <Link
        href="/demo"
        className="inline-flex w-full items-center justify-center rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-600"
      >
        Launch demo
      </Link>
    </div>
  )
}
