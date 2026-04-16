import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'Internbot'

const capabilities = [
  {
    name: 'Contract Checker',
    status: 'In rollout',
    summary: 'Supports safer internship contract decisions with policy-aligned checks.',
  },
  {
    name: 'Self-Sourced Job Checker',
    status: 'In rollout',
    summary: 'Helps validate student-found roles against internship eligibility criteria.',
  },
  {
    name: 'FAQ RAG Assistant',
    status: 'Planned',
    summary: 'Provides grounded policy answers with source-aware response patterns.',
  },
] as const

export const metadata: Metadata = {
  title: `Welcome to ${appName}`,
  description:
    'AI-assisted internship support with benchmark-driven quality checks and coordinator oversight.',
}

export default async function LandingPage() {
  const cookieStore = await cookies()
  const isAuthenticated = Boolean(cookieStore.get('__session')?.value)

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="max-w-3xl space-y-5">
            <span className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
              Internship AI assistance for students and coordinators
            </span>
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">{appName}</h1>
            <p className="text-base leading-7 text-zinc-600 sm:text-lg">
              Faster internship support with trustworthy AI. Internbot is built around compliance-first
              workflows, grounded responses, and human oversight.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {isAuthenticated ? (
              <Link
                href="/benchmarks"
                className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
              >
                Go to demo
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500"
                >
                  Create account
                </Link>
              </>
            )}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {capabilities.map((capability) => (
            <article key={capability.name} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-zinc-900">{capability.name}</h2>
                <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700">
                  {capability.status}
                </span>
              </div>
              <p className="text-sm leading-6 text-zinc-600">{capability.summary}</p>
            </article>
          ))}
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-zinc-900">Trust and governance first</h2>
          <ul className="mt-4 grid gap-3 text-sm text-zinc-600 sm:grid-cols-2 lg:grid-cols-3">
            <li className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
              Benchmark-driven quality gates guide model selection.
            </li>
            <li className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
              Answers are designed to stay grounded in verified policy context.
            </li>
            <li className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
              Coordinators retain decision oversight across internship workflows.
            </li>
          </ul>
          <p className="mt-4 text-sm text-zinc-500">
            Current backend public routes are focused on service health and benchmark execution.
            Student-facing checker and FAQ APIs are being rolled out.
          </p>
        </section>
      </div>
    </main>
  )
}
