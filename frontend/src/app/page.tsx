import type { Metadata } from 'next'
import { cookies } from 'next/headers'
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

export default async function LandingPage() {
  const cookieStore = await cookies()
  const isAuthenticated = Boolean(cookieStore.get('__session')?.value)

  return (
    <main className="relative min-h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950 font-sans selection:bg-blue-200 selection:text-blue-900">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-red-200/50 mix-blend-multiply blur-3xl filter animate-blob" />
      <div className="absolute top-[20%] right-[-10%] h-[400px] w-[400px] rounded-full bg-blue-200/50 mix-blend-multiply blur-3xl filter animate-blob animation-delay-2000" />
      <div className="absolute bottom-[-10%] left-[20%] h-[600px] w-[600px] rounded-full bg-purple-200/50 mix-blend-multiply blur-3xl filter animate-blob animation-delay-4000" />
      <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-red-900/20 mix-blend-multiply blur-3xl filter animate-blob hidden dark:block" />
      <div className="absolute top-[20%] right-[-10%] h-[400px] w-[400px] rounded-full bg-blue-900/20 mix-blend-multiply blur-3xl filter animate-blob animation-delay-2000 hidden dark:block" />
      <div className="absolute bottom-[-10%] left-[20%] h-[600px] w-[600px] rounded-full bg-purple-900/20 mix-blend-multiply blur-3xl filter animate-blob animation-delay-4000 hidden dark:block" />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-16 sm:px-6 lg:px-8 z-10">
        
        {/* Header Section */}
        <section className="flex flex-col items-center justify-center text-center rounded-3xl border border-white/20 bg-white/40 backdrop-blur-xl p-10 shadow-2xl sm:p-16 dark:border-zinc-800/50 dark:bg-zinc-900/60 dark:shadow-zinc-900/50">
          <div className="max-w-3xl space-y-6 flex flex-col items-center">
            <span className="inline-flex cursor-default items-center rounded-full border border-blue-200 bg-blue-50/50 px-4 py-1.5 text-xs font-semibold text-blue-700 backdrop-blur-md transition-transform hover:scale-105 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300 shadow-sm">
              ✨ Internship AI assistance for students & coordinators
            </span>
            <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl bg-gradient-to-r from-red-400 via-purple-500 to-blue-500 bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient">
              {appName}
            </h1>
            <p className="max-w-2xl text-lg leading-relaxed text-zinc-600 sm:text-xl dark:text-zinc-400">
              Faster internship support with trustworthy AI. Internbot is built around compliance-first
              workflows, grounded responses, and human oversight.
            </p>
          </div>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row items-center">
            {isAuthenticated ? (
              <Link
                href="/demo"
                className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-zinc-900 px-8 py-3.5 text-base font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 dark:bg-white dark:text-zinc-900 dark:focus:ring-white dark:focus:ring-offset-zinc-900"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-red-500 to-blue-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></span>
                <span className="relative z-10 flex items-center gap-2">
                  Launch Demo
                  <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </span>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-zinc-900 px-8 py-3.5 text-base font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 dark:bg-white dark:text-zinc-900 dark:focus:ring-white dark:focus:ring-offset-zinc-900"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-red-500 to-blue-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></span>
                  <span className="relative z-10">Sign in</span>
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white/50 px-8 py-3.5 text-base font-semibold text-zinc-900 shadow-sm backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-white dark:hover:bg-zinc-800"
                >
                  Create account
                </Link>
              </>
            )}
          </div>
        </section>

        {/* Capabilities Grid */}
        <section className="grid gap-6 md:grid-cols-3">
          {capabilities.map((capability) => (
            <article 
              key={capability.name} 
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/20 bg-white/40 p-8 shadow-lg backdrop-blur-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-xl dark:border-zinc-800/50 dark:bg-zinc-900/50"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-white/5"></div>
              <div className="relative z-10">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-100 to-blue-100 text-2xl shadow-inner dark:from-red-900/30 dark:to-blue-900/30">
                    {capability.icon}
                  </div>
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${capability.status === 'Planned' ? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'}`}>
                    {capability.status}
                  </span>
                </div>
                <h2 className="mb-3 text-xl font-bold text-zinc-900 dark:text-white">{capability.name}</h2>
                <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{capability.summary}</p>
              </div>
            </article>
          ))}
        </section>

        {/* Info Grid */}
        <section className="rounded-3xl border border-white/20 bg-white/40 p-8 shadow-xl backdrop-blur-xl sm:p-12 dark:border-zinc-800/50 dark:bg-zinc-900/60">
          <div className="flex flex-col items-center text-center">
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-white">Trust and Governance First</h2>
            <p className="mt-4 max-w-2xl text-base text-zinc-600 dark:text-zinc-400">
              Current public routes are focused on service health and benchmark execution. Student-facing checker and FAQ APIs are actively being rolled out.
            </p>
          </div>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Quality Gates", desc: "Benchmark-driven quality gates guide model selection.", color: "red" },
              { title: "Grounded Truths", desc: "Answers are designed to stay grounded in verified policy context.", color: "purple" },
              { title: "Human Oversight", desc: "Coordinators retain decision oversight across internship workflows.", color: "blue" }
            ].map((item, i) => (
              <li key={i} className="flex flex-col items-center text-center rounded-2xl bg-white/50 p-6 shadow-sm border border-zinc-100/50 transition-all hover:bg-white/80 dark:bg-zinc-800/30 dark:border-zinc-700/50 dark:hover:bg-zinc-800/50">
                <div className={`mb-4 h-1 w-12 rounded-full bg-${item.color}-400`}></div>
                <strong className="block text-zinc-900 dark:text-zinc-100 font-semibold mb-2">{item.title}</strong>
                <span className="block text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xs">{item.desc}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
      
      {/* Base Animation Keyframes definition for arbitrary shapes.
          In a production build you'd put these in tailwind.config but we inject here for ease */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}} />
    </main>
  )
}
