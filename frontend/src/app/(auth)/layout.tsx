import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Authentication',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen relative flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 overflow-hidden">
      {/* Animated pastel blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-300 mix-blend-multiply dark:mix-blend-screen filter blur-[100px] opacity-50 animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-red-300 mix-blend-multiply dark:mix-blend-screen filter blur-[120px] opacity-40 animate-pulse" style={{ animationDuration: '10s' }} />
      </div>

      <div className="w-full max-w-sm relative z-10">{children}</div>
    </div>
  )
}
