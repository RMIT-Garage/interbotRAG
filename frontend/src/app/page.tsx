import type { Metadata } from 'next'
import Link from 'next/link'

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'Internbot'

const capabilities = [
  {
    name: 'Contract Checker',
    status: 'In rollout',
    summary: 'Supports safer internship contract decisions with policy-aligned checks.',
    icon: '📄',
  },
  {
    name: 'Self-Sourced Job Checker',
    status: 'In rollout',
    summary: 'Helps validate student-found roles against internship eligibility criteria.',
    icon: '💼',
  },
  {
    name: 'FAQ RAG Assistant',
    status: 'Planned',
    summary: 'Provides grounded policy answers with source-aware response patterns.',
    icon: '🤖',
  },
] as const

export const metadata: Metadata = {
  title: `Welcome to ${appName}`,
  description:
    'AI-assisted internship support with benchmark-driven quality checks and coordinator oversight.',
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <section className="rounded-3xl border bg-surface p-8 shadow-[var(--shadow-soft)] sm:p-12">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl space-y-5">
              <span className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-900">
                AI support for safer internship decisions
              </span>
              <p className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">{appName}</p>
              <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
                Built for compliance-first internship workflows.
              </h1>
              <p className="text-base leading-relaxed text-zinc-600 sm:text-lg">
                {appName} helps students and coordinators evaluate opportunities, verify requirements, and answer policy questions with transparent, source-aware assistance.
              </p>
            </div>
            <div className="w-full max-w-sm rounded-2xl border bg-background p-5">
              <p className="text-sm font-medium text-zinc-700">Start with your workspace</p>
              <p className="mt-1 text-sm text-zinc-500">Use the live assistant with chat and checker experiences.</p>
              <div className="mt-5 flex flex-col gap-3">
                <Link
                  href="/assistant"
                  className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
                >
                  Launch assistant
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {capabilities.map((capability) => (
            <article key={capability.name} className="rounded-2xl border bg-surface p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-2xl" aria-hidden="true">
                  {capability.icon}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    capability.status === 'Planned'
                      ? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                  }`}
                >
                  {capability.status}
                </span>
              </div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{capability.name}</h2>
              <p className="mt-2 text-sm text-zinc-600">{capability.summary}</p>
            </article>
          ))}
        </section>

        <section className="rounded-2xl border bg-surface p-8">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Trust and governance by design</h2>
          <ul className="mt-6 grid gap-3 md:grid-cols-3">
            <li className="rounded-xl bg-background p-4 text-sm text-zinc-600">
              <p className="font-medium text-zinc-800 dark:text-zinc-200">Quality gates</p>
              Benchmark-driven checks guide feature reliability.
            </li>
            <li className="rounded-xl bg-background p-4 text-sm text-zinc-600">
              <p className="font-medium text-zinc-800 dark:text-zinc-200">Grounded answers</p>
              Responses are designed to cite trusted policy context.
            </li>
            <li className="rounded-xl bg-background p-4 text-sm text-zinc-600">
              <p className="font-medium text-zinc-800 dark:text-zinc-200">Human oversight</p>
              Coordinators stay in control of final decisions.
            </li>
          </ul>
        </section>
      </div>
    </main>
  )
}
